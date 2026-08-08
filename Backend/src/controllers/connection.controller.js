const connectionModel = require('../models/connection.model');
const userModel = require('../models/user.model');

// Send Connection Request
const sendConnectionRequest = (req, res) => {
  const targetUserId = req.params.targetUserId || req.params.alumniUserId;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;

  // Prevent self request
  if (Number(requesterId) === Number(targetUserId)) {
    return res.status(400).json({
      success: false,
      message: 'You cannot send a connection request to yourself',
    });
  }

  // Verify target user exists and is eligible (STUDENT or ALUMNI)
  userModel.getUserById(targetUserId, (err, userResult) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found',
      });
    }

    const targetUser = userResult[0];

    if (!['STUDENT', 'ALUMNI'].includes(targetUser.role)) {
      return res.status(400).json({
        success: false,
        message: 'Target user is not eligible for connection requests',
      });
    }

    // Rule: Students cannot send requests to other students
    if (requesterRole === 'STUDENT' && targetUser.role === 'STUDENT') {
      return res.status(400).json({
        success: false,
        message: 'Students cannot send connection requests to other students',
      });
    }

    // Check existing connection in both directions (A -> B or B -> A)
    connectionModel.checkConnection(requesterId, targetUserId, (err, connectionResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (connectionResult.length > 0) {
        const existingConnection = connectionResult[0];

        if (existingConnection.status === 'PENDING') {
          return res.status(400).json({
            success: false,
            message: 'A connection request is already pending between users',
          });
        }

        if (existingConnection.status === 'ACCEPTED') {
          return res.status(400).json({
            success: false,
            message: 'You are already connected with this user',
          });
        }

        if (existingConnection.status === 'REJECTED') {
          return res.status(400).json({
            success: false,
            message: 'Connection request was previously rejected',
          });
        }
      }

      // Send Request
      connectionModel.sendRequest(requesterId, targetUserId, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        return res.status(201).json({
          success: true,
          message: 'Connection request sent successfully',
        });
      });
    });
  });
};

// Get Incoming Pending Connection Requests
const getIncomingRequests = (req, res) => {
  const recipientId = req.user.id;

  connectionModel.getIncomingRequests(recipientId, (err, requests) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      requests,
    });
  });
};

// Get Outgoing Pending Connection Requests
const getOutgoingRequests = (req, res) => {
  const requesterId = req.user.id;

  connectionModel.getOutgoingRequests(requesterId, (err, requests) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      requests,
    });
  });
};

// Get My Accepted Connections List
const getMyConnections = (req, res) => {
  const userId = req.user.id;

  connectionModel.getMyConnections(userId, (err, connections) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(200).json({
      success: true,
      connections,
    });
  });
};

// Accept Connection Request
const acceptConnection = (req, res) => {
  const { id } = req.params;

  connectionModel.getConnectionById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found',
      });
    }

    const connection = result[0];

    if (Number(connection.recipientId) !== Number(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (connection.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Connection request is not pending',
      });
    }

    connectionModel.updateStatus(id, 'ACCEPTED', (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Connection request accepted successfully',
      });
    });
  });
};

// Reject Connection Request
const rejectConnection = (req, res) => {
  const { id } = req.params;

  connectionModel.getConnectionById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found',
      });
    }

    const connection = result[0];

    if (Number(connection.recipientId) !== Number(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (connection.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Connection request is not pending',
      });
    }

    connectionModel.updateStatus(id, 'REJECTED', (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Connection request rejected successfully',
      });
    });
  });
};

// Delete Connection (Unfriend)
const deleteConnection = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  connectionModel.getConnectionById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found',
      });
    }

    const connection = result[0];

    if (
      Number(connection.requesterId) !== Number(userId) &&
      Number(connection.recipientId) !== Number(userId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (connection.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: 'Connection is not accepted',
      });
    }

    connectionModel.deleteConnection(id, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Connection removed successfully',
      });
    });
  });
};

module.exports = {
  sendConnectionRequest,
  getIncomingRequests,
  getOutgoingRequests,
  getMyConnections,
  acceptConnection,
  rejectConnection,
  deleteConnection,
};
