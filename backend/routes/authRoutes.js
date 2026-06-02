const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.post('/auth/register', authCtrl.register);
router.post('/auth/login',    authCtrl.login);
router.get('/auth/me',        verifyToken, authCtrl.getMe);
router.put('/auth/profile',   verifyToken, authCtrl.updateProfile);
router.get('/doctors',        verifyToken, authCtrl.getDoctors);
router.get('/doctors/search', verifyToken, authCtrl.getDoctors);
router.get('/patients/:id',   verifyToken, checkRole('doctor', 'secretary', 'admin'), authCtrl.getPatient);
router.post('/secretary/patients',
    verifyToken, checkRole('secretary'), authCtrl.createPatientBySecretary);

router.get('/secretary/patients',
    verifyToken, checkRole('secretary', 'admin'), authCtrl.getAllPatients);
module.exports = router;