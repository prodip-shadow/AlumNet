const db = require('../config/db');

// Get Alumni Directory (Search, Sort, Pagination)
const getAlumniDirectory = (search, sort, limit, offset, callback) => {
  let sql = `
    SELECT DISTINCT
      users.id AS userId,
      users.name,
      users.email,
      users.profileImageUrl,
      users.role,
      users.isActive,
      COALESCE(alumni_profiles.id, users.id) AS id,
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
      COALESCE(alumni_profiles.createdAt, users.createdAt) AS createdAt,
      faculties.name AS facultyName,
      departments.name AS departmentName
    FROM users
    LEFT JOIN alumni_profiles
      ON users.id = alumni_profiles.userId
    LEFT JOIN faculties
      ON alumni_profiles.facultyId = faculties.id
    LEFT JOIN departments
      ON alumni_profiles.departmentId = departments.id
    LEFT JOIN user_skills
      ON users.id = user_skills.userId
    LEFT JOIN skills
      ON user_skills.skillId = skills.id
    WHERE users.role = 'ALUMNI' AND (users.isActive = 1 OR users.isActive IS NULL)
  `;

  const values = [];

  if (search) {
    sql += ` AND (users.name LIKE ? OR skills.name LIKE ? OR alumni_profiles.currentPosition LIKE ? OR alumni_profiles.currentCompany LIKE ? OR faculties.name LIKE ? OR departments.name LIKE ?)`;
    const searchPattern = `%${search}%`;
    values.push(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern
    );
  }

  // Sorting
  if (sort === 'graduationdesc') {
    sql += ` ORDER BY alumni_profiles.graduationYear DESC, users.name ASC`;
  } else if (sort === 'graduationasc') {
    sql += ` ORDER BY alumni_profiles.graduationYear ASC, users.name ASC`;
  } else if (sort === 'namedesc') {
    sql += ` ORDER BY users.name DESC`;
  } else if (sort === 'nameasc') {
    sql += ` ORDER BY users.name ASC`;
  } else {
    sql += ` ORDER BY COALESCE(alumni_profiles.createdAt, users.createdAt) DESC`;
  }

  sql += ` LIMIT ? OFFSET ?`;
  values.push(limit, offset);

  db.query(sql, values, callback);
};

// Get Alumni Profile By User ID
const getAlumniProfileByUserId = (alumniUserId, callback) => {
  const sql = `
    SELECT
      users.id AS userId,
      users.name,
      users.email,
      users.profileImageUrl,
      users.role,
      users.createdAt AS userCreatedAt,
      alumni_profiles.id AS alumniProfileId,
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
      alumni_profiles.contactEmail,
      alumni_profiles.whatsappNumber,
      alumni_profiles.preferredContactMethod,
      alumni_profiles.visibleContactMethods,
      alumni_profiles.createdAt,
      faculties.name AS facultyName,
      departments.name AS departmentName
    FROM users
    LEFT JOIN alumni_profiles
      ON users.id = alumni_profiles.userId
    LEFT JOIN faculties
      ON alumni_profiles.facultyId = faculties.id
    LEFT JOIN departments
      ON alumni_profiles.departmentId = departments.id
    WHERE users.id = ? AND users.role = 'ALUMNI'
  `;

  db.query(sql, [alumniUserId], callback);
};

module.exports = {
  getAlumniDirectory,
  getAlumniProfileByUserId,
};
