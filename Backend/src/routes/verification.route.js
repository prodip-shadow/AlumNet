const express = require('express');
const router = express.Router();

const verificationController = require('../controllers/verification.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

// User
router.post('/apply', verifyToken, verificationController.applyVerification);

router.get(
  '/my-application',
  verifyToken,
  verificationController.getMyVerificationApplication,
);

// Admin
router.get(
  '/pending',
  verifyToken,
  allowRoles('ADMIN'),
  verificationController.getPendingVerificationApplications,
);

router.patch(
  '/:id/approve',
  verifyToken,
  allowRoles('ADMIN'),
  verificationController.approveVerification,
);

router.patch(
  '/:id/reject',
  verifyToken,
  allowRoles('ADMIN'),
  verificationController.rejectVerification,
);
router.delete(
  '/all',
  verifyToken,
  allowRoles('ADMIN'),
  verificationController.deleteAllVerificationApplications,
);

router.delete(
  '/:id',
  verifyToken,
  allowRoles('ADMIN'),
  verificationController.deleteVerificationApplication,
);



module.exports = router;
