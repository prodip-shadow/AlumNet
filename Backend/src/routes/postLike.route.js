const express = require('express');
const router = express.Router();

const postLikeController = require('../controllers/postLike.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

router.post(
  '/:id/like',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  postLikeController.likePost,
);

router.delete(
  '/:id/like',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  postLikeController.unlikePost,
);

module.exports = router;
