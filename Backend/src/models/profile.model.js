
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
    SELECT *
    FROM student_profiles
    WHERE userId = ?
  `;

  db.query(sql, [userId], callback);
};

// Get Alumni Profile By User Id
const getAlumniProfileByUserId = (userId, callback) => {
  const sql = `
    SELECT *
    FROM alumni_profiles
    WHERE userId = ?
  `;

  db.query(sql, [userId], callback);
};

// Update Student Profile
const updateStudentProfile = (userId, data, callback) => {
  const sql = `
    UPDATE student_profiles
    SET
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

