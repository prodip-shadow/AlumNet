const db = require('../config/db');

// Create Reply
const createReply = (data, callback) => {
  const sql = `
    INSERT INTO comment_replies (
      commentId,
      userId,
      content
    )
    VALUES (?, ?, ?)
  `;

  db.query(sql, data, callback);
};

// Get Replies By Comment Id
const getRepliesByCommentId = (commentId, callback) => {
  const sql = `
    SELECT
      comment_replies.*,
      users.name,
      users.profileImageUrl,
      users.role
    FROM comment_replies
    INNER JOIN users
      ON comment_replies.userId = users.id
    WHERE comment_replies.commentId = ?
    ORDER BY comment_replies.createdAt ASC
  `;

  db.query(sql, [commentId], callback);
};

// Get Reply By Id
const getReplyById = (id, callback) => {
  const sql = `
    SELECT *
    FROM comment_replies
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Update Reply
const updateReply = (id, content, callback) => {
  const sql = `
    UPDATE comment_replies
    SET
      content = ?
    WHERE id = ?
  `;

  db.query(sql, [content, id], callback);
};

// Delete Reply
const deleteReply = (id, callback) => {
  const sql = `
    DELETE FROM comment_replies
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

module.exports = {
  createReply,
  getRepliesByCommentId,
  getReplyById,
  updateReply,
  deleteReply,
};
