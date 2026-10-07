
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
router.post('/login', loginLimiter, authController.login);
router.post('/logout', verifyToken, authController.logout);
router.post('/refresh', authController.refreshToken);

router.get('/me', verifyToken, authController.me);

// Security & Reset Password Routes
router.post('/change-password', verifyToken, authController.changePassword);
router.post('/change-email', verifyToken, authController.changeEmail);
router.post('/toggle-2fa', verifyToken, authController.toggle2FA);
router.post('/verify-2fa', authController.verify2FA);
router.post('/resend-2fa', authController.resend2FA);

router.post('/forgot-password/request', authController.requestPasswordReset);
router.post('/forgot-password/reset', authController.resetPasswordWithCode);

module.exports = router;

