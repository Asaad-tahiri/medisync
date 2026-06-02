const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

exports.createAppointment = async (req, res) => {
    try {
        const { doctorId, dateTime, duration, motif, forThirdParty, forThirdPartyName, notes } = req.body;

        if (!doctorId || !dateTime || !duration || !motif) {
            return res.status(400).json({ message: 'Champs obligatoires manquants : doctorId, dateTime, duration, motif.' });
        }

        const parsedDate = new Date(dateTime);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: 'Format de date invalide. Utilisez une date et une heure complètes.' });
        }

        let patientId;
        if (req.user.role === 'patient') {
            patientId = req.user._id;
        } else if (req.user.role === 'secretary') {
            patientId = req.body.patientId;
            if (!patientId) {
                return res.status(400).json({ message: 'La secrétaire doit préciser le patientId.' });
            }
        } else {
            return res.status(403).json({ message: 'Seuls les patients et secrétaires peuvent créer un rendez-vous.' });
        }

        const appt = new Appointment({
            patientId, doctorId,
            dateTime: parsedDate,
            duration: Number(duration),
            motif, forThirdParty, forThirdPartyName, notes
        });
        await appt.save();

        await Notification.create({
            userId: patientId,
            type: 'appointment',
            message: `Votre rendez-vous du ${parsedDate.toLocaleDateString('fr-FR')} a été confirmé.`
        });

        const populated = await appt.populate([
            { path: 'patientId', select: 'firstName lastName phone' },
            { path: 'doctorId',  select: 'firstName lastName specialty' }
        ]);
        res.status(201).json(populated);
    } catch (error) {
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.getAppointments = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'patient')  query.patientId = req.user._id;
        if (req.user.role === 'doctor')   query.doctorId  = req.user._id;

        const appointments = await Appointment.find(query)
            .populate('patientId', 'firstName lastName phone')
            .populate('doctorId',  'firstName lastName specialty')
            .sort({ dateTime: 1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        const appt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('patientId', 'firstName lastName phone')
            .populate('doctorId',  'firstName lastName specialty');

        if (!appt) return res.status(404).json({ message: 'Rendez-vous introuvable.' });
        res.json(appt);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.cancelAppointment = async (req, res) => {
    try {
        const appt = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
            { new: true }
        );
        if (!appt) return res.status(404).json({ message: 'Rendez-vous introuvable.' });
        res.json({ message: 'Rendez-vous annulé.', appointment: appt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAvailableSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date requise.' });

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const booked = await Appointment.find({
            doctorId,
            dateTime: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ['cancelled'] }
        }).select('dateTime duration');

        const allSlots = [];
        for (let h = 9; h < 17; h++) {
            for (let m = 0; m < 60; m += 30) {
                const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                const slotDate = new Date(date);
                slotDate.setHours(h, m, 0, 0);
                const isBooked = booked.some(a => {
                    const start = new Date(a.dateTime);
                    const end   = new Date(start.getTime() + a.duration * 60000);
                    return slotDate >= start && slotDate < end;
                });
                allSlots.push({ time: t, available: !isBooked });
            }
        }
        res.json(allSlots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMyPatients = async (req, res) => {
    try {
        // Récupère tous les RDV du médecin connecté avec patients peuplés
        const appts = await Appointment.find({ doctorId: req.user._id })
            .populate('patientId', 'firstName lastName email phone dateOfBirth')
            .sort({ dateTime: -1 });

        // Agrège : 1 entrée unique par patient + stats
        const patientsMap = new Map();
        appts.forEach(appt => {
            if (!appt.patientId) return;
            const id = appt.patientId._id.toString();
            if (!patientsMap.has(id)) {
                patientsMap.set(id, {
                    _id: appt.patientId._id,
                    firstName: appt.patientId.firstName,
                    lastName: appt.patientId.lastName,
                    email: appt.patientId.email,
                    phone: appt.patientId.phone,
                    dateOfBirth: appt.patientId.dateOfBirth,
                    totalAppointments: 0,
                    completedAppointments: 0,
                    lastAppointment: appt.dateTime,
                    nextAppointment: null
                });
            }
            const p = patientsMap.get(id);
            p.totalAppointments++;
            if (appt.status === 'completed') p.completedAppointments++;
            // Prochain RDV à venir (scheduled + futur)
            const apptDate = new Date(appt.dateTime);
            if (appt.status === 'scheduled' && apptDate > new Date()) {
                if (!p.nextAppointment || apptDate < new Date(p.nextAppointment)) {
                    p.nextAppointment = appt.dateTime;
                }
            }
        });

        // Trie par dernier RDV (plus récent en premier)
        const patients = Array.from(patientsMap.values())
            .sort((a, b) => new Date(b.lastAppointment).getTime() - new Date(a.lastAppointment).getTime());

        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};