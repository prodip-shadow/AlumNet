const db = require('../config/db');

// Create Migration Application
const createMigrationApplication = (data, callback) => {
  const sql = `
    INSERT INTO alumni_migration_applications (
      userId,
      graduationYear,
      currentPosition,
      currentCompany,
      currentLocation,
      githubLink,
      linkedinLink,
      facebookLink,
      personalWebsite,
      contactEmail,
      whatsappNumber,
      preferredContactMethod,
      visibleContactMethods
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, data, callback);
};

// Get Latest Migration Application By User Id
const getLatestMigrationApplicationByUserId = (userId, callback) => {
  const sql = `
    SELECT *
    FROM alumni_migration_applications
    WHERE userId = ?
    ORDER BY createdAt DESC
    LIMIT 1
  `;

  db.query(sql, [userId], callback);
};

// Get Pending Migration Application By User Id
const getPendingMigrationApplicationByUserId = (userId, callback) => {
  const sql = `
    SELECT *
    FROM alumni_migration_applications
    WHERE userId = ? AND status = 'PENDING'
  `;

  db.query(sql, [userId], callback);
};

// Get Approved Migration Application By User Id
const getApprovedMigrationApplicationByUserId = (userId, callback) => {
  const sql = `
    SELECT *
    FROM alumni_migration_applications
    WHERE userId = ? AND status = 'APPROVED'
  `;

  db.query(sql, [userId], callback);
};

// Get Pending Migration Applications (Admin)
const getPendingMigrationApplications = (callback) => {
  const sql = `
    SELECT
      ama.*,
      users.name AS userName,
      users.email AS userEmail,
      users.profileImageUrl AS userProfileImageUrl
    FROM alumni_migration_applications ama
    JOIN users ON ama.userId = users.id
    WHERE ama.status = 'PENDING'
    ORDER BY ama.createdAt ASC
  `;

  db.query(sql, callback);
};

// Get Migration Application By Id (Admin)
const getMigrationApplicationById = (id, callback) => {
  const sql = `
    SELECT
      ama.*,
      u.name AS userName,
      u.email AS userEmail,
      u.profileImageUrl AS userProfileImageUrl,
      r.name AS reviewerName
    FROM alumni_migration_applications ama
    JOIN users u ON ama.userId = u.id
    LEFT JOIN users r ON ama.reviewedByUserId = r.id
    WHERE ama.id = ?
  `;

  db.query(sql, [id], callback);
};

// Execute Approve Migration Atomic Transaction
const approveMigrationTransaction = (applicationId, reviewedByUserId, callback) => {
  db.getConnection((err, conn) => {
    if (err) return callback(err);

    conn.beginTransaction((err) => {
      if (err) {
        conn.release();
        return callback(err);
      }

      // Step 1: Lock and fetch the migration application
      const lockAppSql = `
        SELECT *
        FROM alumni_migration_applications
        WHERE id = ? AND status = 'PENDING'
        FOR UPDATE
      `;

      conn.query(lockAppSql, [applicationId], (err, appResult) => {
        if (err || appResult.length === 0) {
          return conn.rollback(() => {
            conn.release();
            return callback(err || new Error('Application not found or not in PENDING status'));
          });
        }

        const app = appResult[0];
        const targetUserId = app.userId;

        // Step 2: Lock and verify user role is STUDENT
        const lockUserSql = `
          SELECT *
          FROM users
          WHERE id = ?
          FOR UPDATE
        `;

        conn.query(lockUserSql, [targetUserId], (err, userResult) => {
          if (err || userResult.length === 0) {
            return conn.rollback(() => {
              conn.release();
              return callback(err || new Error('User not found'));
            });
          }

          const user = userResult[0];

          if (user.role !== 'STUDENT') {
            return conn.rollback(() => {
              conn.release();
              return callback(new Error(`User role is '${user.role}', expected 'STUDENT'`));
            });
          }

          // Step 3: Update user role to ALUMNI
          const updateUserSql = `
            UPDATE users
            SET role = 'ALUMNI'
            WHERE id = ?
          `;

          conn.query(updateUserSql, [targetUserId], (err) => {
            if (err) {
              return conn.rollback(() => {
                conn.release();
                return callback(err);
              });
            }

            // Step 4: Fetch existing student_profile for academic details
            const getStudentProfileSql = `
              SELECT *
              FROM student_profiles
              WHERE userId = ?
            `;

            conn.query(getStudentProfileSql, [targetUserId], (err, spResult) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  return callback(err);
                });
              }

              const studentProfile = spResult.length > 0 ? spResult[0] : {};

              // Data mapping: Authoritative migration app data takes precedence
              const district = studentProfile.district || 'Not Specified';
              const universityId = studentProfile.universityId || 'N/A';
              const registrationNumber = studentProfile.registrationNumber || 'N/A';
              const facultyId = studentProfile.facultyId || 1;
              const departmentId = studentProfile.departmentId || null;
              const session = studentProfile.session || 'N/A';
              const graduationYear = app.graduationYear; // Authoritative!

              const bio = studentProfile.bio || null;
              const currentPosition = app.currentPosition || null;
              const currentCompany = app.currentCompany || null;
              const currentLocation = app.currentLocation || null;

              const githubLink = app.githubLink || studentProfile.githubLink || null;
              const linkedinLink = app.linkedinLink || studentProfile.linkedinLink || null;
              const facebookLink = app.facebookLink || studentProfile.facebookLink || null;
              const personalWebsite = app.personalWebsite || null;
              const contactEmail = app.contactEmail || user.email || null;
              const whatsappNumber = app.whatsappNumber || null;
              const preferredContactMethod = app.preferredContactMethod || null;
              const visibleContactMethods = app.visibleContactMethods || null;

              // Step 5: Check if alumni_profile exists
              const checkAlumniProfileSql = `
                SELECT id FROM alumni_profiles WHERE userId = ?
              `;

              conn.query(checkAlumniProfileSql, [targetUserId], (err, apResult) => {
                if (err) {
                  return conn.rollback(() => {
                    conn.release();
                    return callback(err);
                  });
                }

                if (apResult.length > 0) {
                  // Update existing alumni profile
                  const updateAlumniSql = `
                    UPDATE alumni_profiles
                    SET
                      district = ?,
                      universityId = ?,
                      registrationNumber = ?,
                      facultyId = ?,
                      departmentId = ?,
                      session = ?,
                      graduationYear = ?,
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

                  const updateAlumniData = [
                    district,
                    universityId,
                    registrationNumber,
                    facultyId,
                    departmentId,
                    session,
                    graduationYear,
                    bio,
                    currentPosition,
                    currentCompany,
                    currentLocation,
                    githubLink,
                    linkedinLink,
                    facebookLink,
                    personalWebsite,
                    contactEmail,
                    whatsappNumber,
                    preferredContactMethod,
                    visibleContactMethods,
                    targetUserId,
                  ];

                  conn.query(updateAlumniSql, updateAlumniData, (err) => {
                    if (err) {
                      return conn.rollback(() => {
                        conn.release();
                        return callback(err);
                      });
                    }

                    finishApproval();
                  });
                } else {
                  // Insert new alumni profile
                  const insertAlumniSql = `
                    INSERT INTO alumni_profiles (
                      userId,
                      district,
                      universityId,
                      registrationNumber,
                      facultyId,
                      departmentId,
                      session,
                      graduationYear,
                      bio,
                      currentPosition,
                      currentCompany,
                      currentLocation,
                      githubLink,
                      linkedinLink,
                      facebookLink,
                      personalWebsite,
                      contactEmail,
                      whatsappNumber,
                      preferredContactMethod,
                      visibleContactMethods
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `;

                  const insertAlumniData = [
                    targetUserId,
                    district,
                    universityId,
                    registrationNumber,
                    facultyId,
                    departmentId,
                    session,
                    graduationYear,
                    bio,
                    currentPosition,
                    currentCompany,
                    currentLocation,
                    githubLink,
                    linkedinLink,
                    facebookLink,
                    personalWebsite,
                    contactEmail,
                    whatsappNumber,
                    preferredContactMethod,
                    visibleContactMethods,
                  ];

                  conn.query(insertAlumniSql, insertAlumniData, (err) => {
                    if (err) {
                      return conn.rollback(() => {
                        conn.release();
                        return callback(err);
                      });
                    }

                    finishApproval();
                  });
                }

                // Step 6: Mark migration application as APPROVED
                function finishApproval() {
                  const updateAppSql = `
                    UPDATE alumni_migration_applications
                    SET
                      status = 'APPROVED',
                      reviewedByUserId = ?,
                      reviewedAt = NOW()
                    WHERE id = ?
                  `;

                  conn.query(updateAppSql, [reviewedByUserId, applicationId], (err) => {
                    if (err) {
                      return conn.rollback(() => {
                        conn.release();
                        return callback(err);
                      });
                    }

                    conn.commit((commitErr) => {
                      conn.release();
                      if (commitErr) {
                        return callback(commitErr);
                      }
                      return callback(null, { userId: targetUserId, applicationId });
                    });
                  });
                }
              });
            });
          });
        });
      });
    });
  });
};

// Reject Migration Application
const rejectMigrationApplication = (id, rejectionReason, reviewedByUserId, callback) => {
  const sql = `
    UPDATE alumni_migration_applications
    SET
      status = 'REJECTED',
      rejectionReason = ?,
      reviewedByUserId = ?,
      reviewedAt = NOW()
    WHERE id = ? AND status = 'PENDING'
  `;

  db.query(sql, [rejectionReason, reviewedByUserId, id], callback);
};

module.exports = {
  createMigrationApplication,
  getLatestMigrationApplicationByUserId,
  getPendingMigrationApplicationByUserId,
  getApprovedMigrationApplicationByUserId,
  getPendingMigrationApplications,
  getMigrationApplicationById,
  approveMigrationTransaction,
  rejectMigrationApplication,
};
