const replyLikeModel = require('../models/replyLike.model');
const replyModel = require('../models/reply.model');

// Like Reply
const likeReply = (req, res) => {
  const replyId = req.params.id;
  const userId = req.user.id;

  replyModel.getReplyById(replyId, (err, result) => {
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

    replyLikeModel.isReplyLiked(replyId, userId, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Reply already liked',
        });
      }

      replyLikeModel.likeReply([replyId, userId], (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        return res.status(201).json({
          success: true,
          message: 'Reply liked successfully',
        });
      });
    });
  });
};

// Unlike Reply
const unlikeReply = (req, res) => {
  const replyId = req.params.id;
  const userId = req.user.id;

  replyModel.getReplyById(replyId, (err, result) => {
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

    replyLikeModel.isReplyLiked(replyId, userId, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Reply is not liked yet',
        });
      }

      replyLikeModel.unlikeReply(replyId, userId, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Reply unliked successfully',
        });
      });
    });
  });
};

module.exports = {
  likeReply,
  unlikeReply,
};
