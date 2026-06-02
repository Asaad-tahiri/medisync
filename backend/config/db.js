const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Sécurité : On cherche MONGODB_URI ou MONGO_URI, et si aucun n'existe, on prend l'adresse locale directe.
        const dbURI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medisync";
        
        await mongoose.connect(dbURI);
        
        console.log('Connexion à la base de données MongoDB réussie ! 🎉');
    } catch (error) {
        console.error('Erreur connexion MongoDB:', error.message);
        process.exit(1); // Arrête le serveur si la base de données ne marche pas
    }
};

module.exports = connectDB;