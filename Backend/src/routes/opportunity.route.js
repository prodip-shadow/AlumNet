const express = require('express');
const router = express.Router();

const opportunityController = require('../controllers/opportunity.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');
const { uploadSingleCv } = require('../middlewares/upload.middleware');

// Create Opportunity (Alumni / Admin)
router.post(
  '/',
  verifyToken,
  allowRoles('ALUMNI', 'ADMIN'),
  opportunityController.createOpportunity,
);

// Browse Opportunities Feed (ACTIVE only)
router.get(
  '/',
  verifyToken,
  opportunityController.getAllOpportunities,
);

// My Opportunities (Owner Dashboard)
router.get(
  '/my',
  verifyToken,
  allowRoles('ALUMNI', 'ADMIN'),
  opportunityController.getMyOpportunities,
);

// My Applications (Student Dashboard)
router.get(
  '/my-applications',
  verifyToken,
  allowRoles('STUDENT'),
  opportunityController.getMyApplications,
);

router.get(
  '/applications/my',
  verifyToken,
  allowRoles('STUDENT'),
  opportunityController.getMyApplications,
);

// Get Opportunity By ID (Restricted if CLOSED)
router.get(
  '/:id',
  verifyToken,
  opportunityController.getOpportunityById,
);

// Update Opportunity (Alumni / Admin Owner)
router.put(
  '/:id',
  verifyToken,
  allowRoles('ALUMNI', 'ADMIN'),
  opportunityController.updateOpportunity,
);

// Update Opportunity Status ACTIVE/CLOSED (Alumni / Admin Owner)
router.patch(
  '/:id/status',
  verifyToken,
  allowRoles('ALUMNI', 'ADMIN'),
  opportunityController.updateOpportunityStatus,
);

// Delete Opportunity (Alumni / Admin Owner)
router.delete(
  '/:id',
  verifyToken,
  allowRoles('ALUMNI', 'ADMIN'),
  opportunityController.deleteOpportunity,
);

// Apply for Opportunity (Student)
router.post(
  '/:id/apply',
  verifyToken,
  allowRoles('STUDENT'),
  ...uploadSingleCv('cv'),
  opportunityController.applyOpportunity,
);

// View Opportunity Applicants (Alumni / Admin Owner)
router.get(
  '/:id/applicants',
  verifyToken,
  allowRoles('ALUMNI', 'ADMIN'),
  opportunityController.getOpportunityApplicants,
);

// Update Application Status & Message (Alumni / Admin Owner)
router.patch(
  '/applications/:applicationId/status',
  verifyToken,
  allowRoles('ALUMNI', 'ADMIN'),
  opportunityController.updateApplicationStatus,
);

module.exports = router;
