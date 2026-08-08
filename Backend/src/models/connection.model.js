const db = require('../config/db');

// Check Connection in Both Directions (A -> B or B -> A)
const checkConnection = (userId1, userId2, callback) => {
  const sql = `
    SELECT *
    FROM connections
    WHERE (requesterId = ? AND recipientId = ?)
       OR (requesterId = ? AND recipientId = ?)
  `;

  db.query(sql, [userId1, userId2, userId2, userId1], callback);
};

// Check Accepted Connection in Either Direction
const checkAcceptedConnection = (userId1, userId2, callback) => {
  const sql = `
    SELECT id
    FROM connections
    WHERE ((requesterId = ? AND recipientId = ?) OR (requesterId = ? AND recipientId = ?))
      AND status = 'ACCEPTED'
  `;

  db.query(sql, [userId1, userId2, userId2, userId1], callback);
};

// Send Connection Request
const sendRequest = (requesterId, recipientId, callback) => {
  const sql = `
    INSERT INTO connections (requesterId, recipientId, status)
    VALUES (?, ?, 'PENDING')
  `;

  db.query(sql, [requesterId, recipientId], callback);
};

// Get Incoming Pending Requests
const getIncomingRequests = (recipientId, callback) => {
  const sql = `
    SELECT
      connections.*,
      users.name,
      users.profileImageUrl,
      users.role
    FROM connections
    INNER JOIN users
      ON connections.requesterId = users.id
    WHERE connections.recipientId = ?
      AND connections.status = 'PENDING'
    ORDER BY connections.createdAt DESC
  `;

  db.query(sql, [recipientId], callback);
};

// Get Outgoing Pending Requests
const getOutgoingRequests = (requesterId, callback) => {
  const sql = `
    SELECT
      connections.*,
      users.name,
      users.profileImageUrl,
      users.role
    FROM connections
    INNER JOIN users
      ON connections.recipientId = users.id
    WHERE connections.requesterId = ?
      AND connections.status = 'PENDING'
    ORDER BY connections.createdAt DESC
  `;

  db.query(sql, [requesterId], callback);
};

// Get All Accepted Connections for a User
const getMyConnections = (userId, callback) => {
  const sql = `
    SELECT
      connections.id AS connectionId,
      CASE
        WHEN connections.requesterId = ? THEN connections.recipientId
        ELSE connections.requesterId
      END AS connectedUserId,
      users.name,
      users.profileImageUrl,
      users.role,
      alumni_profiles.currentPosition,
      alumni_profiles.currentCompany
    FROM connections
    INNER JOIN users
      ON users.id = CASE
        WHEN connections.requesterId = ? THEN connections.recipientId
        ELSE connections.requesterId
      END
    LEFT JOIN alumni_profiles
      ON users.id = alumni_profiles.userId
    WHERE (connections.requesterId = ? OR connections.recipientId = ?)
      AND connections.status = 'ACCEPTED'
    ORDER BY connections.updatedAt DESC
  `;

  db.query(sql, [userId, userId, userId, userId], callback);
};

// Get Connection By ID
const getConnectionById = (id, callback) => {
  const sql = `
    SELECT *
    FROM connections
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Update Connection Status (ACCEPTED / REJECTED)
const updateStatus = (id, status, callback) => {
  const sql = `
    UPDATE connections
    SET status = ?, updatedAt = NOW()
    WHERE id = ?
  `;

  db.query(sql, [status, id], callback);
};

// Delete Connection (Unfriend)
const deleteConnection = (id, callback) => {
  const sql = `
    DELETE FROM connections
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

module.exports = {
  checkConnection,
  checkAcceptedConnection,
  sendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  getMyConnections,
  getConnectionById,
  updateStatus,
  deleteConnection,
};
