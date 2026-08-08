const db = require('../config/db');

// Get Alumni Directory (Search, Sort, Pagination)
const getAlumniDirectory = (search, sort, limit, offset, callback) => {
  let sql = `
    SELECT DISTINCT
      alumni_profiles.id,
      alumni_profiles.userId,
      alumni_profiles.district,
      alumni_profiles.universityId,
      alumni_profiles.registrationNumber,
      alumni_profiles.facultyId,
      alumni_profiles.departmentId,
      alumni_profiles.session,
      alumni_profiles.graduationYear,
      alumni_profiles.bio,
      alumni_profiles.currentPosition,
      alumni_profiles.currentCompany,
      alumni_profiles.currentLocation,
      alumni_profiles.githubLink,
      alumni_profiles.linkedinLink,
      alumni_profiles.facebookLink,
      alumni_profiles.personalWebsite,
      alumni_profiles.createdAt,
      users.name,
      users.profileImageUrl,
      users.role,
      faculties.name AS facultyName,
      departments.name AS departmentName
    FROM alumni_profiles
    INNER JOIN users
      ON alumni_profiles.userId = users.id
    INNER JOIN faculties
      ON alumni_profiles.facultyId = faculties.id
    LEFT JOIN departments
      ON alumni_profiles.departmentId = departments.id
    LEFT JOIN user_skills
      ON users.id = user_skills.userId
    LEFT JOIN skills
      ON user_skills.skillId = skills.id
    WHERE users.role = 'ALUMNI'
  `;

  const values = [];

  if (search) {
    sql += ` AND (users.name LIKE ? OR skills.name LIKE ?)`;
    const searchPattern = `%${search}%`;
    values.push(searchPattern, searchPattern);
  }

  // Sorting
  if (sort === 'graduationdesc') {
    sql += ` ORDER BY alumni_profiles.graduationYear DESC`;
  } else if (sort === 'graduationasc') {
    sql += ` ORDER BY alumni_profiles.graduationYear ASC`;
  } else if (sort === 'namedesc') {
    sql += ` ORDER BY users.name DESC`;
  } else if (sort === 'nameasc') {
    sql += ` ORDER BY users.name ASC`;
  } else {
    sql += ` ORDER BY alumni_profiles.createdAt DESC`;
  }

  sql += ` LIMIT ? OFFSET ?`;
  values.push(limit, offset);

  db.query(sql, values, callback);
};

// Get Alumni Profile By User ID
const getAlumniProfileByUserId = (alumniUserId, callback) => {
  const sql = `
    SELECT
      alumni_profiles.*,
      users.name,
      users.profileImageUrl,
      users.role,
      faculties.name AS facultyName,
      departments.name AS departmentName
    FROM alumni_profiles
    INNER JOIN users
      ON alumni_profiles.userId = users.id
    INNER JOIN faculties
      ON alumni_profiles.facultyId = faculties.id
    LEFT JOIN departments
      ON alumni_profiles.departmentId = departments.id
    WHERE alumni_profiles.userId = ?
  `;

  db.query(sql, [alumniUserId], callback);
};

module.exports = {
  getAlumniDirectory,
  getAlumniProfileByUserId,
};
