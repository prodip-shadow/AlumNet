const replyModel = require('../models/reply.model');
const commentModel = require('../models/comment.model');
const notificationService = require('../services/notification.service');

// Create Reply
const createReply = (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const content = req.body.content?.trim();
  const parentReplyId = req.body.parentReplyId || null;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Reply is required',
    });
  }

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

    if (parentReplyId) {
      replyModel.getReplyById(parentReplyId, (err, parentResult) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        if (parentResult.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Parent reply not found',
          });
        }

        if (Number(parentResult[0].commentId) !== Number(commentId)) {
          return res.status(400).json({
            success: false,
            message: 'Parent reply does not belong to this comment',
          });
        }

        const recipientUserId = parentResult[0].userId;

        replyModel.createReply(
          [commentId, parentReplyId, userId, content],
          (err) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Server Error',
              });
            }

            // Trigger COMMENT_REPLY Notification
            notificationService.createNotification(
              {
                userId: recipientUserId,
                actorUserId: userId,
                type: 'COMMENT_REPLY',
                entityType: 'COMMENT',
                referenceId: Number(commentId),
                message: '{actor} replied to your comment.',
              },
              req.app.get('io')
            );

            return res.status(201).json({
              success: true,
              message: 'Reply created successfully',
            });
          },
        );
      });
    } else {
      const recipientUserId = comment.userId;

      replyModel.createReply(
        [commentId, null, userId, content],
        (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Server Error',
            });
          }

          // Trigger COMMENT_REPLY Notification
          notificationService.createNotification(
            {
              userId: recipientUserId,
              actorUserId: userId,
              type: 'COMMENT_REPLY',
              entityType: 'COMMENT',
              referenceId: Number(commentId),
              message: '{actor} replied to your comment.',
            },
            req.app.get('io')
          );

          return res.status(201).json({
            success: true,
            message: 'Reply created successfully',
          });
        },
      );
    }
  });
};

// Get Replies
const getRepliesByCommentId = (req, res) => {
  const { commentId } = req.params;

  replyModel.getRepliesByCommentId(commentId, req.user.id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    const formattedReplies = result.map((reply) => ({
      ...reply,
      likeCount: Number(reply.likeCount),
      isLiked: Boolean(reply.isLiked),
    }));

    return res.status(200).json({
      success: true,
      replies: formattedReplies,
    });
  });
};

// Update Reply
const updateReply = (req, res) => {
  const { id } = req.params;

  replyModel.getReplyById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found',
      });
    }

    const reply = result[0];

    if (reply.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const content = req.body.content?.trim();

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Reply is required',
      });
    }

    replyModel.updateReply(id, content, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Reply updated successfully',
      });
    });
  });
};

// Delete Reply
const deleteReply = (req, res) => {
  const { id } = req.params;

  replyModel.getReplyById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found',
      });
    }

    const reply = result[0];

    if (reply.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    replyModel.deleteReply(id, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Reply deleted successfully',
      });
    });
  });
};

module.exports = {
  createReply,
  getRepliesByCommentId,
  updateReply,
  deleteReply,
};
