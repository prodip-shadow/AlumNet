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

      if (!result || result.length === 0 || !result[0].isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive.',
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

module.exports = {
  verifyToken,
};
