const db = require('../config/db');

// Get Users List (Paginated & Searchable)
const getUsersList = (options, callback) => {
  const { search, role, page = 1, limit = 10 } = options;

  const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
  const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = [];
  let params = [];

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    whereClauses.push('(users.name LIKE ? OR users.email LIKE ?)');
    params.push(searchTerm, searchTerm);
  }

  if (role && ['STUDENT', 'ALUMNI', 'ADMIN', 'USER'].includes(role.toUpperCase())) {
    whereClauses.push('users.role = ?');
    params.push(role.toUpperCase());
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM users ${whereSql}`;
  const dataSql = `
    SELECT
      users.id,
      users.name,
      users.email,
      users.role,
      users.profileImageUrl,
      users.isActive,
      users.createdAt
    FROM users
    ${whereSql}
    ORDER BY users.createdAt DESC
    LIMIT ? OFFSET ?
  `;

  db.query(countSql, params, (err, countResult) => {
    if (err) return callback(err);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum);

    const dataParams = [...params, limitNum, offset];

    db.query(dataSql, dataParams, (err, usersResult) => {
      if (err) return callback(err);

      return callback(null, {
        users: usersResult,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      });
    });
  });
};

// Get Full User Details By ID (No Secrets)
const getFullUserDetailsById = (userId, callback) => {
  const userSql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.profileImageUrl,
      u.isActive,
      u.createdAt
    FROM users u
    WHERE u.id = ?
  `;

  db.query(userSql, [userId], (err, userResult) => {
    if (err) return callback(err);
    if (userResult.length === 0) return callback(null, null);

    const user = userResult[0];

    const studentSql = `
      SELECT
        sp.*,
        f.name AS facultyName,
        d.name AS departmentName
      FROM student_profiles sp
      LEFT JOIN faculties f ON sp.facultyId = f.id
      LEFT JOIN departments d ON sp.departmentId = d.id
      WHERE sp.userId = ?
    `;

    const alumniSql = `
      SELECT
        ap.*,
        f.name AS facultyName,
        d.name AS departmentName
      FROM alumni_profiles ap
      LEFT JOIN faculties f ON ap.facultyId = f.id
      LEFT JOIN departments d ON ap.departmentId = d.id
      WHERE ap.userId = ?
    `;

    const skillsSql = `
      SELECT s.id, s.name
      FROM user_skills us
      JOIN skills s ON us.skillId = s.id
      WHERE us.userId = ?
    `;

    const migrationSql = `
      SELECT *
      FROM alumni_migration_applications
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT 1
    `;

    db.query(studentSql, [userId], (err, studentResult) => {
      if (err) return callback(err);

      db.query(alumniSql, [userId], (err, alumniResult) => {
        if (err) return callback(err);

        db.query(skillsSql, [userId], (err, skillsResult) => {
          if (err) return callback(err);

          db.query(migrationSql, [userId], (err, migrationResult) => {
            if (err) return callback(err);

            const fullDetails = {
              user,
              studentProfile: studentResult.length > 0 ? studentResult[0] : null,
              alumniProfile: alumniResult.length > 0 ? alumniResult[0] : null,
              skills: skillsResult || [],
              latestMigrationApplication: migrationResult.length > 0 ? migrationResult[0] : null,
            };

            return callback(null, fullDetails);
          });
        });
      });
    });
  });
};

// Update User Full Profile Transaction (Admin Edit Profile)
const updateUserFullProfileTransaction = (targetUserId, userData, profileData, callback) => {
  db.getConnection((err, conn) => {
    if (err) return callback(err);

    conn.beginTransaction((err) => {
      if (err) {
        conn.release();
        return callback(err);
      }

      // Lock user row
      conn.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [targetUserId], (err, userResult) => {
        if (err || userResult.length === 0) {
          return conn.rollback(() => {
            conn.release();
            return callback(err || new Error('User not found'));
          });
        }

        const user = userResult[0];
        const updateUserName = userData.name !== undefined ? userData.name : user.name;
        const updateUserStatus = userData.isActive !== undefined ? userData.isActive : user.isActive;

        const updateUserSql = `
          UPDATE users
          SET name = ?, isActive = ?
          WHERE id = ?
        `;

        conn.query(updateUserSql, [updateUserName, updateUserStatus, targetUserId], (err) => {
          if (err) {
            return conn.rollback(() => {
              conn.release();
              return callback(err);
            });
          }

          if (user.role === 'STUDENT' && profileData) {
            const {
              bio,
              careerInterests,
              githubLink,
              linkedinLink,
              facebookLink,
              portfolioLink,
              codeforcesLink,
              codechefLink,
              leetcodeLink,
              hackerrankLink,
              district,
              session,
              currentSemester,
              expectedGraduationYear,
            } = profileData;

            const updateStudentSql = `
              UPDATE student_profiles
              SET
                bio = COALESCE(?, bio),
                careerInterests = COALESCE(?, careerInterests),
                githubLink = COALESCE(?, githubLink),
                linkedinLink = COALESCE(?, linkedinLink),
                facebookLink = COALESCE(?, facebookLink),
                portfolioLink = COALESCE(?, portfolioLink),
                codeforcesLink = COALESCE(?, codeforcesLink),
                codechefLink = COALESCE(?, codechefLink),
                leetcodeLink = COALESCE(?, leetcodeLink),
                hackerrankLink = COALESCE(?, hackerrankLink),
                district = COALESCE(?, district),
                session = COALESCE(?, session),
                currentSemester = COALESCE(?, currentSemester),
                expectedGraduationYear = COALESCE(?, expectedGraduationYear),
                updatedAt = NOW()
              WHERE userId = ?
            `;

            const studentParams = [
              bio !== undefined ? bio : null,
              careerInterests !== undefined ? careerInterests : null,
              githubLink !== undefined ? githubLink : null,
              linkedinLink !== undefined ? linkedinLink : null,
              facebookLink !== undefined ? facebookLink : null,
              portfolioLink !== undefined ? portfolioLink : null,
              codeforcesLink !== undefined ? codeforcesLink : null,
              codechefLink !== undefined ? codechefLink : null,
              leetcodeLink !== undefined ? leetcodeLink : null,
              hackerrankLink !== undefined ? hackerrankLink : null,
              district !== undefined ? district : null,
              session !== undefined ? session : null,
              currentSemester !== undefined ? currentSemester : null,
              expectedGraduationYear !== undefined ? expectedGraduationYear : null,
              targetUserId,
            ];

            conn.query(updateStudentSql, studentParams, (err) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  return callback(err);
                });
              }

              finishUpdate();
            });
          } else if (user.role === 'ALUMNI' && profileData) {
            const {
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
              district,
              session,
              graduationYear,
            } = profileData;

            const formattedVisibleContactMethods = Array.isArray(visibleContactMethods)
              ? JSON.stringify(visibleContactMethods)
              : (typeof visibleContactMethods === 'string' ? visibleContactMethods : undefined);

            const updateAlumniSql = `
              UPDATE alumni_profiles
              SET
                bio = COALESCE(?, bio),
                currentPosition = COALESCE(?, currentPosition),
                currentCompany = COALESCE(?, currentCompany),
                currentLocation = COALESCE(?, currentLocation),
                githubLink = COALESCE(?, githubLink),
                linkedinLink = COALESCE(?, linkedinLink),
                facebookLink = COALESCE(?, facebookLink),
                personalWebsite = COALESCE(?, personalWebsite),
                contactEmail = COALESCE(?, contactEmail),
                whatsappNumber = COALESCE(?, whatsappNumber),
                preferredContactMethod = COALESCE(?, preferredContactMethod),
                visibleContactMethods = COALESCE(?, visibleContactMethods),
                district = COALESCE(?, district),
                session = COALESCE(?, session),
                graduationYear = COALESCE(?, graduationYear),
                updatedAt = NOW()
              WHERE userId = ?
            `;

            const alumniParams = [
              bio !== undefined ? bio : null,
              currentPosition !== undefined ? currentPosition : null,
              currentCompany !== undefined ? currentCompany : null,
              currentLocation !== undefined ? currentLocation : null,
              githubLink !== undefined ? githubLink : null,
              linkedinLink !== undefined ? linkedinLink : null,
              facebookLink !== undefined ? facebookLink : null,
              personalWebsite !== undefined ? personalWebsite : null,
              contactEmail !== undefined ? contactEmail : null,
              whatsappNumber !== undefined ? whatsappNumber : null,
              preferredContactMethod !== undefined ? preferredContactMethod : null,
              formattedVisibleContactMethods !== undefined ? formattedVisibleContactMethods : null,
              district !== undefined ? district : null,
              session !== undefined ? session : null,
              graduationYear !== undefined ? graduationYear : null,
              targetUserId,
            ];

            conn.query(updateAlumniSql, alumniParams, (err) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  return callback(err);
                });
              }

              finishUpdate();
            });
          } else {
            finishUpdate();
          }

          function finishUpdate() {
            conn.commit((commitErr) => {
              conn.release();
              if (commitErr) return callback(commitErr);
              return callback(null, { userId: targetUserId });
            });
          }
        });
      });
    });
  });
};

// Change User Role Transaction (Admin Management)
const changeUserRoleTransaction = (targetUserId, newRole, adminUserId, callback) => {
  db.getConnection((err, conn) => {
    if (err) return callback(err);

    conn.beginTransaction((err) => {
      if (err) {
        conn.release();
        return callback(err);
      }

      // Step 1: Lock user row
      conn.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [targetUserId], (err, userResult) => {
        if (err || userResult.length === 0) {
          return conn.rollback(() => {
            conn.release();
            return callback(err || new Error('User not found'));
          });
        }

        const user = userResult[0];
        const oldRole = user.role;

        if (oldRole === newRole) {
          return conn.rollback(() => {
            conn.release();
            return callback(new Error(`User is already in role '${newRole}'`));
          });
        }

        // Step 2: Update users.role
        conn.query('UPDATE users SET role = ? WHERE id = ?', [newRole, targetUserId], (err) => {
          if (err) {
            return conn.rollback(() => {
              conn.release();
              return callback(err);
            });
          }

          // Step 3: Handle profile sync based on new role
          if (newRole === 'ALUMNI') {
            // Check if alumni profile exists
            conn.query('SELECT id FROM alumni_profiles WHERE userId = ?', [targetUserId], (err, apResult) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  return callback(err);
                });
              }

              if (apResult.length === 0) {
                // Fetch student_profile to copy academic data
                conn.query('SELECT * FROM student_profiles WHERE userId = ?', [targetUserId], (err, spResult) => {
                  if (err) {
                    return conn.rollback(() => {
                      conn.release();
                      return callback(err);
                    });
                  }

                  const sp = spResult.length > 0 ? spResult[0] : {};
                  const currentYear = new Date().getFullYear();

                  const insertAlumniSql = `
                    INSERT INTO alumni_profiles (
                      userId, district, universityId, registrationNumber,
                      facultyId, departmentId, session, graduationYear,
                      bio, githubLink, linkedinLink, facebookLink
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `;

                  const insertParams = [
                    targetUserId,
                    sp.district || 'Not Specified',
                    sp.universityId || 'N/A',
                    sp.registrationNumber || 'N/A',
                    sp.facultyId || 1,
                    sp.departmentId || null,
                    sp.session || 'N/A',
                    sp.expectedGraduationYear || currentYear,
                    sp.bio || null,
                    sp.githubLink || null,
                    sp.linkedinLink || null,
                    sp.facebookLink || null,
                  ];

                  conn.query(insertAlumniSql, insertParams, (err) => {
                    if (err) {
                      return conn.rollback(() => {
                        conn.release();
                        return callback(err);
                      });
                    }

                    resolvePendingMigration();
                  });
                });
              } else {
                resolvePendingMigration();
              }

              function resolvePendingMigration() {
                // If user had a PENDING migration application, approve it
                const updateMigrationSql = `
                  UPDATE alumni_migration_applications
                  SET status = 'APPROVED', reviewedByUserId = ?, reviewedAt = NOW()
                  WHERE userId = ? AND status = 'PENDING'
                `;

                conn.query(updateMigrationSql, [adminUserId, targetUserId], (err) => {
                  if (err) {
                    return conn.rollback(() => {
                      conn.release();
                      return callback(err);
                    });
                  }

                  finishRoleChange();
                });
              }
            });
          } else if (newRole === 'STUDENT') {
            // Check if student profile exists
            conn.query('SELECT id FROM student_profiles WHERE userId = ?', [targetUserId], (err, spResult) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  return callback(err);
                });
              }

              if (spResult.length === 0) {
                // Fetch alumni_profile to copy academic data
                conn.query('SELECT * FROM alumni_profiles WHERE userId = ?', [targetUserId], (err, apResult) => {
                  if (err) {
                    return conn.rollback(() => {
                      conn.release();
                      return callback(err);
                    });
                  }

                  const ap = apResult.length > 0 ? apResult[0] : {};

                  const insertStudentSql = `
                    INSERT INTO student_profiles (
                      userId, district, universityId, registrationNumber,
                      facultyId, departmentId, session, currentSemester,
                      expectedGraduationYear, bio, githubLink, linkedinLink, facebookLink
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `;

                  const insertParams = [
                    targetUserId,
                    ap.district || 'Not Specified',
                    ap.universityId || 'N/A',
                    ap.registrationNumber || 'N/A',
                    ap.facultyId || 1,
                    ap.departmentId || null,
                    ap.session || 'N/A',
                    'Completed',
                    ap.graduationYear || null,
                    ap.bio || null,
                    ap.githubLink || null,
                    ap.linkedinLink || null,
                    ap.facebookLink || null,
                  ];

                  conn.query(insertStudentSql, insertParams, (err) => {
                    if (err) {
                      return conn.rollback(() => {
                        conn.release();
                        return callback(err);
                      });
                    }

                    finishRoleChange();
                  });
                });
              } else {
                finishRoleChange();
              }
            });
          } else {
            finishRoleChange();
          }

          function finishRoleChange() {
            conn.commit((commitErr) => {
              conn.release();
              if (commitErr) return callback(commitErr);
              return callback(null, { userId: targetUserId, oldRole, newRole });
            });
          }
        });
      });
    });
  });
};

// Update User Account Active Status
const updateUserStatus = (targetUserId, isActive, callback) => {
  const sql = `UPDATE users SET isActive = ? WHERE id = ?`;
  db.query(sql, [isActive, targetUserId], callback);
};

// Delete User Transaction (Handling all non-cascading FK references)
const deleteUserTransaction = (targetUserId, callback) => {
  db.getConnection((err, conn) => {
    if (err) return callback(err);

    conn.beginTransaction((err) => {
      if (err) {
        conn.release();
        return callback(err);
      }

      // Step 1: Nullify reviewedByUserId references in verification_applications
      const nullifyVerificationSql = `
        UPDATE verification_applications
        SET reviewedByUserId = NULL
        WHERE reviewedByUserId = ?
      `;

      conn.query(nullifyVerificationSql, [targetUserId], (err) => {
        if (err) {
          return conn.rollback(() => {
            conn.release();
            return callback(err);
          });
        }

        // Step 2: Nullify reviewedByUserId references in alumni_migration_applications
        const nullifyMigrationSql = `
          UPDATE alumni_migration_applications
          SET reviewedByUserId = NULL
          WHERE reviewedByUserId = ?
        `;

        conn.query(nullifyMigrationSql, [targetUserId], (err) => {
          if (err) {
            return conn.rollback(() => {
              conn.release();
              return callback(err);
            });
          }

          // Step 3: Nullify actorUserId in notifications
          const nullifyNotificationsSql = `
            UPDATE notifications
            SET actorUserId = NULL
            WHERE actorUserId = ?
          `;

          conn.query(nullifyNotificationsSql, [targetUserId], (err) => {
            if (err) {
              return conn.rollback(() => {
                conn.release();
                return callback(err);
              });
            }

            // Step 4: Delete user (Triggers ON DELETE CASCADE for student_profiles, alumni_profiles, posts, comments, connections, events, registrations, etc.)
            const deleteUserSql = `DELETE FROM users WHERE id = ?`;

            conn.query(deleteUserSql, [targetUserId], (err, deleteResult) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  return callback(err);
                });
              }

              if (deleteResult.affectedRows === 0) {
                return conn.rollback(() => {
                  conn.release();
                  return callback(new Error('User not found'));
                });
              }

              conn.commit((commitErr) => {
                conn.release();
                if (commitErr) return callback(commitErr);
                return callback(null, { deletedUserId: targetUserId });
              });
            });
          });
        });
      });
    });
  });
};

module.exports = {
  getUsersList,
  getFullUserDetailsById,
  updateUserFullProfileTransaction,
  changeUserRoleTransaction,
  updateUserStatus,
  deleteUserTransaction,
};
