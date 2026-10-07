56
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    userModel.getUserById(decoded.id, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (!result || result.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found.',
        });
      }

      if (!result[0].isActive) {
        return res.status(403).json({
          success: false,
          isDeactivated: true,
          message: 'Your account has been deactivated by the admin.',
        });
      }

      const dbUser = result[0];
      req.user = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      };

      next();
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

const optionalVerifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    userModel.getUserById(decoded.id, (err, result) => {
      if (err || !result || result.length === 0 || !result[0].isActive) {
        req.user = null;
        return next();
      }

      const dbUser = result[0];
      req.user = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      };

      next();
    });
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  verifyToken,
  optionalVerifyToken,
};

