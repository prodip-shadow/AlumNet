const rateLimit = require('express-rate-limit');
const { logSecurityEvent, getClientIp } = require('../services/securityLog.service');

/**
 * In-Memory Sliding Window Store for Account-Aware Failed Attempt Tracking
 * Key: normalized email (lowercase)
 * Value: { attempts: number, lockUntil: number | null, lastAttempt: number }
 */
const accountAttemptMap = new Map();

// Configuration Thresholds
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 Minutes

// Cleanup stale entries every 30 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  accountAttemptMap.forEach((data, email) => {
    if (data.lockUntil && now > data.lockUntil) {
      accountAttemptMap.delete(email);
    } else if (now - data.lastAttempt > LOCKOUT_WINDOW_MS) {
      accountAttemptMap.delete(email);
    }
  });
}, 30 * 60 * 1000);

/**
 * Check if an account is temporarily locked due to repeated failed attempts
 */
const isAccountLocked = (email) => {
  if (!email || typeof email !== 'string') return false;
  const normalizedEmail = email.trim().toLowerCase();
  const record = accountAttemptMap.get(normalizedEmail);
  if (!record) return false;

  const now = Date.now();
  if (record.lockUntil && now < record.lockUntil) {
    return true;
  }

  // Lock expired
  if (record.lockUntil && now >= record.lockUntil) {
    accountAttemptMap.delete(normalizedEmail);
    return false;
  }

  return false;
};

/**
 * Record a failed attempt for an email account
 */
const recordFailedAttempt = (email, ip) => {
  if (!email || typeof email !== 'string') return;
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();
  let record = accountAttemptMap.get(normalizedEmail);

  if (!record) {
    record = { attempts: 1, lockUntil: null, lastAttempt: now };
  } else {
    record.attempts += 1;
    record.lastAttempt = now;
  }

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_WINDOW_MS;
    logSecurityEvent('ACCOUNT_LOCKED_TEMPORARY', {
      email: normalizedEmail,
      ip,
      status: 'BLOCKED',
      message: `Account locked temporarily for 15 minutes after ${record.attempts} failed login attempts`,
    });
  } else {
    logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
      email: normalizedEmail,
      ip,
      status: 'FAILED',
      message: `Failed login attempt ${record.attempts}/${MAX_FAILED_ATTEMPTS}`,
    });
  }

  accountAttemptMap.set(normalizedEmail, record);
};

/**
 * Reset failed attempts upon successful login
 */
const resetFailedAttempts = (email) => {
  if (!email || typeof email !== 'string') return;
  const normalizedEmail = email.trim().toLowerCase();
  accountAttemptMap.delete(normalizedEmail);
};

/**
 * Get remaining lockout time in minutes
 */
const getRemainingLockoutMinutes = (email) => {
  if (!email || typeof email !== 'string') return 15;
  const normalizedEmail = email.trim().toLowerCase();
  const record = accountAttemptMap.get(normalizedEmail);
  if (!record || !record.lockUntil) return 15;
  const remainingMs = Math.max(0, record.lockUntil - Date.now());
  return Math.ceil(remainingMs / (60 * 1000));
};

// 1. IP-based Login Rate Limiter (10 requests per 15 mins per IP)
const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      email: req.body?.email,
      status: 'BLOCKED',
      message: 'Too many login attempts from this IP address',
    });
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts from your IP. Please try again in 15 minutes.',
    });
  },
});

// Middleware: Account-Aware Login Protection
const loginLimiter = (req, res, next) => {
  const email = req.body?.email;

  if (email && isAccountLocked(email)) {
    const minutesLeft = getRemainingLockoutMinutes(email);
    logSecurityEvent('LOGIN_ATTEMPT_BLOCKED_ACCOUNT_LOCKED', {
      ip: getClientIp(req),
      email,
      status: 'BLOCKED',
      message: `Login rejected because account is temporarily locked for ${minutesLeft} more minutes`,
    });
    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts for this account. Please try again in ${minutesLeft} minutes.`,
    });
  }

  return loginIpLimiter(req, res, next);
};

// 2. 2FA Verification Limiter (5 attempts per 15 mins per IP/User)
const verify2FALimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      userId: req.body?.userId,
      status: 'BLOCKED',
      message: 'Too many 2FA verification attempts',
    });
    return res.status(429).json({
      success: false,
      message: 'Too many invalid 2FA verification attempts. Please try again in 15 minutes.',
    });
  },
});

// 3. 2FA Resend Limiter (3 requests per 15 mins)
const resend2FALimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      userId: req.body?.userId,
      status: 'WARN',
      message: 'Too many 2FA resend code requests',
    });
    return res.status(429).json({
      success: false,
      message: 'Too many verification code requests. Please wait before requesting another code.',
    });
  },
});

// 4. Forgot Password Request Limiter (3 requests per 15 mins)
const requestResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      email: req.body?.email,
      status: 'WARN',
      message: 'Too many password reset requests',
    });
    return res.status(429).json({
      success: false,
      message: 'Too many password reset requests. Please try again in 15 minutes.',
    });
  },
});

// 5. Password Reset With Code Limiter (5 attempts per 15 mins)
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      email: req.body?.email,
      status: 'BLOCKED',
      message: 'Too many password reset verification attempts',
    });
    return res.status(429).json({
      success: false,
      message: 'Too many invalid reset attempts. Please try again in 15 minutes.',
    });
  },
});

// 6. Change Password Limiter (5 attempts per 15 mins)
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      userId: req.user?.id,
      status: 'BLOCKED',
      message: 'Too many password change attempts',
    });
    return res.status(429).json({
      success: false,
      message: 'Too many password change attempts. Please try again in 15 minutes.',
    });
  },
});

// 7. Change Email Limiter (5 attempts per 15 mins)
const changeEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      userId: req.user?.id,
      status: 'BLOCKED',
      message: 'Too many email change attempts',
    });
    return res.status(429).json({
      success: false,
      message: 'Too many email change attempts. Please try again in 15 minutes.',
    });
  },
});

// 8. Toggle 2FA Limiter (5 attempts per 15 mins)
const toggle2FALimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      userId: req.user?.id,
      status: 'BLOCKED',
      message: 'Too many 2FA toggle attempts',
    });
    return res.status(429).json({
      success: false,
      message: 'Too many 2FA configuration attempts. Please try again in 15 minutes.',
    });
  },
});

// 9. Registration Limiter (5 registrations per hour per IP)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      email: req.body?.email,
      status: 'BLOCKED',
      message: 'Too many registration attempts from this IP',
    });
    return res.status(429).json({
      success: false,
      message: 'Too many account registrations from this IP address. Please try again in an hour.',
    });
  },
});

// 10. Refresh Token Limiter (30 requests per 15 mins)
const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      status: 'WARN',
      message: 'Too many token refresh requests',
    });
    return res.status(429).json({
      success: false,
      message: 'Too many token refresh requests. Please try again later.',
    });
  },
});

module.exports = {
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
  isAccountLocked,
  recordFailedAttempt,
  resetFailedAttempts,
};
