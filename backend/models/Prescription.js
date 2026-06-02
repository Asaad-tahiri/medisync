const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name:      { type: String, required: true },
    dosage:    { type: String, required: true },
    frequency: { type: String, required: true },
    duration:  { type: String, required: true }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
    medicalRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
    patientId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicines:       [medicineSchema],
    pdfPath:         { type: String },
    createdAt:       { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
