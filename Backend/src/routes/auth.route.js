
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { uploadSingleImage } = require('../middlewares/upload.middleware');
const { loginLimiter } = require('../middlewares/rateLimit.middleware');

// Routes
router.post(
  '/register',
  ...uploadSingleImage('profileImage'),
  authController.register,
);
router.post('/login',loginLimiter, authController.login);
router.post('/logout', verifyToken, authController.logout);
router.post('/refresh', authController.refreshToken);

router.get('/me', verifyToken, authController.me);


module.exports = router;

