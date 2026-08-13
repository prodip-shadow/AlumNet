const adminModel = require('../models/admin.model');
const notificationService = require('../services/notification.service');

// Get Users List (Paginated & Searchable)
const getUsers = (req, res) => {
  const { search, role, page, limit } = req.query;

  adminModel.getUsersList({ search, role, page, limit }, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      ...result,
    });
  });
};

// Get Full User Details By ID (No Secrets)
const getFullUserDetails = (req, res) => {
  const { id } = req.params;
  const userId = Number(id);

  if (!userId || isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
    });
  }

  adminModel.getFullUserDetailsById(userId, (err, userDetails) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: userDetails,
    });
  });
};

// Update User Profile (Admin)
const updateUserProfile = (req, res) => {
  const { id } = req.params;
  const userId = Number(id);

  if (!userId || isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
    });
  }

  const { name, isActive, ...profileData } = req.body || {};
  const userData = {};

  if (name !== undefined) userData.name = String(name).trim();
  if (isActive !== undefined) userData.isActive = Boolean(isActive);

  adminModel.updateUserFullProfileTransaction(userId, userData, profileData, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
    });
  });
};

// Change User Role (Admin)
const changeUserRole = (req, res) => {
  const { id } = req.params;
  const targetUserId = Number(id);
  const adminUserId = req.user.id;
  const { role } = req.body;

  if (!targetUserId || isNaN(targetUserId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
    });
  }

  if (Number(adminUserId) === Number(targetUserId)) {
    return res.status(400).json({
      success: false,
      message: 'You cannot change your own role',
    });
  }

  if (!role || !['STUDENT', 'ALUMNI', 'ADMIN', 'USER'].includes(role.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified. Valid roles are STUDENT, ALUMNI, ADMIN, USER.',
    });
  }

  const targetRole = role.toUpperCase();

  adminModel.changeUserRoleTransaction(targetUserId, targetRole, adminUserId, (err, result) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Server Error',
      });
    }

    // Send real-time notification
    notificationService.createNotification(
      {
        userId: targetUserId,
        actorUserId: adminUserId,
        type: 'ROLE_CHANGED',
        entityType: 'USER',
        referenceId: targetUserId,
        message: `Your account role has been updated to ${targetRole}.`,
      },
      req.app.get('io')
    );

    return res.status(200).json({
      success: true,
      message: `User role updated to ${targetRole} successfully`,
    });
  });
};

// Toggle User Status (Activate / Deactivate)
const toggleUserStatus = (req, res) => {
  const { id } = req.params;
  const targetUserId = Number(id);
  const adminUserId = req.user.id;
  const { isActive } = req.body;

  if (!targetUserId || isNaN(targetUserId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
    });
  }

  if (Number(adminUserId) === Number(targetUserId)) {
    return res.status(400).json({
      success: false,
      message: 'You cannot change your own active status',
    });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive field must be a boolean (true or false)',
    });
  }

  adminModel.updateUserStatus(targetUserId, isActive, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  });
};

// Delete User Account (Admin Permanent Delete)
const deleteUser = (req, res) => {
  const { id } = req.params;
  const targetUserId = Number(id);
  const adminUserId = req.user.id;

  if (!targetUserId || isNaN(targetUserId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
    });
  }

  if (Number(adminUserId) === Number(targetUserId)) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own admin account',
    });
  }

  adminModel.deleteUserTransaction(targetUserId, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User account permanently deleted successfully',
    });
  });
};

module.exports = {
  getUsers,
  getFullUserDetails,
  updateUserProfile,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
};
