const mongoose = require('mongoose');

const clinicSettingsSchema = new mongoose.Schema({
    name:    { type: String, required: true },
    address: { type: String },
    phone:   { type: String },
    email:   { type: String },
    logo:    { type: String },
    openingHours: {
        monday:    { open: String, close: String },
        tuesday:   { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday:  { open: String, close: String },
        friday:    { open: String, close: String },
        saturday:  { open: String, close: String },
        sunday:    { open: String, close: String }
    },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClinicSettings', clinicSettingsSchema);
