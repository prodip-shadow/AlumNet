const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

// All Admin routes strictly require JWT Token and ADMIN Role
router.use(verifyToken, allowRoles('ADMIN'));

router.get('/', adminController.getUsers);
router.get('/:id', adminController.getFullUserDetails);
router.put('/:id', adminController.updateUserProfile);
router.patch('/:id/role', adminController.changeUserRole);
router.patch('/:id/status', adminController.toggleUserStatus);
router.delete('/:id', adminController.deleteUser);

module.exports = router;
