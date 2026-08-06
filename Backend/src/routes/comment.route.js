const express = require('express');
const router = express.Router();

const commentController = require('../controllers/comment.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

// Create Comment
router.post(
  '/posts/:postId/comments',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  commentController.createComment,
);

// Get Comments of a Post
router.get(
  '/posts/:postId/comments',
  verifyToken,
  commentController.getCommentsByPostId,
);

// Update Comment
router.put(
  '/comments/:id',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  commentController.updateComment,
);

// Delete Comment
router.delete(
  '/comments/:id',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI', 'ADMIN'),
  commentController.deleteComment,
);

module.exports = router;
