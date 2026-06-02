const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    rating:        { type: Number, min: 1, max: 5, required: true },
    comment:       { type: String },
    createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
