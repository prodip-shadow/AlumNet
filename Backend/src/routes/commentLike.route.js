const express = require('express');
const router = express.Router();

const commentLikeController = require('../controllers/commentLike.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

router.post(
  '/:id/like',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  commentLikeController.likeComment,
);

router.delete(
  '/:id/like',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  commentLikeController.unlikeComment,
);

module.exports = router;
