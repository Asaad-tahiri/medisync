const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

const adminOnly = [verifyToken, checkRole('admin')];

router.get('/admin/doctors',        ...adminOnly, adminCtrl.getDoctors);
router.post('/admin/doctors',       ...adminOnly, adminCtrl.createDoctor);
router.put('/admin/doctors/:id',    ...adminOnly, adminCtrl.updateDoctor);
router.delete('/admin/doctors/:id', ...adminOnly, adminCtrl.deleteDoctor);

router.get('/admin/secretaries',        ...adminOnly, adminCtrl.getSecretaries);
router.post('/admin/secretaries',       ...adminOnly, adminCtrl.createSecretary);
router.delete('/admin/secretaries/:id', ...adminOnly, adminCtrl.deleteSecretary);
router.put('/admin/secretaries/:id', ...adminOnly, adminCtrl.updateSecretary);

router.get('/admin/stats',   ...adminOnly, adminCtrl.getStats);
router.get('/admin/clinic',  ...adminOnly, adminCtrl.getClinicInfo);
router.put('/admin/clinic',  ...adminOnly, adminCtrl.updateClinicInfo);

module.exports = router;
