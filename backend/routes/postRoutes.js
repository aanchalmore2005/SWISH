// backend/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  likePost,
  addComment,
  searchPosts
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const { uploadMedia } = require('../middleware/upload');

// All post routes require authentication
router.use(protect);

// Create post with media upload
router.route('/')
  .post(uploadMedia, createPost) // Add upload middleware here
  .get(getPosts);

router.post('/:postId/like', likePost);
router.post('/:postId/comment', addComment);
router.get('/search', searchPosts);

module.exports = router;