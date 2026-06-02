const Feedback    = require('../models/Feedback');
const Appointment = require('../models/Appointment');
const User        = require('../models/User');

exports.submitFeedback = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { rating, comment } = req.body;

        const appt = await Appointment.findById(appointmentId);
        if (!appt) return res.status(404).json({ message: 'Rendez-vous introuvable.' });

        if (req.user.role === 'patient' && appt.patientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        const existing = await Feedback.findOne({ appointmentId });
        if (existing) return res.status(400).json({ message: 'Avis déjà soumis pour ce rendez-vous.' });

        const feedback = new Feedback({
            patientId: appt.patientId,
            doctorId:  appt.doctorId,
            appointmentId,
            rating,
            comment
        });
        await feedback.save();

        // Recalcule la note moyenne du médecin
        const allFeedbacks = await Feedback.find({ doctorId: appt.doctorId });
        const avgRating = allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length;
        await User.findByIdAndUpdate(appt.doctorId, {
            rating: Math.round(avgRating * 10) / 10,
            ratingCount: allFeedbacks.length
        });

        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDoctorFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ doctorId: req.params.doctorId })
            .populate('patientId', 'firstName lastName')
            .sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
