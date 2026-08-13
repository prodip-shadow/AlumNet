const express = require('express');
const router = express.Router();

const alumniMigrationController = require('../controllers/alumniMigration.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

// Student Routes
router.post(
  '/apply',
  verifyToken,
  allowRoles('STUDENT'),
  alumniMigrationController.applyMigration
);

router.get(
  '/my-application',
  verifyToken,
  allowRoles('STUDENT'),
  alumniMigrationController.getMyMigrationApplication
);

// Admin Routes
router.get(
  '/pending',
  verifyToken,
  allowRoles('ADMIN'),
  alumniMigrationController.getPendingMigrationApplications
);

router.get(
  '/:id',
  verifyToken,
  allowRoles('ADMIN'),
  alumniMigrationController.getMigrationApplicationById
);

router.patch(
  '/:id/approve',
  verifyToken,
  allowRoles('ADMIN'),
  alumniMigrationController.approveMigration
);

router.patch(
  '/:id/reject',
  verifyToken,
  allowRoles('ADMIN'),
  alumniMigrationController.rejectMigration
);

module.exports = router;
