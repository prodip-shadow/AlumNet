const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/unread-count', verifyToken, notificationController.getUnreadCount);

router.get('/', verifyToken, notificationController.getNotifications);

router.patch('/read-all', verifyToken, notificationController.markAllAsRead);

router.patch('/:id/read', verifyToken, notificationController.markAsRead);

router.delete('/', verifyToken, notificationController.deleteAllNotifications);

router.delete('/:id', verifyToken, notificationController.deleteNotification);

module.exports = router;
