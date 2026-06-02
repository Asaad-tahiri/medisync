const express = require('express');
const router = express.Router();
const apptCtrl     = require('../controllers/appointmentController');
const feedbackCtrl = require('../controllers/feedbackController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.post('/appointments',
    verifyToken, checkRole('patient', 'secretary'), apptCtrl.createAppointment);

router.get('/appointments',
    verifyToken, apptCtrl.getAppointments);

router.put('/appointments/:id',
    verifyToken, checkRole('doctor', 'secretary', 'admin'), apptCtrl.updateAppointment);

router.patch('/appointments/:id/cancel',
    verifyToken, apptCtrl.cancelAppointment);

router.get('/doctors/:doctorId/available-slots',
    verifyToken, apptCtrl.getAvailableSlots);

router.post('/appointments/:appointmentId/feedback',
    verifyToken, checkRole('patient'), feedbackCtrl.submitFeedback);

router.get('/doctors/:doctorId/feedbacks',
    verifyToken, feedbackCtrl.getDoctorFeedbacks);

router.get('/doctor/my-patients',
    verifyToken, checkRole('doctor'), apptCtrl.getMyPatients);

module.exports = router;