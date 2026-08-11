const commentLikeModel = require('../models/commentLike.model');
const commentModel = require('../models/comment.model');
const notificationService = require('../services/notification.service');

// Like Comment
const likeComment = (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;

  commentModel.getCommentById(commentId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const comment = result[0];

    commentLikeModel.isCommentLiked(commentId, userId, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment already liked',
        });
      }

      commentLikeModel.likeComment([commentId, userId], (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        // Trigger COMMENT_LIKE Notification
        notificationService.createNotification(
          {
            userId: comment.userId,
            actorUserId: userId,
            type: 'COMMENT_LIKE',
            entityType: 'COMMENT',
            referenceId: Number(commentId),
            message: '{actor} liked your comment.',
          },
          req.app.get('io')
        );

        return res.status(201).json({
          success: true,
          message: 'Comment liked successfully',
        });
      });
    });
  });
};

// Unlike Comment
const unlikeComment = (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;

  commentModel.getCommentById(commentId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    commentLikeModel.isCommentLiked(commentId, userId, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment is not liked yet',
        });
      }

      commentLikeModel.unlikeComment(commentId, userId, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Comment unliked successfully',
        });
      });
    });
  });
};

module.exports = {
  likeComment,
  unlikeComment,
};
