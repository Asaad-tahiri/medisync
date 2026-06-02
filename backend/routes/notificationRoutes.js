const express = require('express');
const router = express.Router();
const notifCtrl = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/notifications',              verifyToken, notifCtrl.getNotifications);
router.patch('/notifications/:id/read',   verifyToken, notifCtrl.markAsRead);
router.patch('/notifications/read-all',   verifyToken, notifCtrl.markAllAsRead);

module.exports = router;
