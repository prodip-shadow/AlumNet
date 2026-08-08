const commentModel = require('../models/comment.model');
const postModel = require('../models/post.model');

// Create Comment
const createComment = (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const content = req.body.content?.trim();

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Comment is required',
    });
  }

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

    commentModel.createComment([postId, userId, content], (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Comment created successfully',
      });
    });
  });
};

// Get Comments
const getCommentsByPostId = (req, res) => {
  const { postId } = req.params;

  commentModel.getCommentsByPostId(postId, req.user.id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    const formattedComments = result.map((comment) => ({
      ...comment,
      likeCount: Number(comment.likeCount),
      replyCount: Number(comment.replyCount),
      isLiked: Boolean(comment.isLiked),
    }));

    return res.status(200).json({
      success: true,
      comments: formattedComments,
    });
  });
};

// Update Comment
const updateComment = (req, res) => {
  const { id } = req.params;

  commentModel.getCommentById(id, (err, result) => {
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

    if (comment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const content = req.body.content?.trim();

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required',
      });
    }

    commentModel.updateComment(id, content, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
      });
    });
  });
};

// Delete Comment
const deleteComment = (req, res) => {
  const { id } = req.params;

  commentModel.getCommentById(id, (err, result) => {
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

    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    commentModel.deleteComment(id, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
      });
    });
  });
};

module.exports = {
  createComment,
  getCommentsByPostId,
  updateComment,
  deleteComment,
};
