const MedicalRecord = require('../models/MedicalRecord');
const Prescription   = require('../models/Prescription');
const Document       = require('../models/Document');
const Invoice        = require('../models/Invoice');

const checkPatientAccess = (req, patientId) =>
    req.user.role === 'patient' && req.user._id.toString() !== patientId;

exports.getMedicalRecords = async (req, res) => {
    try {
        const { id: patientId } = req.params;
        if (checkPatientAccess(req, patientId))
            return res.status(403).json({ message: "Accès refusé." });

        const records = await MedicalRecord.find({ patientId })
            .populate('doctorId', 'firstName lastName specialty')
            .sort({ createdAt: -1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRecord = async (req, res) => {
    try {
        const record = new MedicalRecord({
            ...req.body,
            doctorId: req.user._id
        });
        await record.save();
        const populated = await record.populate('doctorId', 'firstName lastName specialty');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPrescriptions = async (req, res) => {
    try {
        const { id: patientId } = req.params;
        if (checkPatientAccess(req, patientId))
            return res.status(403).json({ message: "Accès refusé." });

        const prescriptions = await Prescription.find({ patientId })
            .populate('doctorId', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPrescription = async (req, res) => {
    try {
        const prescription = new Prescription({
            ...req.body,
            doctorId: req.user._id
        });
        await prescription.save();
        res.status(201).json(prescription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDocuments = async (req, res) => {
    try {
        const { id: patientId } = req.params;
        if (checkPatientAccess(req, patientId))
            return res.status(403).json({ message: "Accès refusé." });

        const docs = await Document.find({ patientId }).sort({ uploadedAt: -1 });
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu.' });

        const doc = new Document({
            patientId: req.params.id,
            fileName:  req.file.originalname,
            fileType:  req.file.mimetype,
            filePath:  req.file.path
        });
        await doc.save();
        res.status(201).json(doc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const { id: patientId } = req.params;
        if (checkPatientAccess(req, patientId))
            return res.status(403).json({ message: "Accès refusé." });

        const invoices = await Invoice.find({ patientId })
            .populate('doctorId', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        const invoice = new Invoice({ ...req.body, doctorId: req.user._id });
        await invoice.save();
        res.status(201).json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate('patientId', 'firstName lastName email phone')
            .populate('doctorId', 'firstName lastName specialty')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['paid', 'unpaid'].includes(status)) {
            return res.status(400).json({ message: 'Statut invalide.' });
        }
        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )
            .populate('patientId', 'firstName lastName email phone')
            .populate('doctorId', 'firstName lastName specialty');

        if (!invoice) return res.status(404).json({ message: 'Facture introuvable.' });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};