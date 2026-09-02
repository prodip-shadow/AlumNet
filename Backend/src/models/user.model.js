
const db = require('../config/db');

// Create User
const createUser = (data, callback) => {
  const sql = `
    INSERT INTO users (name,email, password, profileImageUrl)
    VALUES(?,?,?,?)
    `;
  db.query(sql, data, callback);
};

// Get User By Email
const getUserByEmail = (email, callback) => {
  const sql = `SELECT * FROM users WHERE email = ?`;
  db.query(sql, [email], callback);
};

// Get User By Id
const getUserById = (id, callback) => {
  const sql = `SELECT * FROM users WHERE id = ?`;

  db.query(sql, [id], callback);
};

// Save Refresh Token
const saveRefreshToken = (id, refreshToken, expiresAt, callback) => {
  const sql = `
    UPDATE users
    SET refreshToken = ?, refreshTokenExpiresAt = ?
    WHERE id = ?
  `;

  db.query(sql, [refreshToken, expiresAt, id], callback);
};

// Clear Refresh Token
const clearRefreshToken = (id, callback) => {
  const sql = `
    UPDATE users
    SET refreshToken = NULL,
        refreshTokenExpiresAt = NULL
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};


// Get User By Refresh Token
const getUserByRefreshToken = (refreshToken, callback) => {
  const sql = `
    SELECT *
    FROM users
    WHERE refreshToken = ?
    `;

  db.query(sql, [refreshToken], callback);
};


// Update User Role
const updateUserRole = (id, role, callback) => {
  const sql = `
    UPDATE users
    SET role = ?
    WHERE id = ?
  `;

  db.query(sql, [role, id], callback);
};

// Update User Name
const updateUserName = (id, name, callback) => {
  const sql = `
    UPDATE users
    SET name = ?
    WHERE id = ?
  `;

  db.query(sql, [name, id], callback);
};

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  saveRefreshToken,
  clearRefreshToken,
  getUserByRefreshToken,
  updateUserRole,
  updateUserName,
};

