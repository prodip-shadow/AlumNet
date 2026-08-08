const db = require('../config/db');

// Create Opportunity
const createOpportunity = (data, callback) => {
  const sql = `
    INSERT INTO opportunities (
      userId,
      type,
      content,
      isCvRequired
    )
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, data, callback);
};

// Get All Opportunities (Feed - ACTIVE only)
const getAllOpportunities = (type, limit, offset, callback) => {
  let sql = `
    SELECT
      opportunities.*,
      users.name,
      users.profileImageUrl,
      users.role,
      (SELECT COUNT(*) FROM opportunity_applications WHERE opportunity_applications.opportunityId = opportunities.id) AS applicationCount
    FROM opportunities
    INNER JOIN users
      ON opportunities.userId = users.id
    WHERE opportunities.status = 'ACTIVE'
  `;

  const values = [];

  if (type) {
    sql += ` AND opportunities.type = ?`;
    values.push(type);
  }

  sql += ` ORDER BY opportunities.createdAt DESC LIMIT ? OFFSET ?`;
  values.push(limit, offset);

  db.query(sql, values, callback);
};

// Get My Opportunities (Owner Dashboard - ACTIVE & CLOSED)
const getMyOpportunities = (userId, callback) => {
  const sql = `
    SELECT
      opportunities.*,
      (SELECT COUNT(*) FROM opportunity_applications WHERE opportunity_applications.opportunityId = opportunities.id) AS applicationCount
    FROM opportunities
    WHERE opportunities.userId = ?
    ORDER BY opportunities.createdAt DESC
  `;

  db.query(sql, [userId], callback);
};

// Get Opportunity By ID
const getOpportunityById = (id, callback) => {
  const sql = `
    SELECT
      opportunities.*,
      users.name,
      users.profileImageUrl,
      users.role,
      (SELECT COUNT(*) FROM opportunity_applications WHERE opportunity_applications.opportunityId = opportunities.id) AS applicationCount
    FROM opportunities
    INNER JOIN users
      ON opportunities.userId = users.id
    WHERE opportunities.id = ?
  `;

  db.query(sql, [id], callback);
};

// Update Opportunity
const updateOpportunity = (id, data, callback) => {
  const sql = `
    UPDATE opportunities
    SET
      type = ?,
      content = ?,
      isCvRequired = ?,
      updatedAt = NOW()
    WHERE id = ?
  `;

  db.query(sql, [...data, id], callback);
};

// Update Opportunity Status (ACTIVE / CLOSED)
const updateOpportunityStatus = (id, status, callback) => {
  const sql = `
    UPDATE opportunities
    SET
      status = ?,
      updatedAt = NOW()
    WHERE id = ?
  `;

  db.query(sql, [status, id], callback);
};

// Delete Opportunity
const deleteOpportunity = (id, callback) => {
  const sql = `
    DELETE FROM opportunities
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Check Duplicate Student Application
const checkStudentApplied = (opportunityId, studentId, callback) => {
  const sql = `
    SELECT *
    FROM opportunity_applications
    WHERE opportunityId = ? AND studentId = ?
  `;

  db.query(sql, [opportunityId, studentId], callback);
};

// Apply Opportunity
const applyOpportunity = (data, callback) => {
  const sql = `
    INSERT INTO opportunity_applications (
      opportunityId,
      studentId,
      cvUrl,
      status,
      message
    )
    VALUES (?, ?, ?, 'APPLIED', NULL)
  `;

  db.query(sql, data, callback);
};

// Get My Applications (Student Dashboard)
const getMyApplications = (studentId, callback) => {
  const sql = `
    SELECT
      opportunity_applications.id AS applicationId,
      opportunity_applications.opportunityId,
      opportunity_applications.cvUrl,
      opportunity_applications.status,
      opportunity_applications.message,
      opportunity_applications.createdAt AS appliedDate,
      opportunities.type,
      opportunities.content,
      opportunities.isCvRequired,
      opportunities.status AS opportunityStatus,
      opportunities.createdAt AS opportunityCreatedAt,
      users.id AS ownerId,
      users.name AS ownerName,
      users.profileImageUrl AS ownerProfileImageUrl,
      users.role AS ownerRole
    FROM opportunity_applications
    INNER JOIN opportunities
      ON opportunity_applications.opportunityId = opportunities.id
    INNER JOIN users
      ON opportunities.userId = users.id
    WHERE opportunity_applications.studentId = ?
    ORDER BY opportunity_applications.createdAt DESC
  `;

  db.query(sql, [studentId], callback);
};

// Get Applicants of an Opportunity (Supports statusFilter)
const getOpportunityApplicants = (opportunityId, statusFilter, callback) => {
  let sql = `
    SELECT
      opportunity_applications.id AS applicationId,
      opportunity_applications.opportunityId,
      opportunity_applications.studentId,
      opportunity_applications.cvUrl,
      opportunity_applications.status,
      opportunity_applications.message,
      opportunity_applications.createdAt AS appliedAt,
      users.name,
      users.profileImageUrl,
      student_profiles.currentSemester,
      departments.name AS departmentName,
      faculties.name AS facultyName
    FROM opportunity_applications
    INNER JOIN users
      ON opportunity_applications.studentId = users.id
    LEFT JOIN student_profiles
      ON users.id = student_profiles.userId
    LEFT JOIN faculties
      ON student_profiles.facultyId = faculties.id
    LEFT JOIN departments
      ON student_profiles.departmentId = departments.id
    WHERE opportunity_applications.opportunityId = ?
  `;

  const values = [opportunityId];

  if (statusFilter) {
    sql += ` AND opportunity_applications.status = ?`;
    values.push(statusFilter);
  }

  sql += ` ORDER BY opportunity_applications.createdAt DESC`;

  db.query(sql, values, callback);
};

// Get Application By ID
const getApplicationById = (applicationId, callback) => {
  const sql = `
    SELECT *
    FROM opportunity_applications
    WHERE id = ?
  `;

  db.query(sql, [applicationId], callback);
};

// Update Application Status & Message
const updateApplicationStatus = (applicationId, status, message, callback) => {
  const sql = `
    UPDATE opportunity_applications
    SET
      status = ?,
      message = ?,
      updatedAt = NOW()
    WHERE id = ?
  `;

  db.query(sql, [status, message, applicationId], callback);
};

module.exports = {
  createOpportunity,
  getAllOpportunities,
  getMyOpportunities,
  getOpportunityById,
  updateOpportunity,
  updateOpportunityStatus,
  deleteOpportunity,
  checkStudentApplied,
  applyOpportunity,
  getMyApplications,
  getOpportunityApplicants,
  getApplicationById,
  updateApplicationStatus,
};
