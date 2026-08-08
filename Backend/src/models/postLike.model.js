const db = require('../config/db');

// Like Post
const likePost = (postId, userId, callback) => {
  const sql = `
    INSERT INTO post_likes (postId, userId)
    VALUES (?, ?)
  `;

  db.query(sql, [postId, userId], callback);
};

// Unlike Post
const unlikePost = (postId, userId, callback) => {
  const sql = `
    DELETE FROM post_likes
    WHERE postId = ? AND userId = ?
  `;

  db.query(sql, [postId, userId], callback);
};

// Check Like
const hasLiked = (postId, userId, callback) => {
  const sql = `
    SELECT *
    FROM post_likes
    WHERE postId = ? AND userId = ?
  `;

  db.query(sql, [postId, userId], callback);
};

module.exports = {
  likePost,
  unlikePost,
  hasLiked,
};

