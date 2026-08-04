const db = require('../config/db');

// Create Faculty
const createFaculty = (name, callback) => {
  const sql = `
    INSERT INTO faculties (name)
    VALUES (?)
  `;

  db.query(sql, [name], callback);
};


// Get All Faculties
const getAllFaculties = (callback) => {
  const sql = `
    SELECT *
    FROM faculties
    ORDER BY name ASC
  `;

  db.query(sql, callback);
};

// Get Faculty By Id
const getFacultyById = (id, callback) => {
  const sql = `
    SELECT *
    FROM faculties
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Update Faculty
const updateFaculty = (id, name, callback) => {
  const sql = `
    UPDATE faculties
    SET name = ?
    WHERE id = ?
  `;

  db.query(sql, [name, id], callback);
};

// Delete Faculty
const deleteFaculty = (id, callback) => {
  const sql = `
    DELETE FROM faculties
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};


module.exports = {
  createFaculty,
  getAllFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
};