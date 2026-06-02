const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
    patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    symptoms:      { type: String },
    diagnosis:     { type: String },
    treatment:     { type: String },
    notes:         { type: String },
    createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
