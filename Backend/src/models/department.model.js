const db = require('../config/db');

// Create Department
const createDepartment = (data, callback) => {
  const sql = `
    INSERT INTO departments (name, facultyId)
    VALUES (?, ?)
  `;

  db.query(sql, data, callback);
};

// Get All Departments
const getAllDepartments = (callback) => {
  const sql = `
    SELECT
      departments.id,
      departments.name,
      departments.facultyId,
      faculties.name AS facultyName
    FROM departments
    INNER JOIN faculties
      ON departments.facultyId = faculties.id
    ORDER BY departments.name ASC
  `;

  db.query(sql, callback);
};

// Get Department By Id
const getDepartmentById = (id, callback) => {
  const sql = `
    SELECT
      departments.id,
      departments.name,
      departments.facultyId,
      faculties.name AS facultyName
    FROM departments
    INNER JOIN faculties
      ON departments.facultyId = faculties.id
    WHERE departments.id = ?
  `;

  db.query(sql, [id], callback);
};

// Get Departments By Faculty Id
const getDepartmentsByFacultyId = (facultyId, callback) => {
  const sql = `
    SELECT *
    FROM departments
    WHERE facultyId = ?
    ORDER BY name ASC
  `;

  db.query(sql, [facultyId], callback);
};

// Update Department
const updateDepartment = (id, data, callback) => {
  const sql = `
    UPDATE departments
    SET
      name = ?,
      facultyId = ?
    WHERE id = ?
  `;

  db.query(sql, [...data, id], callback);
};

// Delete Department
const deleteDepartment = (id, callback) => {
  const sql = `
    DELETE FROM departments
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  getDepartmentsByFacultyId,
  updateDepartment,
  deleteDepartment,
};
