const express = require('express');
const router = express.Router();

const replyController = require('../controllers/reply.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

// Create Reply
router.post(
  '/comments/:commentId/replies',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  replyController.createReply,
);

// Get Replies of a Comment
router.get(
  '/comments/:commentId/replies',
  verifyToken,
  replyController.getRepliesByCommentId,
);

// Update Reply
router.put(
  '/replies/:id',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  replyController.updateReply,
);

// Delete Reply
router.delete(
  '/replies/:id',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI', 'ADMIN'),
  replyController.deleteReply,
);

module.exports = router;
