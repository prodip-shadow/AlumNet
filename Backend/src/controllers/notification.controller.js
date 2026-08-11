const notificationModel = require('../models/notification.model');
const { emitToUser } = require('../sockets/notification.socket');

// Get Notifications (Paginated)
const getNotifications = (req, res) => {
  const userId = req.user.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize) || 20);

  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  notificationModel.getUserNotifications(userId, limit, offset, (err, notifications) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    const formattedNotifications = notifications.map((n) => ({
      ...n,
      isRead: Boolean(n.isRead),
    }));

    return res.status(200).json({
      success: true,
      notifications: formattedNotifications,
      page,
      pageSize,
    });
  });
};

// Get Unread Count
const getUnreadCount = (req, res) => {
  const userId = req.user.id;

  notificationModel.getUnreadCount(userId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    const unreadCount = result[0]?.unreadCount ? Number(result[0].unreadCount) : 0;

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  });
};

// Mark Single Notification as Read
const markAsRead = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  notificationModel.getNotificationById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    const notification = result[0];

    // Ownership verification
    if (Number(notification.userId) !== Number(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to notification',
      });
    }

    notificationModel.markNotificationAsRead(id, userId, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    });
  });
};

// Mark All Notifications as Read
const markAllAsRead = (req, res) => {
  const userId = req.user.id;

  notificationModel.markAllNotificationsAsRead(userId, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  });
};

// Delete Single Notification
const deleteNotification = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  notificationModel.getNotificationById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    const notification = result[0];

    // Security check: Notification MUST belong to authenticated user
    if (Number(notification.userId) !== Number(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to notification',
      });
    }

    notificationModel.deleteNotification(id, userId, (err, deleteResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or access denied',
        });
      }

      // Synchronize multiple tabs of the user
      const io = req.app.get('io');
      if (io) {
        emitToUser(io, userId, 'notification-deleted', { id: Number(id) });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      });
    });
  });
};

// Delete All Notifications for Authenticated User
const deleteAllNotifications = (req, res) => {
  const userId = req.user.id;

  notificationModel.deleteAllNotifications(userId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    const deletedCount = result?.affectedRows !== undefined ? Number(result.affectedRows) : 0;

    // Synchronize multiple tabs of the user
    const io = req.app.get('io');
    if (io) {
      emitToUser(io, userId, 'notifications-deleted', { all: true });
    }

    if (deletedCount === 0) {
      return res.status(200).json({
        success: true,
        message: 'No notifications to delete',
        deletedCount: 0,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully',
      deletedCount,
    });
  });
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};
