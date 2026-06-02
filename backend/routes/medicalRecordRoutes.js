const express = require('express');
const router = express.Router();
const multer     = require('multer');
const recordCtrl = require('../controllers/medicalRecordController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const allRoles = ['patient', 'doctor', 'secretary', 'admin'];

router.get('/patients/:id/records',
    verifyToken, checkRole(...allRoles), recordCtrl.getMedicalRecords);

router.post('/medical-records',
    verifyToken, checkRole('doctor'), recordCtrl.createRecord);

router.get('/patients/:id/prescriptions',
    verifyToken, checkRole(...allRoles), recordCtrl.getPrescriptions);

router.post('/prescriptions',
    verifyToken, checkRole('doctor'), recordCtrl.createPrescription);

router.get('/patients/:id/documents',
    verifyToken, checkRole(...allRoles), recordCtrl.getDocuments);

router.post('/patients/:id/documents',
    verifyToken, checkRole('patient', 'secretary', 'doctor'),
    upload.single('file'), recordCtrl.uploadDocument);

router.get('/patients/:id/invoices',
    verifyToken, checkRole(...allRoles), recordCtrl.getInvoices);

router.post('/invoices',
    verifyToken, checkRole('doctor', 'secretary'), recordCtrl.createInvoice);

router.get('/invoices',
    verifyToken, checkRole('secretary', 'admin', 'doctor'), recordCtrl.getAllInvoices);

router.patch('/invoices/:id/status',
    verifyToken, checkRole('secretary', 'admin'), recordCtrl.updateInvoiceStatus);
module.exports = router;