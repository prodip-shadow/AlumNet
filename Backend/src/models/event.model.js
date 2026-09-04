const db = require('../config/db');

// Check Creator Permission
const checkCreatorPermission = (userId, callback) => {
  const sql = `
    SELECT *
    FROM event_creator_permissions
    WHERE userId = ?
  `;

  db.query(sql, [userId], callback);
};

// Grant Creator Permission
const grantCreatorPermission = (userId, grantedBy, callback) => {
  const sql = `
    INSERT INTO event_creator_permissions (userId, grantedBy)
    VALUES (?, ?)
  `;

  db.query(sql, [userId, grantedBy], callback);
};

// Revoke Creator Permission
const revokeCreatorPermission = (userId, callback) => {
  const sql = `
    DELETE FROM event_creator_permissions
    WHERE userId = ?
  `;

  db.query(sql, [userId], callback);
};

// List All Permitted Users
const listPermittedUsers = (callback) => {
  const sql = `
    SELECT
      event_creator_permissions.id,
      event_creator_permissions.userId,
      event_creator_permissions.grantedBy,
      event_creator_permissions.createdAt,
      u1.name AS userName,
      u1.email AS userEmail,
      u1.role AS userRole,
      u2.name AS grantedByName
    FROM event_creator_permissions
    INNER JOIN users u1
      ON event_creator_permissions.userId = u1.id
    INNER JOIN users u2
      ON event_creator_permissions.grantedBy = u2.id
    ORDER BY event_creator_permissions.createdAt DESC
  `;

  db.query(sql, callback);
};

// Create Event
const createEvent = (data, callback) => {
  const sql = `
    INSERT INTO events (
      creatorUserId,
      title,
      description,
      location,
      eventDate,
      registrationDeadline,
      registrationFee,
      isFree,
      maxParticipants,
      contactInfo,
      bannerImageUrl,
      isRegistrationOpen,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'ACTIVE')
  `;

  db.query(sql, data, callback);
};

// Get All Events (Feed - ACTIVE events sorted by eventDate ASC)
const getAllEvents = (limit, offset, callback) => {
  const sql = `
    SELECT
      events.*,
      users.name AS creatorName,
      users.profileImageUrl AS creatorProfileImageUrl,
      users.role AS creatorRole,
      (SELECT COUNT(*) FROM event_registrations WHERE event_registrations.eventId = events.id AND (event_registrations.paymentStatus IN ('PAID', 'FREE') OR event_registrations.registrationStatus = 'REGISTERED')) AS currentRegistrationCount
    FROM events
    INNER JOIN users
      ON events.creatorUserId = users.id
    WHERE events.status = 'ACTIVE'
    ORDER BY events.createdAt DESC, events.eventDate ASC
    LIMIT ? OFFSET ?
  `;

  db.query(sql, [limit, offset], callback);
};

// Get My Events (Creator Dashboard)
const getMyEvents = (creatorUserId, callback) => {
  const sql = `
    SELECT
      events.*,
      (SELECT COUNT(*) FROM event_registrations WHERE event_registrations.eventId = events.id AND event_registrations.registrationStatus = 'REGISTERED') AS registrationCount,
      (SELECT COUNT(*) FROM event_registrations WHERE event_registrations.eventId = events.id AND event_registrations.paymentStatus = 'PAID') AS paymentCount,
      (SELECT COALESCE(SUM(amount), 0) FROM event_registrations WHERE event_registrations.eventId = events.id AND event_registrations.paymentStatus = 'PAID') AS totalCollectedAmount
    FROM events
    WHERE events.creatorUserId = ?
    ORDER BY events.createdAt DESC
  `;

  db.query(sql, [creatorUserId], callback);
};

// Get Single Event By ID
const getEventById = (id, callback) => {
  const sql = `
    SELECT
      events.*,
      users.name AS creatorName,
      users.profileImageUrl AS creatorProfileImageUrl,
      users.role AS creatorRole,
      (SELECT COUNT(*) FROM event_registrations WHERE event_registrations.eventId = events.id AND (event_registrations.paymentStatus IN ('PAID', 'FREE') OR event_registrations.registrationStatus = 'REGISTERED')) AS currentRegistrationCount
    FROM events
    INNER JOIN users
      ON events.creatorUserId = users.id
    WHERE events.id = ?
  `;

  db.query(sql, [id], callback);
};

// Update Event
const updateEvent = (id, data, callback) => {
  const sql = `
    UPDATE events
    SET
      title = ?,
      description = ?,
      location = ?,
      eventDate = ?,
      registrationDeadline = ?,
      registrationFee = ?,
      isFree = ?,
      maxParticipants = ?,
      contactInfo = ?,
      bannerImageUrl = ?,
      updatedAt = NOW()
    WHERE id = ?
  `;

  db.query(sql, [...data, id], callback);
};

// Update Event Status & Registration Status
const updateEventStatus = (id, status, isRegistrationOpen, callback) => {
  const sql = `
    UPDATE events
    SET
      status = ?,
      isRegistrationOpen = ?,
      updatedAt = NOW()
    WHERE id = ?
  `;

  db.query(sql, [status, isRegistrationOpen, id], callback);
};

// Delete Event
const deleteEvent = (id, callback) => {
  const sql = `
    DELETE FROM events
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Check User Registration
const checkUserRegistration = (eventId, userId, callback) => {
  const sql = `
    SELECT *
    FROM event_registrations
    WHERE eventId = ? AND userId = ?
  `;

  db.query(sql, [eventId, userId], callback);
};

// Create Free Registration
const createFreeRegistration = (eventId, userId, callback) => {
  const sql = `
    INSERT INTO event_registrations (
      eventId,
      userId,
      amount,
      paymentStatus,
      registrationStatus
    )
    VALUES (?, ?, 0.00, 'FREE', 'REGISTERED')
  `;

  db.query(sql, [eventId, userId], callback);
};

// Upsert Pending Paid Registration (Stripe Session)
const upsertPendingRegistration = (eventId, userId, stripeSessionId, amount, callback) => {
  const sql = `
    INSERT INTO event_registrations (
      eventId,
      userId,
      stripeSessionId,
      amount,
      paymentStatus,
      registrationStatus
    )
    VALUES (?, ?, ?, ?, 'PENDING', 'REGISTERED')
    ON DUPLICATE KEY UPDATE
      stripeSessionId = VALUES(stripeSessionId),
      amount = VALUES(amount),
      paymentStatus = 'PENDING',
      registrationStatus = 'REGISTERED'
  `;

  db.query(sql, [eventId, userId, stripeSessionId, amount], callback);
};

// Get Registration By Stripe Session ID
const getRegistrationByStripeSessionId = (stripeSessionId, callback) => {
  const sql = `
    SELECT *
    FROM event_registrations
    WHERE stripeSessionId = ?
  `;

  db.query(sql, [stripeSessionId], callback);
};

// Update Registration Payment Status (Webhook)
const updateRegistrationPaymentStatus = (stripeSessionId, paymentIntentId, paymentStatus, registrationStatus, callback) => {
  let sql = `
    UPDATE event_registrations
    SET
      paymentStatus = ?,
      registrationStatus = ?
  `;

  const params = [paymentStatus, registrationStatus];

  if (paymentIntentId) {
    sql += `, paymentIntentId = ?`;
    params.push(paymentIntentId);
  }

  sql += ` WHERE stripeSessionId = ?`;
  params.push(stripeSessionId);

  db.query(sql, params, callback);
};

// Get Registered Users For Event (Creator Dashboard)
const getEventRegistrations = (eventId, callback) => {
  const sql = `
    SELECT
      event_registrations.id AS registrationId,
      event_registrations.eventId,
      event_registrations.userId,
      event_registrations.amount,
      event_registrations.paymentStatus,
      event_registrations.registrationStatus,
      event_registrations.createdAt AS registrationTime,
      users.name,
      users.email,
      users.profileImageUrl,
      users.role
    FROM event_registrations
    INNER JOIN users
      ON event_registrations.userId = users.id
    WHERE event_registrations.eventId = ?
    ORDER BY event_registrations.createdAt DESC
  `;

  db.query(sql, [eventId], callback);
};

// Get User Payment History
const getUserPaymentHistory = (userId, callback) => {
  const sql = `
    SELECT
      event_registrations.id AS registrationId,
      event_registrations.eventId,
      events.title AS eventName,
      events.eventDate,
      event_registrations.amount,
      events.isFree,
      event_registrations.paymentStatus,
      event_registrations.registrationStatus,
      event_registrations.createdAt AS registrationDate
    FROM event_registrations
    INNER JOIN events
      ON event_registrations.eventId = events.id
    WHERE event_registrations.userId = ?
    ORDER BY event_registrations.createdAt DESC
  `;

  db.query(sql, [userId], callback);
};

// Get Registration By Payment Intent ID
const getRegistrationByPaymentIntentId = (paymentIntentId, callback) => {
  const sql = `
    SELECT *
    FROM event_registrations
    WHERE paymentIntentId = ?
  `;

  db.query(sql, [paymentIntentId], callback);
};

// Update Registration Payment Status By Payment Intent ID
const updateRegistrationByPaymentIntentId = (paymentIntentId, paymentStatus, registrationStatus, callback) => {
  const sql = `
    UPDATE event_registrations
    SET
      paymentStatus = ?,
      registrationStatus = ?
    WHERE paymentIntentId = ?
  `;

  db.query(sql, [paymentStatus, registrationStatus, paymentIntentId], callback);
};

module.exports = {
  checkCreatorPermission,
  grantCreatorPermission,
  revokeCreatorPermission,
  listPermittedUsers,
  createEvent,
  getAllEvents,
  getMyEvents,
  getEventById,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  checkUserRegistration,
  createFreeRegistration,
  upsertPendingRegistration,
  getRegistrationByStripeSessionId,
  getRegistrationByPaymentIntentId,
  updateRegistrationPaymentStatus,
  updateRegistrationByPaymentIntentId,
  getEventRegistrations,
  getUserPaymentHistory,
};
