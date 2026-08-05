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

// Count Likes
const getLikeCount = (postId, callback) => {
  const sql = `
    SELECT COUNT(*) AS totalLikes
    FROM post_likes
    WHERE postId = ?
  `;

  db.query(sql, [postId], callback);
};


// Get Like Counts
const getLikeCounts = (callback) => {
  const sql = `
    SELECT
      postId,
      COUNT(*) AS totalLikes
    FROM post_likes
    GROUP BY postId
  `;

  db.query(sql, callback);
};

// Get User Likes
const getUserLikes = (userId, callback) => {
  const sql = `
    SELECT postId
    FROM post_likes
    WHERE userId = ?
  `;

  db.query(sql, [userId], callback);
};




module.exports = {
  likePost,
  unlikePost,
  hasLiked,
  getLikeCount,

  getLikeCounts,
  getUserLikes,
};
