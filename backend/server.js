const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

require('dotenv').config();
const connectDB = require('./config/db');

const authRoutes          = require('./routes/authRoutes');
const appointmentRoutes   = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const adminRoutes         = require('./routes/adminRoutes');
const notificationRoutes  = require('./routes/notificationRoutes');

const app = express();

// Dossier uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Connexion DB
connectDB();

// ✅ UN SEUL CORS, AVANT les routes, avec toutes les origines autorisées
const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:4201',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:4201'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Bloqué par CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api', authRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', medicalRecordRoutes);
app.use('/api', adminRoutes);
app.use('/api', notificationRoutes);

app.get('/', (req, res) => res.send('API MediSync operationnelle'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur demarre sur http://localhost:${PORT}`));