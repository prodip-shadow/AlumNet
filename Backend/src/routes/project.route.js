const express = require('express');
const router = express.Router();

const projectController = require('../controllers/project.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');
const { uploadSingleImage } = require('../middlewares/upload.middleware');

router.post(
  '/',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  ...uploadSingleImage('projectImage'),
  projectController.createProject,
);

router.get(
  '/',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  projectController.getMyProjects,
);

router.get(
  '/:id',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  projectController.getProjectById,
);

router.put(
  '/:id',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  ...uploadSingleImage('projectImage'),
  projectController.updateProject,
);

router.delete(
  '/:id',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  projectController.deleteProject,
);

module.exports = router;
