const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { uploadSingleImage } = require('../middlewares/upload.middleware');

const {
  loginLimiter,
  verify2FALimiter,
  resend2FALimiter,
  requestResetLimiter,
  resetPasswordLimiter,
  changePasswordLimiter,
  changeEmailLimiter,
  toggle2FALimiter,
  registerLimiter,
  refreshTokenLimiter,
} = require('../middlewares/rateLimit.middleware');

// Public Authentication Routes
router.post(
  '/register',
  registerLimiter,
  ...uploadSingleImage('profileImage'),
  authController.register,
);

router.post('/login', loginLimiter, authController.login);
router.post('/logout', verifyToken, authController.logout);
router.post('/refresh', refreshTokenLimiter, authController.refreshToken);
router.get('/me', verifyToken, authController.me);

// Security & Account Management Routes
router.post('/change-password', verifyToken, changePasswordLimiter, authController.changePassword);
router.post('/change-email', verifyToken, changeEmailLimiter, authController.changeEmail);
router.post('/toggle-2fa', verifyToken, toggle2FALimiter, authController.toggle2FA);

// 2FA Verification Routes
router.post('/verify-2fa', verify2FALimiter, authController.verify2FA);
router.post('/resend-2fa', resend2FALimiter, authController.resend2FA);

// Password Recovery Routes
router.post('/forgot-password/request', requestResetLimiter, authController.requestPasswordReset);
router.post('/forgot-password/reset', resetPasswordLimiter, authController.resetPasswordWithCode);

module.exports = router;
