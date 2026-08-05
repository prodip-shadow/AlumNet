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

  postModel.getAllPosts(limit, offset, (err, posts) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }

    postLikeModel.getLikeCounts((err, likeCounts) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server Error',
        });
      }

      postLikeModel.getUserLikes(req.user.id, (err, userLikes) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Server Error',
          });
        }

        const likeMap = {};

        likeCounts.forEach((item) => {
          likeMap[item.postId] = Number(item.totalLikes);
        });

        const likedPosts = new Set(userLikes.map((item) => item.postId));

        const response = posts.map((post) => ({
          ...post,
          likeCount: likeMap[post.id] || 0,
          isLiked: likedPosts.has(post.id),
        }));

        return res.status(200).json({
          success: true,
          posts: response,
          page,
          pageSize,
        });
      });
    });
  });
};

// Get Post By Id
const getPostById = (req, res) => {
  const { id } = req.params;

  postModel.getPostById(id, (err, result) => {
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

    return res.status(200).json({
      success: true,
      post: result[0],
    });
  });
};

// Update Post
const updatePost = (req, res) => {
  const { id } = req.params;

  postModel.getPostById(id, (err, result) => {
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

  postModel.getPostById(id, (err, result) => {
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
