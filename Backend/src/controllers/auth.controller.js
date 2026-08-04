const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');


const {
  generateAccessToken,
  generateRefreshToken,
} = require('../services/token.service');

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

  userModel.getUserByEmail(email, async (err, result) => {
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
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
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



      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });



      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });





    });
  });
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

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
      },
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

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: 'Access token refreshed',
      });
    } catch (error) {
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
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });


  })
}


module.exports = {
  register,
  login,
  me,
  logout,
  refreshToken,
};
