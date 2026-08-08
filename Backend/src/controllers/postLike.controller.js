const postModel = require('../models/post.model');
const postLikeModel = require('../models/postLike.model');

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
