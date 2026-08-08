const postModel = require('../models/post.model');
const postLikeModel = require('../models/postLike.model');


// Create Post
const createPost = (req, res) => {
  const userId = req.user.id;

  const content = req.body.content?.trim() || null;
  const imageUrl = req.uploadedImageUrl || null;

  if (!content && !imageUrl) {
    return res.status(400).json({
      success: false,
      message: 'Post content or image is required',
    });
  }

  postModel.createPost([userId, content, imageUrl], (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
    });
  });
};

// Get Feed
const getAllPosts = (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize) || 10);

  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  postModel.getAllPosts(req.user.id, limit, offset, (err, posts) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    const response = posts.map((post) => ({
      ...post,
      likeCount: Number(post.likeCount),
      commentCount: Number(post.commentCount),
      isLiked: Boolean(post.isLiked),
    }));

    return res.status(200).json({
      success: true,
      posts: response,
      page,
      pageSize,
    });
  });
};

// Get Post By Id
const getPostById = (req, res) => {
  const { id } = req.params;

  postModel.getPostById(id, req.user.id, (err, result) => {
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

    const post = {
      ...result[0],
      likeCount: Number(result[0].likeCount),
      commentCount: Number(result[0].commentCount),
      isLiked: Boolean(result[0].isLiked),
    };

    return res.status(200).json({
      success: true,
      post,
    });
  });
};

// Update Post
const updatePost = (req, res) => {
  const { id } = req.params;

  postModel.getPostById(id, req.user.id, (err, result) => {
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

    const post = result[0];

    if (post.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const data = {};

    if (req.body.content !== undefined) {
      const content = req.body.content.trim();

      if (!content && !req.uploadedImageUrl && !post.imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'Post cannot be empty',
        });
      }

      data.content = content || null;
    }

    if (req.uploadedImageUrl) {
      data.imageUrl = req.uploadedImageUrl;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data to update',
      });
    }

    postModel.updatePost(id, data, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Post updated successfully',
      });
    });
  });
};

// Delete Post
const deletePost = (req, res) => {
  const { id } = req.params;

  postModel.getPostById(id, req.user.id, (err, result) => {
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

    if (result[0].userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    postModel.deletePost(id, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Post deleted successfully',
      });
    });
  });
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};
