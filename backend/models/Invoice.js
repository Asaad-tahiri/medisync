const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount:      { type: Number, required: true }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
    patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    items:         [invoiceItemSchema],
    totalAmount:   { type: Number, required: true },
    status:        { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
    pdfPath:       { type: String },
    createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);