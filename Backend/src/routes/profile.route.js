
const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profile.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');
const { uploadSingleImage } = require('../middlewares/upload.middleware');

router.get(
  '/me',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  profileController.getMyProfile,
);

router.put(
  '/me',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  profileController.updateMyProfile,
);


router.put(
  '/picture',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  ...uploadSingleImage('profileImage'),
  profileController.updateProfilePicture,
);

module.exports = router;

