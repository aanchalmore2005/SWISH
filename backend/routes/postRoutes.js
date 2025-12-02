const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  likePost,
  addComment
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

// All post routes require authentication
router.use(protect);

router.route('/')
  .post(createPost)
  .get(getPosts);

router.post('/:postId/like', likePost);
router.post('/:postId/comment', addComment);

module.exports = router;