const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'secretary', 'admin'],
        required: true
    },
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    phone:     { type: String },
    photoUrl:  { type: String },
    twoFactorEnabled: { type: Boolean, default: false },

    // Patient
    dateOfBirth:           { type: Date },
    socialSecurityNumber:  { type: String },
    allergies:             [String],
    antecedents:           [String],

    // Doctor
    specialty:       { type: String },
    languages:       [String],
    consultationFee: { type: Number },
    sector:          { type: Number, enum: [1, 2, 3] },
    city:            { type: String },
    rating:          { type: Number, default: 0 },
    ratingCount:     { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
