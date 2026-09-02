const express = require('express');
const router = express.Router();

const eventController = require('../controllers/event.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');
const { uploadSingleImage } = require('../middlewares/upload.middleware');

// Admin Permission Routes
router.post(
  '/permissions/:userId',
  verifyToken,
  allowRoles('ADMIN'),
  eventController.grantPermission,
);

router.delete(
  '/permissions/:userId',
  verifyToken,
  allowRoles('ADMIN'),
  eventController.revokePermission,
);

router.get(
  '/permissions',
  verifyToken,
  allowRoles('ADMIN'),
  eventController.listPermittedUsers,
);

// Event CRUD Routes (Accessible by Admin and permitted Alumni / Student creators)
router.post(
  '/',
  verifyToken,
  allowRoles('ADMIN', 'ALUMNI', 'STUDENT'),
  ...uploadSingleImage('banner'),
  eventController.createEvent,
);

router.get(
  '/',
  verifyToken,
  eventController.getAllEvents,
);

router.get(
  '/my',
  verifyToken,
  allowRoles('ADMIN', 'ALUMNI', 'STUDENT'),
  eventController.getMyEvents,
);

router.get(
  '/my-events',
  verifyToken,
  allowRoles('ADMIN', 'ALUMNI', 'STUDENT'),
  eventController.getMyEvents,
);

router.get(
  '/:id',
  verifyToken,
  eventController.getEventById,
);

router.put(
  '/:id',
  verifyToken,
  allowRoles('ADMIN', 'ALUMNI', 'STUDENT'),
  ...uploadSingleImage('banner'),
  eventController.updateEvent,
);

router.patch(
  '/:id/status',
  verifyToken,
  allowRoles('ADMIN', 'ALUMNI', 'STUDENT'),
  eventController.updateEventStatus,
);

router.delete(
  '/:id',
  verifyToken,
  allowRoles('ADMIN', 'ALUMNI', 'STUDENT'),
  eventController.deleteEvent,
);

// Event Registration & Creator Applicant List Routes
router.post(
  '/:id/register',
  verifyToken,
  eventController.registerForEvent,
);

router.get(
  '/:id/registrations',
  verifyToken,
  allowRoles('ADMIN', 'ALUMNI', 'STUDENT'),
  eventController.getEventRegistrations,
);

module.exports = router;
