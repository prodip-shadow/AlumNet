const notificationModel = require('../models/notification.model');
const userModel = require('../models/user.model');
const { emitToUser } = require('../sockets/notification.socket');


const processMessage = (rawMessage, actorId, cb) => {
  if (!rawMessage) return cb('');
  if (actorId && /{actor\s*}/i.test(rawMessage)) {
    userModel.getUserById(actorId, (err, res) => {
      if (!err && res && res.length > 0 && res[0].name) {
        cb(rawMessage.replace(/{actor\s*}/gi, res[0].name));
      } else {
        cb(rawMessage.replace(/{actor\s*}/gi, 'Someone'));
      }
    });
  } else {
    cb(rawMessage.replace(/{actor\s*}/gi, 'Someone'));
  }
};

const createNotification = (notificationData, io, callback) => {
  const { userId, actorUserId, type, entityType, referenceId, message: rawMessage } = notificationData;

  // Rule: Do NOT notify actor about their own action
  if (actorUserId !== null && actorUserId !== undefined && Number(userId) === Number(actorUserId)) {
    if (typeof callback === 'function') {
      return callback(null, null);
    }
    return;
  }

  processMessage(rawMessage, actorUserId, (finalMessage) => {
    const data = [
      userId,
      actorUserId || null,
      type,
      entityType || null,
      referenceId || null,
      finalMessage,
    ];

    notificationModel.createNotification(data, (err, result) => {
      if (err) {
        console.error('Failed to create notification in DB:', err.message);
        if (typeof callback === 'function') {
          return callback(err);
        }
        return;
      }

      const insertedId = result.insertId;

      // Fetch the created notification object to send exact DB payload
      notificationModel.getNotificationById(insertedId, (getErr, getResult) => {
        let notificationPayload = {
          id: insertedId,
          userId,
          actorUserId: actorUserId || null,
          type,
          entityType: entityType || null,
          referenceId: referenceId || null,
          message: finalMessage,
          isRead: false,
          createdAt: new Date().toISOString(),
        };

        if (!getErr && getResult && getResult.length > 0) {
          notificationPayload = getResult[0];
        }

        // Emit real-time notification to recipient via Socket.io if online
        try {
          emitToUser(io, userId, 'new-notification', notificationPayload);
        } catch (socketErr) {
          console.error('Socket emit error:', socketErr.message);
        }

        if (typeof callback === 'function') {
          return callback(null, notificationPayload);
        }
      });
    });
  });
};

const createBulkNotifications = (targetUserIds, actorUserId, type, entityType, referenceId, rawMessage, io, callback) => {
  if (!targetUserIds || targetUserIds.length === 0) {
    if (typeof callback === 'function') return callback(null, { affectedRows: 0 });
    return;
  }

  const validUserIds = targetUserIds.filter(
    (id) => actorUserId === null || actorUserId === undefined || Number(id) !== Number(actorUserId)
  );

  if (validUserIds.length === 0) {
    if (typeof callback === 'function') return callback(null, { affectedRows: 0 });
    return;
  }

  processMessage(rawMessage, actorUserId, (finalMessage) => {
    const rows = validUserIds.map((uId) => [
      uId,
      actorUserId || null,
      type,
      entityType || null,
      referenceId || null,
      finalMessage,
    ]);

    notificationModel.createBulkNotifications(rows, (err, result) => {
      if (err) {
        console.error('Failed to create bulk notifications:', err.message);
        if (typeof callback === 'function') return callback(err);
        return;
      }

      // Emit real-time socket events to online users
      try {
        const now = new Date().toISOString();
        validUserIds.forEach((uId) => {
          const payload = {
            userId: uId,
            actorUserId: actorUserId || null,
            type,
            entityType: entityType || null,
            referenceId: referenceId || null,
            message: finalMessage,
            isRead: false,
            createdAt: now,
          };
          emitToUser(io, uId, 'new-notification', payload);
        });
      } catch (socketErr) {
        console.error('Bulk socket emit error:', socketErr.message);
      }

      if (typeof callback === 'function') {
        return callback(null, result);
      }
    });
  });
};

module.exports = {
  createNotification,
  createBulkNotifications,
};
