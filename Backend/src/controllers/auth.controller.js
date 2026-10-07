const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const eventModel = require('../models/event.model');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');
const { logSecurityEvent, getClientIp } = require('../services/securityLog.service');

const {
  generateAccessToken,
  generateRefreshToken,
} = require('../services/token.service');

const {
  recordFailedAttempt,
  resetFailedAttempts,
} = require('../middlewares/rateLimit.middleware');

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    userModel.getUserByEmail(email, async (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const profileImageUrl = req.uploadedImageUrl || null;

      userModel.createUser(
        [name, email, hashedPassword, profileImageUrl],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Server Error',
            });
          }

          logSecurityEvent('USER_REGISTERED', {
            email,
            ip: getClientIp(req),
            status: 'SUCCESS',
            message: 'New user account registered successfully',
          });

          return res.status(201).json({
            success: true,
            message: 'User registered successfully',
          });
        },
      );
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  userModel.getUserByEmail(email, async (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    // Mitigation for Account Enumeration & Brute Force
    if (result.length === 0) {
      recordFailedAttempt(email, getClientIp(req));
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      recordFailedAttempt(email, getClientIp(req));
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      logSecurityEvent('LOGIN_REJECTED_DEACTIVATED', {
        email: user.email,
        userId: user.id,
        ip: getClientIp(req),
        status: 'BLOCKED',
        message: 'Attempted login to deactivated account',
      });
      return res.status(403).json({
        success: false,
        isDeactivated: true,
        message: 'Your account has been deactivated by the admin.',
      });
    }

    // Reset failed attempts on valid password check
    resetFailedAttempts(email);

    // Check if 2FA is enabled for this account
    if (user.isTwoFactorEnabled) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      userModel.saveTwoFactorCode(user.id, code, expiresAt, async (tfErr) => {
        if (tfErr) {
          return res.status(500).json({ success: false, message: 'Server Error' });
        }
        await emailService.send2FACode(user.email, code);
        logSecurityEvent('2FA_CODE_GENERATED', {
          email: user.email,
          userId: user.id,
          ip: getClientIp(req),
          status: 'SUCCESS',
          message: '2FA code generated and emailed to user',
        });
        return res.status(200).json({
          success: true,
          requires2FA: true,
          message: 'A 6-digit verification code has been sent to your email (Valid for 5 minutes).',
          userId: user.id,
          email: user.email,
        });
      });
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    userModel.saveRefreshToken(user.id, refreshToken, expiresAt, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000));
      res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

      logSecurityEvent('LOGIN_SUCCESS', {
        email: user.email,
        userId: user.id,
        ip: getClientIp(req),
        status: 'SUCCESS',
        message: 'User logged in successfully',
      });

      const sendLoginResponse = (canCreateEvent) => {
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: Boolean(user.isActive),
            isTwoFactorEnabled: Boolean(user.isTwoFactorEnabled),
            canCreateEvent,
          },
        });
      };

      if (user.role === 'ADMIN') {
        return sendLoginResponse(true);
      }

      eventModel.checkCreatorPermission(user.id, (permErr, permResult) => {
        const canCreateEvent = Boolean(!permErr && permResult && permResult.length > 0);
        return sendLoginResponse(canCreateEvent);
      });
    });
  });
};

const verify2FA = async (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ success: false, message: 'User ID and verification code are required' });
  }

  userModel.getUserById(userId, async (err, result) => {
    if (err || !result || result.length === 0) {
      logSecurityEvent('2FA_VERIFICATION_FAILED', {
        userId,
        ip: getClientIp(req),
        status: 'FAILED',
        message: '2FA failed - user not found',
      });
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result[0];

    if (!user.isTwoFactorEnabled) {
      return res.status(400).json({ success: false, message: 'Two-factor authentication is not enabled for this user' });
    }

    if (!user.twoFactorCode || user.twoFactorCode !== code.toString().trim()) {
      logSecurityEvent('2FA_VERIFICATION_FAILED', {
        email: user.email,
        userId: user.id,
        ip: getClientIp(req),
        status: 'FAILED',
        message: 'Invalid 2FA verification code provided',
      });
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (new Date(user.twoFactorExpiresAt) < new Date()) {
      logSecurityEvent('2FA_VERIFICATION_EXPIRED', {
        email: user.email,
        userId: user.id,
        ip: getClientIp(req),
        status: 'FAILED',
        message: 'Expired 2FA verification code provided',
      });
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please log in again.' });
    }

    // Clear 2FA code upon successful verification
    userModel.clearTwoFactorCode(user.id, (clearErr) => {
      if (clearErr) console.warn('Failed to clear 2FA code:', clearErr);

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      userModel.saveRefreshToken(user.id, refreshToken, expiresAt, (rfErr) => {
        if (rfErr) return res.status(500).json({ success: false, message: 'Server Error' });

        res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000));
        res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

        logSecurityEvent('2FA_VERIFICATION_SUCCESS', {
          email: user.email,
          userId: user.id,
          ip: getClientIp(req),
          status: 'SUCCESS',
          message: '2FA code verified successfully',
        });

        const sendLoginResponse = (canCreateEvent) => {
          return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: Boolean(user.isActive),
              isTwoFactorEnabled: Boolean(user.isTwoFactorEnabled),
              canCreateEvent,
            },
          });
        };

        if (user.role === 'ADMIN') return sendLoginResponse(true);

        eventModel.checkCreatorPermission(user.id, (permErr, permResult) => {
          const canCreateEvent = Boolean(!permErr && permResult && permResult.length > 0);
          return sendLoginResponse(canCreateEvent);
        });
      });
    });
  });
};

const resend2FA = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

  userModel.getUserById(userId, async (err, result) => {
    if (err || !result || result.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result[0];

    if (!user.isTwoFactorEnabled) {
      return res.status(400).json({ success: false, message: 'Two-factor authentication is not enabled for this user' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    userModel.saveTwoFactorCode(user.id, code, expiresAt, async (tfErr) => {
      if (tfErr) return res.status(500).json({ success: false, message: 'Server Error' });
      await emailService.send2FACode(user.email, code);

      logSecurityEvent('2FA_CODE_RESENT', {
        email: user.email,
        userId: user.id,
        ip: getClientIp(req),
        status: 'SUCCESS',
        message: 'New 2FA code generated and resent',
      });

      return res.status(200).json({
        success: true,
        message: 'A new 6-digit verification code has been sent to your email.',
      });
    });
  });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    userModel.getUserById(userId, async (err, result) => {
      if (err || !result || result.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = result[0];
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        logSecurityEvent('PASSWORD_CHANGE_FAILED', {
          email: user.email,
          userId,
          ip: getClientIp(req),
          status: 'FAILED',
          message: 'Incorrect current password during password change attempt',
        });
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      userModel.updatePassword(userId, hashedPassword, (updateErr) => {
        if (updateErr) return res.status(500).json({ success: false, message: 'Server Error' });

        logSecurityEvent('PASSWORD_CHANGE_SUCCESS', {
          email: user.email,
          userId,
          ip: getClientIp(req),
          status: 'SUCCESS',
          message: 'User successfully changed account password',
        });

        return res.status(200).json({ success: true, message: 'Password changed successfully' });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changeEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const userId = req.user.id;

    if (!newEmail || !password) {
      return res.status(400).json({ success: false, message: 'New email and current password are required' });
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    userModel.getUserById(userId, async (err, result) => {
      if (err || !result || result.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = result[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        logSecurityEvent('EMAIL_CHANGE_FAILED', {
          email: user.email,
          userId,
          ip: getClientIp(req),
          status: 'FAILED',
          message: 'Incorrect password during email change attempt',
        });
        return res.status(401).json({ success: false, message: 'Password is incorrect' });
      }

      userModel.getUserByEmail(newEmail, (checkErr, checkResult) => {
        if (checkErr) return res.status(500).json({ success: false, message: 'Server Error' });

        if (checkResult && checkResult.length > 0 && checkResult[0].id !== userId) {
          return res.status(400).json({ success: false, message: 'This email is already in use by another account' });
        }

        userModel.updateEmail(userId, newEmail, (updateErr) => {
          if (updateErr) return res.status(500).json({ success: false, message: 'Server Error' });

          logSecurityEvent('EMAIL_CHANGE_SUCCESS', {
            email: newEmail,
            userId,
            ip: getClientIp(req),
            status: 'SUCCESS',
            message: `User updated account email from ${user.email} to ${newEmail}`,
          });

          return res.status(200).json({ success: true, message: 'Email address updated successfully', email: newEmail });
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggle2FA = async (req, res) => {
  try {
    const { password, enable } = req.body;
    const userId = req.user.id;

    if (!password || enable === undefined) {
      return res.status(400).json({ success: false, message: 'Account password and enable flag are required' });
    }

    userModel.getUserById(userId, async (err, result) => {
      if (err || !result || result.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = result[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        logSecurityEvent('TOGGLE_2FA_FAILED', {
          email: user.email,
          userId,
          ip: getClientIp(req),
          status: 'FAILED',
          message: 'Incorrect password during 2FA toggle attempt',
        });
        return res.status(401).json({ success: false, message: 'Account password is incorrect' });
      }

      const targetStatus = Boolean(enable);
      userModel.updateTwoFactorStatus(userId, targetStatus, (updateErr) => {
        if (updateErr) return res.status(500).json({ success: false, message: 'Server Error' });

        logSecurityEvent('TOGGLE_2FA_SUCCESS', {
          email: user.email,
          userId,
          ip: getClientIp(req),
          status: 'SUCCESS',
          message: `User ${targetStatus ? 'enabled' : 'disabled'} Two-Factor Authentication`,
        });

        return res.status(200).json({
          success: true,
          message: `Two-Factor Authentication has been ${targetStatus ? 'enabled' : 'disabled'} successfully`,
          isTwoFactorEnabled: targetStatus,
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    userModel.getUserByEmail(email, async (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Server Error' });
      }

      // Mitigation for Account Enumeration: Return generic 200 success even if email not found
      if (result.length === 0) {
        logSecurityEvent('PASSWORD_RESET_REQUEST_UNREGISTERED', {
          email,
          ip: getClientIp(req),
          status: 'INFO',
          message: 'Password reset requested for unregistered email',
        });
        return res.status(200).json({
          success: true,
          message: 'A 6-digit verification code has been sent to your email (Valid for 5 minutes).',
          email,
        });
      }

      const user = result[0];
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      userModel.saveResetCode(user.id, code, expiresAt, async (saveErr) => {
        if (saveErr) {
          return res.status(500).json({ success: false, message: 'Server Error' });
        }
        await emailService.sendResetPasswordCode(user.email, code);

        logSecurityEvent('PASSWORD_RESET_REQUEST_SUCCESS', {
          email: user.email,
          userId: user.id,
          ip: getClientIp(req),
          status: 'SUCCESS',
          message: 'Password reset code generated and sent via email',
        });

        return res.status(200).json({
          success: true,
          message: 'A 6-digit verification code has been sent to your email (Valid for 5 minutes).',
          email: user.email,
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    userModel.getUserByEmail(email, async (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Server Error' });
      }

      if (result.length === 0) {
        logSecurityEvent('PASSWORD_RESET_FAILED', {
          email,
          ip: getClientIp(req),
          status: 'FAILED',
          message: 'Password reset failed - email not found',
        });
        return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
      }

      const user = result[0];

      if (!user.resetCode || user.resetCode !== code.toString().trim()) {
        logSecurityEvent('PASSWORD_RESET_FAILED', {
          email: user.email,
          userId: user.id,
          ip: getClientIp(req),
          status: 'FAILED',
          message: 'Invalid password reset code provided',
        });
        return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
      }

      if (new Date(user.resetExpiresAt) < new Date()) {
        logSecurityEvent('PASSWORD_RESET_EXPIRED', {
          email: user.email,
          userId: user.id,
          ip: getClientIp(req),
          status: 'FAILED',
          message: 'Expired password reset code provided',
        });
        return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      userModel.updatePassword(user.id, hashedPassword, (updateErr) => {
        if (updateErr) return res.status(500).json({ success: false, message: 'Server Error' });

        userModel.clearResetCode(user.id, (clearErr) => {
          if (clearErr) console.warn('Failed to clear reset code:', clearErr);

          logSecurityEvent('PASSWORD_RESET_SUCCESS', {
            email: user.email,
            userId: user.id,
            ip: getClientIp(req),
            status: 'SUCCESS',
            message: 'User successfully reset password using 6-digit OTP code',
          });

          return res.status(200).json({
            success: true,
            message: 'Password reset successfully! You can now sign in with your new password.',
          });
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const me = (req, res) => {
  userModel.getUserById(req.user.id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result[0];

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        isDeactivated: true,
        message: 'Your account has been deactivated by the admin.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: false,
          isTwoFactorEnabled: Boolean(user.isTwoFactorEnabled),
        },
      });
    }

    // Refresh accessToken cookie if role changed
    const freshAccessToken = generateAccessToken(user);
    res.cookie('accessToken', freshAccessToken, getCookieOptions(15 * 60 * 1000));

    const sendResponse = (canCreateEvent) => {
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: Boolean(user.isActive),
          isTwoFactorEnabled: Boolean(user.isTwoFactorEnabled),
          profileImageUrl: user.profileImageUrl,
          canCreateEvent,
        },
      });
    };

    if (user.role === 'ADMIN') {
      return sendResponse(true);
    }

    eventModel.checkCreatorPermission(user.id, (permErr, permResult) => {
      const canCreateEvent = Boolean(!permErr && permResult && permResult.length > 0);
      return sendResponse(canCreateEvent);
    });
  });
};

const refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token not found',
    });
  }

  userModel.getUserByRefreshToken(refreshToken, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      logSecurityEvent('REFRESH_TOKEN_INVALID', {
        ip: getClientIp(req),
        status: 'WARN',
        message: 'Invalid refresh token presented',
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      const accessToken = generateAccessToken({
        id: decoded.id,
        role: result[0].role,
      });

      res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000));

      return res.status(200).json({
        success: true,
        message: 'Access token refreshed',
      });
    } catch (error) {
      logSecurityEvent('REFRESH_TOKEN_EXPIRED', {
        ip: getClientIp(req),
        status: 'WARN',
        message: 'Expired refresh token presented',
      });
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired',
      });
    }
  });
};

const logout = (req, res) => {
  userModel.clearRefreshToken(req.user.id, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    logSecurityEvent('LOGOUT_SUCCESS', {
      userId: req.user.id,
      ip: getClientIp(req),
      status: 'SUCCESS',
      message: 'User logged out successfully',
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  });
};

module.exports = {
  register,
  login,
  me,
  logout,
  refreshToken,
  changePassword,
  changeEmail,
  toggle2FA,
  verify2FA,
  resend2FA,
  requestPasswordReset,
  resetPasswordWithCode,
};
