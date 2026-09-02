const db = require('../config/db');

// Create single notification
const createNotification = (data, callback) => {
  const sql = `
    INSERT INTO notifications (
      userId,
      actorUserId,
      type,
      entityType,
      referenceId,
      message
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, data, callback);
};

// Create bulk notifications (e.g. for NEW_EVENT to all active users)
const createBulkNotifications = (rows, callback) => {
  if (!rows || rows.length === 0) {
    return callback(null, { affectedRows: 0 });
  }

  const sql = `
    INSERT INTO notifications (
      userId,
      actorUserId,
      type,
      entityType,
      referenceId,
      message
    )
    VALUES ?
  `;

  db.query(sql, [rows], callback);
};

// Get Notification By ID
const getNotificationById = (id, callback) => {
  const sql = `
    SELECT *
    FROM notifications
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Get User Notifications (Paginated)
const getUserNotifications = (userId, limit, offset, callback) => {
  const sql = `
    SELECT
      notifications.id,
      notifications.userId,
      notifications.actorUserId,
      users.name AS actorName,
      users.profileImageUrl AS actorProfileImageUrl,
      notifications.type,
      notifications.entityType,
      notifications.referenceId,
      notifications.message,
      notifications.isRead,
      notifications.createdAt
    FROM notifications
    LEFT JOIN users
      ON notifications.actorUserId = users.id
    WHERE notifications.userId = ?
    ORDER BY notifications.createdAt DESC
    LIMIT ? OFFSET ?
  `;

  db.query(sql, [userId, limit, offset], callback);
};

// Get Unread Count for User
const getUnreadCount = (userId, callback) => {
  const sql = `
    SELECT COUNT(*) AS unreadCount
    FROM notifications
    WHERE userId = ? AND isRead = FALSE
  `;

  db.query(sql, [userId], callback);
};

// Mark Single Notification as Read
const markNotificationAsRead = (id, userId, callback) => {
  const sql = `
    UPDATE notifications
    SET isRead = TRUE
    WHERE id = ? AND userId = ?
  `;

  db.query(sql, [id, userId], callback);
};

// Mark All Notifications as Read for User
const markAllNotificationsAsRead = (userId, callback) => {
  const sql = `
    UPDATE notifications
    SET isRead = TRUE
    WHERE userId = ? AND isRead = FALSE
  `;

  db.query(sql, [userId], callback);
};

// Delete Single Notification (strict user ownership)
const deleteNotification = (id, userId, callback) => {
  const sql = `
    DELETE FROM notifications
    WHERE id = ? AND userId = ?
  `;

  db.query(sql, [id, userId], callback);
};

// Delete All Notifications for User
const deleteAllNotifications = (userId, callback) => {
  const sql = `
    DELETE FROM notifications
    WHERE userId = ?
  `;

  db.query(sql, [userId], callback);
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getNotificationById,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
};
