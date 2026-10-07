const alumniModel = require('../models/alumni.model');
const connectionModel = require('../models/connection.model');
const skillModel = require('../models/skill.model');

// List Alumni Directory (Search, Sort, Pagination)
const getAlumniDirectory = (req, res) => {
  const search = req.query.search?.trim() || null;
  const sort = req.query.sort?.trim() || null;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize) || 10);

  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  alumniModel.getAlumniDirectory(search, sort, limit, offset, (err, alumni) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      alumni,
      page,
      pageSize,
    });
  });
};

// Public Alumni Profile (With privacy check for contact details)
const getAlumniProfileById = (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  alumniModel.getAlumniProfileByUserId(userId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alumni profile not found',
      });
    }

    const alumniProfile = { ...result[0] };

    skillModel.getUserSkills(userId, (err, skills) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      alumniProfile.skills = skills;

      // Check if current user is the alumni themselves or ADMIN
      const isSelf = Number(currentUserId) === Number(userId);
      const isAdmin = req.user?.role === 'ADMIN';

      if (isSelf || isAdmin) {
        return res.status(200).json({
          success: true,
          profile: alumniProfile,
          isConnected: true,
        });
      }

      // Check if current user has an ACCEPTED connection with this alumni
      connectionModel.checkAcceptedConnection(currentUserId, userId, (err, connectionResult) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        const isConnected = connectionResult.length > 0;

        // If not connected, strip contact information marked as Friends Only
        if (!isConnected) {
          let visMethods = [];
          if (alumniProfile.visibleContactMethods) {
            try {
              visMethods = typeof alumniProfile.visibleContactMethods === 'string'
                ? JSON.parse(alumniProfile.visibleContactMethods)
                : alumniProfile.visibleContactMethods;
            } catch (e) {
              visMethods = [];
            }
          }
          if (!Array.isArray(visMethods)) visMethods = [];

          if (visMethods.includes('email')) delete alumniProfile.contactEmail;
          if (visMethods.includes('whatsapp')) delete alumniProfile.whatsappNumber;
          if (visMethods.includes('linkedin')) delete alumniProfile.linkedinLink;
          if (visMethods.includes('github')) delete alumniProfile.githubLink;
          if (visMethods.includes('facebook')) delete alumniProfile.facebookLink;
          if (visMethods.includes('website')) delete alumniProfile.personalWebsite;
        }

        return res.status(200).json({
          success: true,
          profile: alumniProfile,
          isConnected,
          connectionId: isConnected ? connectionResult[0].id : null,
        });
      });
    });
  });
};

module.exports = {
  getAlumniDirectory,
  getAlumniProfileById,
};
