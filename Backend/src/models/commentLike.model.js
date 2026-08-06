const db = require('../config/db');

// Like Comment
const likeComment = (data, callback) => {
  const sql = `
    INSERT INTO comment_likes (
      commentId,
      userId
    )
    VALUES (?, ?)
  `;

  db.query(sql, data, callback);
};

// Unlike Comment
const unlikeComment = (commentId, userId, callback) => {
  const sql = `
    DELETE FROM comment_likes
    WHERE commentId = ?
      AND userId = ?
  `;

  db.query(sql, [commentId, userId], callback);
};

// Check Already Liked
const isCommentLiked = (commentId, userId, callback) => {
  const sql = `
    SELECT id
    FROM comment_likes
    WHERE commentId = ?
      AND userId = ?
  `;

  db.query(sql, [commentId, userId], callback);
};

// Get Like Count
const getCommentLikeCount = (commentId, callback) => {
  const sql = `
    SELECT COUNT(*) AS likeCount
    FROM comment_likes
    WHERE commentId = ?
  `;

  db.query(sql, [commentId], callback);
};

module.exports = {
  likeComment,
  unlikeComment,
  isCommentLiked,
  getCommentLikeCount,
};
