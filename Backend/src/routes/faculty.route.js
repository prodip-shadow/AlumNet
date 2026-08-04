const express = require('express');
const router = express.Router();

const facultyController = require('../controllers/faculty.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

router.post(
  '/',
  verifyToken,
  allowRoles('ADMIN'),
  facultyController.createFaculty,
);

router.get(
  '/',
  verifyToken,
  allowRoles('ADMIN'),
  facultyController.getAllFaculties,
);

router.get(
  '/:id',
  verifyToken,
  allowRoles('ADMIN'),
  facultyController.getFacultyById,
);

router.put(
  '/:id',
  verifyToken,
  allowRoles('ADMIN'),
  facultyController.updateFaculty,
);

router.delete(
  '/:id',
  verifyToken,
  allowRoles('ADMIN'),
  facultyController.deleteFaculty,
);

module.exports = router;
