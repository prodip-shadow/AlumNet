const db = require('../config/db');

// Like Reply
const likeReply = (data, callback) => {
  const sql = `
    INSERT INTO reply_likes (
      replyId,
      userId
    )
    VALUES (?, ?)
  `;

  db.query(sql, data, callback);
};

// Unlike Reply
const unlikeReply = (replyId, userId, callback) => {
  const sql = `
    DELETE FROM reply_likes
    WHERE replyId = ?
      AND userId = ?
  `;

  db.query(sql, [replyId, userId], callback);
};

// Check Already Liked
const isReplyLiked = (replyId, userId, callback) => {
  const sql = `
    SELECT id
    FROM reply_likes
    WHERE replyId = ?
      AND userId = ?
  `;

  db.query(sql, [replyId, userId], callback);
};

module.exports = {
  likeReply,
  unlikeReply,
  isReplyLiked,
};

