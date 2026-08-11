const postModel = require('../models/post.model');
const postLikeModel = require('../models/postLike.model');
const notificationService = require('../services/notification.service');

// Like Post
const likePost = (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user.id;

  postModel.checkPostExists(postId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    postLikeModel.hasLiked(postId, userId, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You already liked this post',
        });
      }

      postLikeModel.likePost(postId, userId, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        // Trigger POST_LIKE Notification
        postModel.getPostById(postId, userId, (postErr, postRes) => {
          if (!postErr && postRes && postRes.length > 0) {
            notificationService.createNotification(
              {
                userId: postRes[0].userId,
                actorUserId: userId,
                type: 'POST_LIKE',
                entityType: 'POST',
                referenceId: Number(postId),
                message: '{actor} liked your post.',
              },
              req.app.get('io')
            );
          }
        });

        return res.status(200).json({
          success: true,
          message: 'Post liked successfully',
        });
      });
    });
  });
};

// Unlike Post
const unlikePost = (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user.id;

  postModel.checkPostExists(postId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    postLikeModel.hasLiked(postId, userId, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      if (result.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'You have not liked this post',
        });
      }

      postLikeModel.unlikePost(postId, userId, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Post unliked successfully',
        });
      });
    });
  });
};

module.exports = {
  likePost,
  unlikePost,
};
