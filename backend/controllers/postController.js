const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    // SAFETY CHECK for req.body
    const { content, imageUrl } = req.body || {};
    const userId = req.user.id;

    // Validate required fields
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Post content is required'
      });
    }

    // Get user details
    const user = await User.findById(userId).select('name role department');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const post = await Post.create({
      content: content.trim(),
      imageUrl: imageUrl || '',
      user: userId
    });

    // Populate user info
    const populatedPost = await Post.findById(post._id)
      .populate('user', 'name role profilePhoto department')
      .populate('comments.user', 'name profilePhoto');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating post'
    });
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name role profilePhoto department facultyDepartment designation')
      .populate('comments.user', 'name profilePhoto');

    res.json({
      success: true,
      count: posts.length,
      posts
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching posts'
    });
  }
};

// @desc    Like a post
// @route   POST /api/posts/:postId/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already liked
    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    // Get updated post with populated data
    const updatedPost = await Post.findById(postId)
      .populate('user', 'name role profilePhoto department')
      .populate('comments.user', 'name profilePhoto');

    res.json({
      success: true,
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      post: updatedPost
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error liking post'
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:postId/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    // SAFETY CHECK for req.body
    const { content } = req.body || {};
    const userId = req.user.id;

    // Validate comment content
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Get user info
    const user = await User.findById(userId).select('name');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Add comment
    post.comments.push({
      user: userId,
      userName: user.name,
      content: content.trim()
    });

    await post.save();

    // Get updated post with populated data
    const updatedPost = await Post.findById(postId)
      .populate('user', 'name role profilePhoto department')
      .populate('comments.user', 'name profilePhoto');

    res.json({
      success: true,
      message: 'Comment added successfully',
      post: updatedPost
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment'
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  likePost,
  addComment
};