const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Unread Notification Count
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);

// Get User Notifications (Paginated)
router.get('/', verifyToken, notificationController.getNotifications);

// Mark All Notifications as Read
router.patch('/read-all', verifyToken, notificationController.markAllAsRead);

// Mark Single Notification as Read
router.patch('/:id/read', verifyToken, notificationController.markAsRead);

// Delete All Notifications
router.delete('/', verifyToken, notificationController.deleteAllNotifications);

// Delete Single Notification
router.delete('/:id', verifyToken, notificationController.deleteNotification);

module.exports = router;
