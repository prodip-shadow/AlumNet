const express = require('express');
const router = express.Router();

const postController = require('../controllers/post.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');
const { uploadSingleImage } = require('../middlewares/upload.middleware');

// Create Post
router.post(
  '/',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI', 'ADMIN'),
  ...uploadSingleImage('postImage'),
  postController.createPost,
);

// Feed (Accessible by all logged in users)
router.get('/', verifyToken, postController.getAllPosts);

// Single Post
router.get('/:id', verifyToken, postController.getPostById);

// Update
router.put(
  '/:id',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI', 'ADMIN'),
  ...uploadSingleImage('postImage'),
  postController.updatePost,
);

// Delete
router.delete(
  '/:id',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI', 'ADMIN'),
  postController.deletePost,
);

module.exports = router;
