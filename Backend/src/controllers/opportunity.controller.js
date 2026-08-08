const opportunityModel = require('../models/opportunity.model');

const ALLOWED_TYPES = [
  'JOB',
  'INTERNSHIP',
  'SCHOLARSHIP',
  'EVENT',
  'TRAINING',
  'WORKSHOP',
  'OTHER',
];

const ALLOWED_APPLICATION_STATUSES = [
  'APPLIED',
  'SHORTLISTED',
  'SELECTED',
  'REJECTED',
];

// Create Opportunity
const createOpportunity = (req, res) => {
  const userId = req.user.id;
  const { type, content, isCvRequired } = req.body;

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Valid opportunity type is required',
    });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Opportunity content is required',
    });
  }

  const cvRequired = Boolean(isCvRequired);

  opportunityModel.createOpportunity(
    [userId, type, content.trim(), cvRequired],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Opportunity created successfully',
      });
    },
  );
};

// Get All Opportunities (Feed - ACTIVE only)
const getAllOpportunities = (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize) || 10);

  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  const type = req.query.type && ALLOWED_TYPES.includes(req.query.type) ? req.query.type : null;

  opportunityModel.getAllOpportunities(type, limit, offset, (err, opportunities) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    const response = opportunities.map((opp) => ({
      ...opp,
      isCvRequired: Boolean(opp.isCvRequired),
      applicationCount: Number(opp.applicationCount),
    }));

    return res.status(200).json({
      success: true,
      opportunities: response,
      page,
      pageSize,
    });
  });
};

// Get My Opportunities (Owner Dashboard)
const getMyOpportunities = (req, res) => {
  const userId = req.user.id;

  opportunityModel.getMyOpportunities(userId, (err, opportunities) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    const response = opportunities.map((opp) => ({
      ...opp,
      isCvRequired: Boolean(opp.isCvRequired),
      applicationCount: Number(opp.applicationCount),
    }));

    return res.status(200).json({
      success: true,
      opportunities: response,
    });
  });
};

// Get Opportunity By ID (Restricts access to CLOSED opportunities)
const getOpportunityById = (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  opportunityModel.getOpportunityById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    const opportunity = {
      ...result[0],
      isCvRequired: Boolean(result[0].isCvRequired),
      applicationCount: Number(result[0].applicationCount),
    };

    // If opportunity is CLOSED, restrict access
    if (opportunity.status === 'CLOSED') {
      const isOwner = Number(opportunity.userId) === Number(currentUserId) || currentUserRole === 'ADMIN';

      if (isOwner) {
        return res.status(200).json({
          success: true,
          opportunity,
        });
      }

      // Check if student has already applied
      opportunityModel.checkStudentApplied(id, currentUserId, (err, appliedResult) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        if (appliedResult.length > 0) {
          return res.status(200).json({
            success: true,
            opportunity,
          });
        }

        return res.status(404).json({
          success: false,
          message: 'Opportunity is closed or not available',
        });
      });

      return;
    }

    return res.status(200).json({
      success: true,
      opportunity,
    });
  });
};

// Update Opportunity
const updateOpportunity = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const { type, content, isCvRequired } = req.body;

  opportunityModel.getOpportunityById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    const opportunity = result[0];

    if (Number(opportunity.userId) !== Number(userId) && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid opportunity type is required',
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Opportunity content is required',
      });
    }

    const cvRequired = Boolean(isCvRequired);

    opportunityModel.updateOpportunity(
      id,
      [type, content.trim(), cvRequired],
      (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Opportunity updated successfully',
        });
      },
    );
  });
};

// Update Opportunity Status (ACTIVE / CLOSED)
const updateOpportunityStatus = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const { status } = req.body;

  if (!status || !['ACTIVE', 'CLOSED'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status (ACTIVE or CLOSED) is required',
    });
  }

  opportunityModel.getOpportunityById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    const opportunity = result[0];

    if (Number(opportunity.userId) !== Number(userId) && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    opportunityModel.updateOpportunityStatus(id, status, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Opportunity status updated successfully',
      });
    });
  });
};

// Delete Opportunity
const deleteOpportunity = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  opportunityModel.getOpportunityById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    const opportunity = result[0];

    if (Number(opportunity.userId) !== Number(userId) && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    opportunityModel.deleteOpportunity(id, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Opportunity deleted successfully',
      });
    });
  });
};

// Apply Opportunity
const applyOpportunity = (req, res) => {
  const { id } = req.params;
  const studentId = req.user.id;

  opportunityModel.getOpportunityById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    const opportunity = result[0];

    // Prevent applying to CLOSED opportunities
    if (opportunity.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: 'This opportunity is no longer accepting applications.',
      });
    }

    // Check duplicate application
    opportunityModel.checkStudentApplied(id, studentId, (err, appliedResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (appliedResult.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already applied for this opportunity',
        });
      }

      const isCvRequired = Boolean(opportunity.isCvRequired);
      const cvUrl = req.uploadedCvUrl || null;

      if (isCvRequired && !cvUrl) {
        return res.status(400).json({
          success: false,
          message: 'CV upload is mandatory for this opportunity',
        });
      }

      opportunityModel.applyOpportunity([id, studentId, cvUrl], (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        return res.status(201).json({
          success: true,
          message: 'Application submitted successfully',
        });
      });
    });
  });
};

// Get My Applications (Student Dashboard)
const getMyApplications = (req, res) => {
  const studentId = req.user.id;

  opportunityModel.getMyApplications(studentId, (err, applications) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    const formattedApplications = applications.map((app) => ({
      applicationId: app.applicationId,
      opportunityId: app.opportunityId,
      cvUrl: app.cvUrl,
      status: app.status,
      message: app.message || null,
      appliedDate: app.appliedDate,
      opportunity: {
        id: app.opportunityId,
        type: app.type,
        content: app.content,
        isCvRequired: Boolean(app.isCvRequired),
        status: app.opportunityStatus,
        createdAt: app.opportunityCreatedAt,
      },
      owner: {
        id: app.ownerId,
        name: app.ownerName,
        profileImageUrl: app.ownerProfileImageUrl,
        role: app.ownerRole,
      },
    }));

    return res.status(200).json({
      success: true,
      applications: formattedApplications,
    });
  });
};

// Get Opportunity Applicants (Owner Dashboard)
const getOpportunityApplicants = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const statusFilter = req.query.status && ALLOWED_APPLICATION_STATUSES.includes(req.query.status)
    ? req.query.status
    : null;

  opportunityModel.getOpportunityById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    const opportunity = result[0];

    if (Number(opportunity.userId) !== Number(userId) && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    opportunityModel.getOpportunityApplicants(id, statusFilter, (err, applicants) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      const response = applicants.map((app) => ({
        applicationId: app.applicationId,
        studentId: app.studentId,
        name: app.name,
        profileImageUrl: app.profileImageUrl,
        currentSemester: app.currentSemester || null,
        departmentName: app.departmentName || null,
        facultyName: app.facultyName || null,
        status: app.status,
        message: app.message || null,
        cvUrl: app.cvUrl || null,
        appliedAt: app.appliedAt,
      }));

      return res.status(200).json({
        success: true,
        applicants: response,
      });
    });
  });
};

// Update Application Status & Message
const updateApplicationStatus = (req, res) => {
  const { applicationId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const { status, message } = req.body;

  if (!status || !ALLOWED_APPLICATION_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid application status is required',
    });
  }

  opportunityModel.getApplicationById(applicationId, (err, appResult) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (appResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const application = appResult[0];

    opportunityModel.getOpportunityById(application.opportunityId, (err, oppResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (oppResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Opportunity not found',
        });
      }

      const opportunity = oppResult[0];

      if (Number(opportunity.userId) !== Number(userId) && userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const messageText = message?.trim() || null;

      opportunityModel.updateApplicationStatus(
        applicationId,
        status,
        messageText,
        (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Server Error',
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Application status updated successfully',
          });
        },
      );
    });
  });
};

module.exports = {
  createOpportunity,
  getAllOpportunities,
  getMyOpportunities,
  getOpportunityById,
  updateOpportunity,
  updateOpportunityStatus,
  deleteOpportunity,
  applyOpportunity,
  getMyApplications,
  getOpportunityApplicants,
  updateApplicationStatus,
};
