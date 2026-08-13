const alumniMigrationModel = require('../models/alumniMigration.model');
const notificationService = require('../services/notification.service');

// Apply Alumni Migration (Student)
const applyMigration = (req, res) => {
  const userId = req.user.id;

  const {
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
    visibleContactMethods,
  } = req.body;

  if (!graduationYear) {
    return res.status(400).json({
      success: false,
      message: 'Graduation year is required',
    });
  }

  const parsedGraduationYear = Number(graduationYear);
  if (!Number.isInteger(parsedGraduationYear) || parsedGraduationYear < 1950 || parsedGraduationYear > 2100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid graduation year',
    });
  }

  // Check if user is already ALUMNI or has approved application
  alumniMigrationModel.getApprovedMigrationApplicationByUserId(userId, (err, approvedResult) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (approvedResult.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already an alumni',
      });
    }

    // Check if user has an active PENDING application
    alumniMigrationModel.getPendingMigrationApplicationByUserId(userId, (err, pendingResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (pendingResult.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending alumni migration application',
        });
      }

      const formattedVisibleContactMethods = Array.isArray(visibleContactMethods)
        ? JSON.stringify(visibleContactMethods)
        : (typeof visibleContactMethods === 'string' ? visibleContactMethods : null);

      const migrationData = [
        userId,
        parsedGraduationYear,
        currentPosition?.trim() || null,
        currentCompany?.trim() || null,
        currentLocation?.trim() || null,
        githubLink?.trim() || null,
        linkedinLink?.trim() || null,
        facebookLink?.trim() || null,
        personalWebsite?.trim() || null,
        contactEmail?.trim() || null,
        whatsappNumber?.trim() || null,
        preferredContactMethod?.trim() || null,
        formattedVisibleContactMethods,
      ];

      alumniMigrationModel.createMigrationApplication(migrationData, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        return res.status(201).json({
          success: true,
          message: 'Alumni migration application submitted successfully',
        });
      });
    });
  });
};

// Get My Migration Application (Student)
const getMyMigrationApplication = (req, res) => {
  const userId = req.user.id;

  alumniMigrationModel.getLatestMigrationApplicationByUserId(userId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No migration application found',
      });
    }

    return res.status(200).json({
      success: true,
      application: result[0],
    });
  });
};

// Get Pending Migration Applications (Admin)
const getPendingMigrationApplications = (req, res) => {
  alumniMigrationModel.getPendingMigrationApplications((err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      applications: result,
    });
  });
};

// Get Migration Application By Id (Admin)
const getMigrationApplicationById = (req, res) => {
  const { id } = req.params;

  alumniMigrationModel.getMigrationApplicationById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Migration application not found',
      });
    }

    return res.status(200).json({
      success: true,
      application: result[0],
    });
  });
};

// Approve Migration Application (Admin)
const approveMigration = (req, res) => {
  const { id } = req.params;
  const reviewedByUserId = req.user.id;

  alumniMigrationModel.approveMigrationTransaction(id, reviewedByUserId, (err, result) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Server Error',
      });
    }

    const { userId } = result;

    // Send real-time notification
    notificationService.createNotification(
      {
        userId,
        actorUserId: reviewedByUserId,
        type: 'ALUMNI_MIGRATION_APPROVED',
        entityType: 'ALUMNI_MIGRATION',
        referenceId: Number(id),
        message: 'Your Alumni migration application has been approved. You are now an Alumni.',
      },
      req.app.get('io')
    );

    return res.status(200).json({
      success: true,
      message: 'Alumni migration approved successfully',
    });
  });
};

// Reject Migration Application (Admin)
const rejectMigration = (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body || {};
  const reviewedByUserId = req.user.id;

  if (!rejectionReason || !rejectionReason.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required',
    });
  }

  alumniMigrationModel.getMigrationApplicationById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Migration application not found',
      });
    }

    const application = result[0];

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Application is not in PENDING status',
      });
    }

    alumniMigrationModel.rejectMigrationApplication(
      id,
      rejectionReason.trim(),
      reviewedByUserId,
      (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        // Send real-time notification
        notificationService.createNotification(
          {
            userId: application.userId,
            actorUserId: reviewedByUserId,
            type: 'ALUMNI_MIGRATION_REJECTED',
            entityType: 'ALUMNI_MIGRATION',
            referenceId: Number(id),
            message: `Your Alumni migration application has been rejected: ${rejectionReason.trim()}`,
          },
          req.app.get('io')
        );

        return res.status(200).json({
          success: true,
          message: 'Alumni migration rejected successfully',
        });
      }
    );
  });
};

module.exports = {
  applyMigration,
  getMyMigrationApplication,
  getPendingMigrationApplications,
  getMigrationApplicationById,
  approveMigration,
  rejectMigration,
};
