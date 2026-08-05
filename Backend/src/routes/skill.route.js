const express = require('express');
const router = express.Router();

const skillController = require('../controllers/skill.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

// Admin Routes
router.post('/', verifyToken, allowRoles('ADMIN'), skillController.createSkill);

router.get('/', verifyToken, skillController.getAllSkills);

router.get('/:id', verifyToken, skillController.getSkillById);

router.put(
  '/:id',
  verifyToken,
  allowRoles('ADMIN'),
  skillController.updateSkill,
);

router.delete(
  '/:id',
  verifyToken,
  allowRoles('ADMIN'),
  skillController.deleteSkill,
);

module.exports = router;
