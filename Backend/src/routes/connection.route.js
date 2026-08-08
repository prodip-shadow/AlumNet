const express = require('express');
const router = express.Router();

const connectionController = require('../controllers/connection.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

// Send Connection Request
router.post(
  '/request/:targetUserId',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  connectionController.sendConnectionRequest,
);

// Get My Accepted Connections List
router.get(
  '/',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  connectionController.getMyConnections,
);

// Get Incoming Requests
router.get(
  '/incoming',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  connectionController.getIncomingRequests,
);

// Get Outgoing Requests
router.get(
  '/outgoing',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  connectionController.getOutgoingRequests,
);

// Accept Request
router.patch(
  '/:id/accept',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  connectionController.acceptConnection,
);

// Reject Request
router.patch(
  '/:id/reject',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  connectionController.rejectConnection,
);

// Delete Connection (Unfriend)
router.delete(
  '/:id',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  connectionController.deleteConnection,
);

module.exports = router;
