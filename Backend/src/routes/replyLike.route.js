const express = require('express');
const router = express.Router();

const replyLikeController = require('../controllers/replyLike.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

router.post(
  '/:id/like',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  replyLikeController.likeReply,
);

router.delete(
  '/:id/like',
  verifyToken,
  allowRoles('STUDENT', 'ALUMNI'),
  replyLikeController.unlikeReply,
);

module.exports = router;

