const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    patientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName:   { type: String, required: true },
    fileType:   { type: String, required: true },
    filePath:   { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
