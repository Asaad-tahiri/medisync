    const bcrypt = require('bcryptjs');
    const User          = require('../models/User');
    const Appointment   = require('../models/Appointment');
    const Invoice       = require('../models/Invoice');
    const ClinicSettings = require('../models/ClinicSettings');

    // ===== MÉDECINS =====
    exports.getDoctors = async (req, res) => {
        try {
            const doctors = await User.find({ role: 'doctor' }).select('-password');
            res.json(doctors);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    exports.createDoctor = async (req, res) => {
        try {
            const { email, password, firstName, lastName, specialty, city, consultationFee, sector, languages, phone } = req.body;
            if (!email || !password || !firstName || !lastName) {
                return res.status(400).json({ message: 'Champs obligatoires manquants.' });
            }
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ message: 'Email déjà utilisé.' });

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const doctor = new User({
                email, password: hashedPassword, role: 'doctor',
                firstName, lastName, specialty, city, consultationFee, sector, languages, phone
            });
            await doctor.save();
            const { password: _, ...safe } = doctor.toObject();
            res.status(201).json(safe);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    exports.updateDoctor = async (req, res) => {
        try {
            const { password, ...updates } = req.body;
            const doctor = await User.findOneAndUpdate(
                { _id: req.params.id, role: 'doctor' },
                updates,
                { new: true }
            ).select('-password');
            if (!doctor) return res.status(404).json({ message: 'Médecin introuvable.' });
            res.json(doctor);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    exports.deleteDoctor = async (req, res) => {
        try {
            const doctor = await User.findOneAndDelete({ _id: req.params.id, role: 'doctor' });
            if (!doctor) return res.status(404).json({ message: 'Médecin introuvable.' });
            res.json({ message: 'Médecin supprimé.' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // ===== SECRÉTAIRES =====
    exports.getSecretaries = async (req, res) => {
        try {
            const secretaries = await User.find({ role: 'secretary' }).select('-password');
            res.json(secretaries);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    exports.createSecretary = async (req, res) => {
        try {
            const { email, password, firstName, lastName, phone } = req.body;
            if (!email || !password || !firstName || !lastName) {
                return res.status(400).json({ message: 'Champs obligatoires manquants.' });
            }
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ message: 'Email déjà utilisé.' });

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const secretary = new User({ email, password: hashedPassword, role: 'secretary', firstName, lastName, phone });
            await secretary.save();
            const { password: _, ...safe } = secretary.toObject();
            res.status(201).json(safe);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
    exports.updateSecretary = async (req, res) => {
    try {
        const { password, ...updates } = req.body;
        const sec = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'secretary' },
            updates,
            { new: true }
        ).select('-password');
        if (!sec) return res.status(404).json({ message: 'Secrétaire introuvable.' });
        res.json(sec);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
    exports.deleteSecretary = async (req, res) => {
        try {
            const sec = await User.findOneAndDelete({ _id: req.params.id, role: 'secretary' });
            if (!sec) return res.status(404).json({ message: 'Secrétaire introuvable.' });
            res.json({ message: 'Secrétaire supprimé(e).' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // ===== STATISTIQUES =====
    exports.getStats = async (req, res) => {
        try {
            const [totalAppointments, totalPatients, totalDoctors, invoices, byDoctor] = await Promise.all([
                Appointment.countDocuments(),
                User.countDocuments({ role: 'patient' }),
                User.countDocuments({ role: 'doctor' }),
                Invoice.find(),
                Appointment.aggregate([
                    { $group: { _id: '$doctorId', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 },
                    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'doctor' } },
                    { $unwind: '$doctor' },
                    { $project: { name: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] }, count: 1 } }
                ])
            ]);

            const noShowCount = await Appointment.countDocuments({ status: 'no-show' });
            const noShowRate  = totalAppointments > 0 ? Math.round((noShowCount / totalAppointments) * 100) : 0;

            const revenueByDay = invoices.reduce((acc, inv) => {
                const day = inv.createdAt.toISOString().split('T')[0];
                const existing = acc.find(r => r.date === day);
                if (existing) existing.amount += inv.totalAmount;
                else acc.push({ date: day, amount: inv.totalAmount });
                return acc;
            }, []).sort((a, b) => a.date.localeCompare(b.date));

            res.json({
                totalAppointments,
                totalPatients,
                totalDoctors,
                appointmentsByDoctor: byDoctor,
                revenueByDay,
                noShowRate
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // ===== CLINIQUE =====
    exports.getClinicInfo = async (req, res) => {
        try {
            let clinic = await ClinicSettings.findOne();
            if (!clinic) {
                clinic = new ClinicSettings({ name: 'MediSync Clinic' });
                await clinic.save();
            }
            res.json(clinic);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    exports.updateClinicInfo = async (req, res) => {
        try {
            let clinic = await ClinicSettings.findOne();
            if (!clinic) {
                clinic = new ClinicSettings({ ...req.body });
            } else {
                Object.assign(clinic, req.body, { updatedAt: new Date() });
            }
            await clinic.save();
            res.json(clinic);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
