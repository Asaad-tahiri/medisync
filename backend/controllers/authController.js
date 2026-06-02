const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const safeUser = (user) => ({
    _id: user._id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    photoUrl: user.photoUrl,
    dateOfBirth: user.dateOfBirth,
    socialSecurityNumber: user.socialSecurityNumber,
    allergies: user.allergies,
    antecedents: user.antecedents,
    specialty: user.specialty,
    languages: user.languages,
    consultationFee: user.consultationFee,
    sector: user.sector,
    city: user.city,
    rating: user.rating,
    twoFactorEnabled: user.twoFactorEnabled
});

exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;
        const role = 'patient'; // Forcé : seuls les patients peuvent s'inscrire publiquement

        if (!email || !password || !role || !firstName || !lastName) {
            return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });
        }

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Le mot de passe doit contenir : 8 caractères min, 1 majuscule, 1 chiffre et 1 caractère spécial.'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ email, password: hashedPassword, role, firstName, lastName, phone });
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: safeUser(user) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: safeUser(user) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        res.json(safeUser(req.user));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDoctors = async (req, res) => {
    try {
        const { specialty, city, language } = req.query;
        const query = { role: 'doctor' };
        if (specialty) query.specialty = specialty;
        if (city)      query.city = city;
        if (language)  query.languages = language;

        const doctors = await User.find(query)
            .select('-password -socialSecurityNumber -allergies -antecedents');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const allowed = ['firstName', 'lastName', 'phone', 'specialty', 'city', 'languages',
                 'consultationFee', 'sector', 'dateOfBirth', 'allergies', 'antecedents',
                 'socialSecurityNumber'];
        const updates = {};
        allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
        res.json(safeUser(user));
    } catch (error) {
        if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
        res.status(500).json({ error: error.message });
    }
};

exports.getPatient = async (req, res) => {
    try {
        const patient = await User.findById(req.params.id).select('-password -socialSecurityNumber');
        if (!patient) return res.status(404).json({ message: 'Patient introuvable.' });
        if (patient.role !== 'patient') return res.status(400).json({ message: "Cet utilisateur n'est pas un patient." });
        res.json(safeUser(patient));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Génère un mot de passe aléatoire respectant la regex
const generatePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '@$!%*?&';
    const all = upper + lower + digits + special;

    let pwd = '';
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 6; i++) pwd += all[Math.floor(Math.random() * all.length)];
    // Mélange
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
};

exports.createPatientBySecretary = async (req, res) => {
    try {
        const { email, firstName, lastName, phone, dateOfBirth, socialSecurityNumber, allergies, antecedents } = req.body;

        if (!email || !firstName || !lastName) {
            return res.status(400).json({ message: 'Email, prénom et nom sont obligatoires.' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        }

        const tempPassword = generatePassword();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        const patient = new User({
            email,
            password: hashedPassword,
            role: 'patient',
            firstName,
            lastName,
            phone,
            dateOfBirth,
            socialSecurityNumber,
            allergies: Array.isArray(allergies) ? allergies : [],
            antecedents: Array.isArray(antecedents) ? antecedents : []
        });
        await patient.save();

        // Renvoie le patient + le mot de passe en clair (UNE SEULE FOIS)
        res.status(201).json({
            patient: safeUser(patient),
            tempPassword
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllPatients = async (req, res) => {
    try {
        const patients = await User.find({ role: 'patient' })
            .select('firstName lastName email phone dateOfBirth socialSecurityNumber createdAt')
            .sort({ createdAt: -1 });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};