require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Configuration de l'admin à créer
const ADMIN_CONFIG = {
    email: 'admin@medisync.ma',
    password: 'Admin@2026',         // À changer après première connexion
    firstName: 'Admin',
    lastName: 'MediSync',
    phone: ''
};

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connecté à MongoDB');

        // Vérifier qu'aucun admin n'existe déjà
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('⚠️  Un administrateur existe déjà :', existingAdmin.email);
            console.log('   Aucune action effectuée.');
            await mongoose.disconnect();
            return;
        }

        // Hash du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, salt);

        // Création de l'admin
        const admin = new User({
            ...ADMIN_CONFIG,
            password: hashedPassword,
            role: 'admin'
        });
        await admin.save();

        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('✅ Administrateur créé avec succès !');
        console.log('═══════════════════════════════════════════');
        console.log('   Email    :', ADMIN_CONFIG.email);
        console.log('   Password :', ADMIN_CONFIG.password);
        console.log('═══════════════════════════════════════════');
        console.log('⚠️  Changez le mot de passe après la 1ère connexion.');
        console.log('');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Erreur :', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createAdmin();