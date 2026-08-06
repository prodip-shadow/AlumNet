const db = require('../config/db');

// Create Comment
const createComment = (data, callback) => {
  const sql = `
    INSERT INTO comments (
      postId,
      userId,
      content
    )
    VALUES (?, ?, ?)
  `;

  db.query(sql, data, callback);
};

// Get Comments By Post Id
const getCommentsByPostId = (postId, userId, callback) => {
  const sql = `
    SELECT
      comments.*,
      users.name,
      users.profileImageUrl,
      users.role,
      (SELECT COUNT(*) FROM comment_likes WHERE comment_likes.commentId = comments.id) AS likeCount,
      (SELECT COUNT(*) FROM comment_replies WHERE comment_replies.commentId = comments.id) AS replyCount,
      (EXISTS(SELECT 1 FROM comment_likes WHERE comment_likes.commentId = comments.id AND comment_likes.userId = ?)) AS isLiked
    FROM comments
    INNER JOIN users
      ON comments.userId = users.id
    WHERE comments.postId = ?
    ORDER BY comments.createdAt ASC
  `;

  db.query(sql, [userId, postId], callback);
};

// Get Comment By Id
const getCommentById = (id, callback) => {
  const sql = `
    SELECT *
    FROM comments
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Update Comment
const updateComment = (id, content, callback) => {
  const sql = `
    UPDATE comments
    SET
        content = ?
    WHERE id = ?
  `;

  db.query(sql, [content, id], callback);
};

// Delete Comment
const deleteComment = (id, callback) => {
  const sql = `
    DELETE FROM comments
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

module.exports = {
  createComment,
  getCommentsByPostId,
  getCommentById,
  updateComment,
  deleteComment,
};
