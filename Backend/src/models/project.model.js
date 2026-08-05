const db = require('../config/db');

// Create Project
const createProject = (data, callback) => {
  const sql = `
    INSERT INTO projects (
      userId,
      name,
      description,
      imageUrl,
      githubLink,
      liveLink
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, data, callback);
};

// Get My Projects
const getProjectsByUserId = (userId, callback) => {
  const sql = `
    SELECT *
    FROM projects
    WHERE userId = ?
    ORDER BY createdAt DESC
  `;

  db.query(sql, [userId], callback);
};

// Get Project By Id
const getProjectById = (id, callback) => {
  const sql = `
    SELECT *
    FROM projects
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};


// Update project
const updateProject = (id, data, callback) => {
  const fields = [];
  const values = [];

  Object.keys(data).forEach((key) => {
    fields.push(`${key} = ?`);
    values.push(data[key]);
  });

  const sql = `
    UPDATE projects
    SET ${fields.join(', ')}
    WHERE id = ?
  `;

  db.query(sql, [...values, id], callback);
};

// Delete Project
const deleteProject = (id, callback) => {
  const sql = `
    DELETE FROM projects
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

module.exports = {
  createProject,
  getProjectsByUserId,
  getProjectById,
  updateProject,
  deleteProject,
};
