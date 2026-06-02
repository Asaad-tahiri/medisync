const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware 1 : Vérifie le token
exports.verifyToken = async (req, res, next) => {
    try {
        // Récupère le token du header "Authorization: Bearer <token>"
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
        }

        // Vérifie et décode le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Récupère l'utilisateur en base (sans son mot de passe)
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur invalide.' });
        }
        
        next(); // ✅ Tout est OK, on passe à la suite
    } catch (error) {
        res.status(401).json({ message: 'Token invalide ou expiré.' });
    }
};

// Middleware 2 : Vérifie le rôle (ex: checkRole('medecin', 'admin'))
exports.checkRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Accès interdit. Rôles requis : ${roles.join(', ')}` 
            });
        }
        next();
    };
};