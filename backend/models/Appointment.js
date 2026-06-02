const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dateTime:  { type: Date, required: true },
    duration:  { type: Number, enum: [15, 30, 60], required: true },
    motif: {
        type: String,
        enum: ['consultation', 'suivi', 'urgence', 'bilan'],
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },
    forThirdParty:     { type: Boolean, default: false },
    forThirdPartyName: { type: String },
    notes:             { type: String },
    createdAt:         { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
