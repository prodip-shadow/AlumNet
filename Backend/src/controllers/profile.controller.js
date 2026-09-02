const db = require('../config/db');
const userModel = require('../models/user.model');
const profileModel = require('../models/profile.model');
const alumniModel = require('../models/alumni.model');
const skillModel = require('../models/skill.model');
const connectionModel = require('../models/connection.model');

// Helper Functions
const saveUserSkills = (userId, skills, res) => {
  if (!Array.isArray(skills) || skills.length === 0) {
    return skillModel.deleteUserSkills(userId, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
      });
    });
  }

  const uniqueSkills = [...new Set(skills)];

  if (!uniqueSkills.every((id) => Number.isInteger(id) && id > 0)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid skill selected',
    });
  }

  skillModel.getSkillsByIds(uniqueSkills, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length !== uniqueSkills.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skill selected',
      });
    }

    skillModel.deleteUserSkills(userId, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      let completed = 0;
      let hasError = false;

      uniqueSkills.forEach((skillId) => {
        skillModel.addUserSkill(userId, skillId, (err) => {
          if (hasError) return;

          if (err) {
            hasError = true;

            return res.status(500).json({
              success: false,
              message: 'Server Error',
            });
          }

          completed++;

          if (completed === uniqueSkills.length) {
            return res.status(200).json({
              success: true,
              message: 'Profile updated successfully',
            });
          }
        });
      });
    });
  });
};

const sendProfileResponse = (userId, profile, res) => {
  skillModel.getUserSkills(userId, (err, skillsResult) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      profile,
      skills: skillsResult,
    });
  });
};



// Get My Profile
const getMyProfile = (req, res) => {
  const user = req.user;

  if (user.role === 'STUDENT') {
    profileModel.getStudentProfileByUserId(user.id, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
      }

     return sendProfileResponse(user.id, result[0], res);
    });

    return;
  }

  if (user.role === 'ALUMNI') {
    profileModel.getAlumniProfileByUserId(user.id, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
      }

      return sendProfileResponse(user.id, result[0], res);
    });

    return;
  }

  return res.status(403).json({
    success: false,
    message: 'Profile is not available for this user',
  });
};

// Update My Profile
const updateMyProfile = (req, res) => {
  const user = req.user;
  const { name } = req.body;

  const handleNameUpdateThenProceed = (callback) => {
    if (name && typeof name === 'string' && name.trim()) {
      userModel.updateUserName(user.id, name.trim(), (err) => {
        if (err) {
          console.error('Error updating user name:', err);
        }
        callback();
      });
    } else {
      callback();
    }
  };

  if (user.role === 'STUDENT') {
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
      skills,
    } = req.body;

    const cleanGithubLink = githubLink?.trim() || null;
    const cleanLinkedinLink = linkedinLink?.trim() || null;
    const cleanFacebookLink = facebookLink?.trim() || null;

    const cleanPortfolioLink = portfolioLink?.trim() || null;
    const cleanCodeforcesLink = codeforcesLink?.trim() || null;
    const cleanCodechefLink = codechefLink?.trim() || null;
    const cleanLeetcodeLink = leetcodeLink?.trim() || null;
    const cleanHackerrankLink = hackerrankLink?.trim() || null;

    handleNameUpdateThenProceed(() => {
      profileModel.updateStudentProfile(
        user.id,
        [
          bio,
          careerInterests,
          cleanGithubLink,
          cleanLinkedinLink,
          cleanFacebookLink,
          cleanPortfolioLink,
          cleanCodeforcesLink,
          cleanCodechefLink,
          cleanLeetcodeLink,
          cleanHackerrankLink,
        ],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Server Error',
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              success: false,
              message: 'Profile not found',
            });
          }

          return saveUserSkills(user.id, skills, res);
        },
      );
    });

    return;
  }

  if (user.role === 'ALUMNI') {
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
      skills,
    } = req.body;

    const cleanGithubLink = githubLink?.trim() || null;
    const cleanLinkedinLink = linkedinLink?.trim() || null;
    const cleanFacebookLink = facebookLink?.trim() || null;
    const cleanPersonalWebsite = personalWebsite?.trim() || null;
    const cleanContactEmail = contactEmail?.trim() || null;
    const cleanWhatsappNumber = whatsappNumber?.trim() || null;
    const cleanCurrentPosition = currentPosition?.trim() || null;
    const cleanCurrentCompany = currentCompany?.trim() || null;
    const cleanCurrentLocation = currentLocation?.trim() || null;

    handleNameUpdateThenProceed(() => {
      profileModel.updateAlumniProfile(
        user.id,
        [
          bio,
          cleanCurrentPosition,
          cleanCurrentCompany,
          cleanCurrentLocation,
          cleanGithubLink,
          cleanLinkedinLink,
          cleanFacebookLink,
          cleanPersonalWebsite,
          cleanContactEmail,
          cleanWhatsappNumber,
          preferredContactMethod,
          JSON.stringify(
            Array.isArray(visibleContactMethods) ? visibleContactMethods : [],
          ),
        ],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Server Error',
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              success: false,
              message: 'Profile not found',
            });
          }

          return saveUserSkills(user.id, skills, res);
        },
      );
    });

    return;
  }

  return res.status(403).json({
    success: false,
    message: 'Profile is not available for this user',
  });
};

// Update Profile Picture
const updateProfilePicture = (req, res) => {
  if (!req.uploadedImageUrl) {
    return res.status(400).json({
      success: false,
      message: 'Profile image is required',
    });
  }

  profileModel.updateProfilePicture(
    req.user.id,
    req.uploadedImageUrl,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully',
      });
    },
  );
};

// Get Public / Shared User Profile By User ID (Supports both STUDENT and ALUMNI)
const getUserProfileById = (req, res) => {
  const { id } = req.params;
  const targetUserId = Number(id);
  const currentUserId = req.user?.id;

  if (!targetUserId || isNaN(targetUserId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
    });
  }

  userModel.getUserById(targetUserId, (err, userResult) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUser = userResult[0];

    // If ALUMNI
    if (targetUser.role === 'ALUMNI') {
      return alumniModel.getAlumniProfileByUserId(targetUserId, (aErr, aRes) => {
        if (aErr || !aRes || aRes.length === 0) {
          return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        skillModel.getUserSkills(targetUserId, (sErr, skills) => {
          const profile = { ...aRes[0], role: 'ALUMNI', skills: skills || [] };

          if (Number(currentUserId) === Number(targetUserId)) {
            return res.status(200).json({
              success: true,
              profile,
              isConnected: false,
            });
          }

          connectionModel.checkAcceptedConnection(currentUserId, targetUserId, (cErr, cRes) => {
            const isConnected = Boolean(cRes && cRes.length > 0);
            if (!isConnected) {
              delete profile.contactEmail;
              delete profile.whatsappNumber;
              delete profile.preferredContactMethod;
              delete profile.visibleContactMethods;
            }
            return res.status(200).json({
              success: true,
              profile,
              isConnected,
              connectionId: isConnected ? (cRes[0].connectionId || cRes[0].id) : null,
            });
          });
        });
      });
    }

    // If STUDENT
    if (targetUser.role === 'STUDENT') {
      const sql = `
        SELECT 
          users.id AS userId,
          users.name,
          users.email,
          users.role,
          users.profileImageUrl,
          student_profiles.district,
          student_profiles.universityId,
          student_profiles.registrationNumber,
          student_profiles.session,
          student_profiles.currentSemester,
          student_profiles.expectedGraduationYear,
          student_profiles.bio,
          student_profiles.careerInterests,
          student_profiles.githubLink,
          student_profiles.linkedinLink,
          student_profiles.facebookLink,
          student_profiles.portfolioLink,
          student_profiles.codeforcesLink,
          student_profiles.codechefLink,
          student_profiles.leetcodeLink,
          student_profiles.hackerrankLink,
          faculties.name AS facultyName,
          departments.name AS departmentName
        FROM users
        LEFT JOIN student_profiles ON users.id = student_profiles.userId
        LEFT JOIN faculties ON student_profiles.facultyId = faculties.id
        LEFT JOIN departments ON student_profiles.departmentId = departments.id
        WHERE users.id = ?
      `;

      db.query(sql, [targetUserId], (sErr, sRes) => {
        if (sErr || !sRes || sRes.length === 0) {
          return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        const studentProfile = { ...sRes[0], role: 'STUDENT' };
        skillModel.getUserSkills(targetUserId, (skErr, skills) => {
          studentProfile.skills = skills || [];

          if (Number(currentUserId) === Number(targetUserId)) {
            return res.status(200).json({
              success: true,
              profile: studentProfile,
              isConnected: false,
            });
          }

          connectionModel.checkAcceptedConnection(currentUserId, targetUserId, (cErr, cRes) => {
            const isConnected = Boolean(cRes && cRes.length > 0);
            return res.status(200).json({
              success: true,
              profile: studentProfile,
              isConnected,
              connectionId: isConnected ? (cRes[0].connectionId || cRes[0].id) : null,
            });
          });
        });
      });
      return;
    }

    return res.status(200).json({
      success: true,
      profile: {
        userId: targetUser.id,
        name: targetUser.name,
        role: targetUser.role,
        profileImageUrl: targetUser.profileImageUrl,
      },
    });
  });
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  updateProfilePicture,
  getUserProfileById,
};
