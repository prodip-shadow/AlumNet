const db = require('../config/db');

// Create Post
const createPost = (data, callback) => {
  const sql = `
    INSERT INTO posts (
      userId,
      content,
      imageUrl
    )
    VALUES (?, ?, ?)
  `;

  db.query(sql, data, callback);
};

// Get All Posts (Feed)
const getAllPosts = (userId, limit, offset, callback) => {
  const sql = `
    SELECT
      posts.*,
      users.name,
      users.profileImageUrl,
      users.role,
      (SELECT COUNT(*) FROM post_likes WHERE post_likes.postId = posts.id) AS likeCount,
      (SELECT COUNT(*) FROM comments WHERE comments.postId = posts.id) AS commentCount,
      (EXISTS(SELECT 1 FROM post_likes WHERE post_likes.postId = posts.id AND post_likes.userId = ?)) AS isLiked
    FROM posts
    INNER JOIN users
      ON posts.userId = users.id
    ORDER BY posts.createdAt DESC
    LIMIT ?
    OFFSET ?
  `;

  db.query(sql, [userId, limit, offset], callback);
};

// Get Post By Id
const getPostById = (id, userId, callback) => {
  const sql = `
    SELECT
      posts.*,
      users.name,
      users.profileImageUrl,
      users.role,
      (SELECT COUNT(*) FROM post_likes WHERE post_likes.postId = posts.id) AS likeCount,
      (SELECT COUNT(*) FROM comments WHERE comments.postId = posts.id) AS commentCount,
      (EXISTS(SELECT 1 FROM post_likes WHERE post_likes.postId = posts.id AND post_likes.userId = ?)) AS isLiked
    FROM posts
    INNER JOIN users
      ON posts.userId = users.id
    WHERE posts.id = ?
  `;

  db.query(sql, [userId, id], callback);
};

// Update Post
const updatePost = (id, data, callback) => {
  const fields = [];
  const values = [];

  Object.keys(data).forEach((key) => {
    fields.push(`${key} = ?`);
    values.push(data[key]);
  });

  fields.push('updatedAt = NOW()');

  const sql = `
    UPDATE posts
    SET ${fields.join(', ')}
    WHERE id = ?
  `;

  db.query(sql, [...values, id], callback);
};

// Delete Post
const deletePost = (id, callback) => {
  const sql = `
    DELETE FROM posts
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Check Post Exists
const checkPostExists = (id, callback) => {
  const sql = `
    SELECT id
    FROM posts
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  checkPostExists,
  updatePost,
  deletePost,
};

