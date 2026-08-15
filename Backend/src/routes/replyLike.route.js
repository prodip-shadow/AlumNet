const express = require('express');
const router = express.Router();

const replyLikeController = require('../controllers/replyLike.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

router.post(
  '/:id/like',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI', 'ADMIN'),
  replyLikeController.likeReply,
);

router.delete(
  '/:id/like',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI', 'ADMIN'),
  replyLikeController.unlikeReply,
);

module.exports = router;
