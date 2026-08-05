const db = require('../config/db');

// Create Skill
const createSkill = (name, callback) => {
  const sql = `
    INSERT INTO skills (name)
    VALUES (?)
  `;

  db.query(sql, [name], callback);
};

// Get All Skills
const getAllSkills = (callback) => {
  const sql = `
    SELECT *
    FROM skills
    ORDER BY name ASC
  `;

  db.query(sql, callback);
};

// Get Skill By Id
const getSkillById = (id, callback) => {
  const sql = `
    SELECT *
    FROM skills
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Update Skill
const updateSkill = (id, name, callback) => {
  const sql = `
    UPDATE skills
    SET name = ?
    WHERE id = ?
  `;

  db.query(sql, [name, id], callback);
};

// Delete Skill
const deleteSkill = (id, callback) => {
  const sql = `
    DELETE FROM skills
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Delete User Skills
const deleteUserSkills = (userId, callback) => {
  const sql = `
    DELETE FROM user_skills
    WHERE userId = ?
  `;

  db.query(sql, [userId], callback);
};

// Add User Skill
const addUserSkill = (userId, skillId, callback) => {
  const sql = `
    INSERT INTO user_skills (userId, skillId)
    VALUES (?, ?)
  `;

  db.query(sql, [userId, skillId], callback);
};

// Get User Skills
const getUserSkills = (userId, callback) => {
  const sql = `
    SELECT
      skills.id,
      skills.name
    FROM user_skills
    INNER JOIN skills
      ON user_skills.skillId = skills.id
    WHERE user_skills.userId = ?
    ORDER BY skills.name ASC
  `;

  db.query(sql, [userId], callback);
};

// Check Skills By Ids
const getSkillsByIds = (skillIds, callback) => {
  const sql = `
    SELECT id
    FROM skills
    WHERE id IN (?)
  `;

  db.query(sql, [skillIds], callback);
};


module.exports = {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
  deleteUserSkills,
  addUserSkill,
  getUserSkills,
  getSkillsByIds,
};
