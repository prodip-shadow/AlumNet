
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

// Update User Password
const updatePassword = (id, hashedPassword, callback) => {
  const sql = `
    UPDATE users
    SET password = ?
    WHERE id = ?
  `;
  db.query(sql, [hashedPassword, id], callback);
};

// Update User Email
const updateEmail = (id, email, callback) => {
  const sql = `
    UPDATE users
    SET email = ?
    WHERE id = ?
  `;
  db.query(sql, [email, id], callback);
};

// Update Two-Factor Authentication Status
const updateTwoFactorStatus = (id, isTwoFactorEnabled, callback) => {
  const sql = `
    UPDATE users
    SET isTwoFactorEnabled = ?
    WHERE id = ?
  `;
  db.query(sql, [isTwoFactorEnabled, id], callback);
};

// Save Two-Factor Verification Code
const saveTwoFactorCode = (id, code, expiresAt, callback) => {
  const sql = `
    UPDATE users
    SET twoFactorCode = ?, twoFactorExpiresAt = ?
    WHERE id = ?
  `;
  db.query(sql, [code, expiresAt, id], callback);
};

// Clear Two-Factor Verification Code
const clearTwoFactorCode = (id, callback) => {
  const sql = `
    UPDATE users
    SET twoFactorCode = NULL, twoFactorExpiresAt = NULL
    WHERE id = ?
  `;
  db.query(sql, [id], callback);
};

// Save Reset Password Code
const saveResetCode = (id, code, expiresAt, callback) => {
  const sql = `
    UPDATE users
    SET resetCode = ?, resetExpiresAt = ?
    WHERE id = ?
  `;
  db.query(sql, [code, expiresAt, id], callback);
};

// Clear Reset Password Code
const clearResetCode = (id, callback) => {
  const sql = `
    UPDATE users
    SET resetCode = NULL, resetExpiresAt = NULL
    WHERE id = ?
  `;
  db.query(sql, [id], callback);
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
  updatePassword,
  updateEmail,
  updateTwoFactorStatus,
  saveTwoFactorCode,
  clearTwoFactorCode,
  saveResetCode,
  clearResetCode,
};

