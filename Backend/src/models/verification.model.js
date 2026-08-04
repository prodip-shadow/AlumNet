const db = require('../config/db');

// Create Verification Application
const createVerificationApplication = (data, callback) => {
  const sql = `
    INSERT INTO verification_applications (
      userId,
      applicationType,
      district,
      universityId,
      registrationNumber,
      facultyId,
      departmentId,
      session,
      currentSemester,
      graduationYear,
      currentPosition,
      currentCompany
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, data, callback);
};



// Get Verification Application By User Id
const getVerificationApplicationByUserId = (userId, callback) => {
  const sql = `
    SELECT *
    FROM verification_applications
    WHERE userId = ?
  `;

  db.query(sql, [userId], callback);
};

// Get Pending Verification Applications
const getPendingVerificationApplications = (callback) => {
  const sql = `
    SELECT *
    FROM verification_applications
    WHERE status = 'PENDING'
    ORDER BY createdAt ASC
  `;

  db.query(sql, callback);
};

// Get Verification Application By Id
const getVerificationApplicationById = (id, callback) => {
  const sql = `
    SELECT *
    FROM verification_applications
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Update Verification Status
const updateVerificationStatus = (
  id,
  status,
  rejectionReason,
  reviewedByUserId,
  callback,
) => {
  const sql = `
    UPDATE verification_applications
    SET
      status = ?,
      rejectionReason = ?,
      reviewedByUserId = ?,
      reviewedAt = NOW()
    WHERE id = ?
  `;

  db.query(sql, [status, rejectionReason, reviewedByUserId, id], callback);
};


// Delete Verification Application
const deleteVerificationApplication = (id, callback) => {
  const sql = `
    DELETE FROM verification_applications
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Delete All Verification Applications
const deleteAllVerificationApplications = (callback) => {
  const sql = `
    DELETE FROM verification_applications
  `;

  db.query(sql, callback);
};

module.exports = {
  createVerificationApplication,
  getVerificationApplicationByUserId,
  getPendingVerificationApplications,
  getVerificationApplicationById,
  updateVerificationStatus,
  deleteVerificationApplication,
  deleteAllVerificationApplications,
};
