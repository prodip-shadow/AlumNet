
const express = require('express');
const router = express.Router();

const departmentController = require('../controllers/department.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

router.post(
  '/',
  verifyToken,
  allowRoles('ADMIN'),
  departmentController.createDepartment,
);

router.get(
  '/',
  verifyToken,
  allowRoles('ADMIN'),
  departmentController.getAllDepartments,
);

router.get(
  '/:id',
  verifyToken,
  allowRoles('ADMIN'),
  departmentController.getDepartmentById,
);

router.get(
  '/faculty/:facultyId',
  verifyToken,
  allowRoles('ADMIN'),
  departmentController.getDepartmentsByFacultyId,
);

router.put(
  '/:id',
  verifyToken,
  allowRoles('ADMIN'),
  departmentController.updateDepartment,
);

router.delete(
  '/:id',
  verifyToken,
  allowRoles('ADMIN'),
  departmentController.deleteDepartment,
);

module.exports = router;

