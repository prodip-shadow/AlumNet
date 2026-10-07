
const db = require('../config/db');

// Create Student Profile
const createStudentProfile = (data, callback) => {
  const sql = `
    INSERT INTO student_profiles (
      userId,
      district,
      universityId,
      registrationNumber,
      facultyId,
      departmentId,
      session,
      currentSemester,
      expectedGraduationYear
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, data, callback);
};

// Create Alumni Profile
const createAlumniProfile = (data, callback) => {
  const sql = `
    INSERT INTO alumni_profiles (
      userId,
      district,
      universityId,
      registrationNumber,
      facultyId,
      departmentId,
      session,
      graduationYear
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, data, callback);
};

// Get Student Profile By User Id
const getStudentProfileByUserId = (userId, callback) => {
  const sql = `
    SELECT
      student_profiles.*,
      users.name,
      users.email,
      users.profileImageUrl,
      faculties.name AS facultyName,
      departments.name AS departmentName
    FROM student_profiles
    INNER JOIN users ON student_profiles.userId = users.id
    LEFT JOIN faculties ON student_profiles.facultyId = faculties.id
    LEFT JOIN departments ON student_profiles.departmentId = departments.id
    WHERE student_profiles.userId = ?
  `;

  db.query(sql, [userId], callback);
};

// Get Alumni Profile By User Id
const getAlumniProfileByUserId = (userId, callback) => {
  const sql = `
    SELECT
      alumni_profiles.*,
      users.name,
      users.email,
      users.profileImageUrl,
      faculties.name AS facultyName,
      departments.name AS departmentName
    FROM alumni_profiles
    INNER JOIN users ON alumni_profiles.userId = users.id
    LEFT JOIN faculties ON alumni_profiles.facultyId = faculties.id
    LEFT JOIN departments ON alumni_profiles.departmentId = departments.id
    WHERE alumni_profiles.userId = ?
  `;

  db.query(sql, [userId], callback);
};

// Update Student Profile
const updateStudentProfile = (userId, data, callback) => {
  const sql = `
    UPDATE student_profiles
    SET
      facultyId = ?,
      departmentId = ?,
      bio = ?,
      careerInterests = ?,
      githubLink = ?,
      linkedinLink = ?,
      facebookLink = ?,
      portfolioLink = ?,
      codeforcesLink = ?,
      codechefLink = ?,
      leetcodeLink = ?,
      hackerrankLink = ?,
      updatedAt = NOW()
    WHERE userId = ?
  `;

  db.query(sql, [...data, userId], callback);
};

// Update Alumni Profile
const updateAlumniProfile = (userId, data, callback) => {
  const sql = `
    UPDATE alumni_profiles
    SET
      facultyId = ?,
      departmentId = ?,
      bio = ?,
      currentPosition = ?,
      currentCompany = ?,
      currentLocation = ?,
      githubLink = ?,
      linkedinLink = ?,
      facebookLink = ?,
      personalWebsite = ?,
      contactEmail = ?,
      whatsappNumber = ?,
      preferredContactMethod = ?,
      visibleContactMethods = ?,
      updatedAt = NOW()
    WHERE userId = ?
  `;

  db.query(sql, [...data, userId], callback);
};


// Update Profile Picture
const updateProfilePicture = (userId, profileImageUrl, callback) => {
  const sql = `
    UPDATE users
    SET profileImageUrl = ?
    WHERE id = ?
  `;

  db.query(sql, [profileImageUrl, userId], callback);
};

module.exports = {
  createStudentProfile,
  createAlumniProfile,
  getStudentProfileByUserId,
  getAlumniProfileByUserId,
  updateStudentProfile,
  updateAlumniProfile,
  updateProfilePicture,
};

