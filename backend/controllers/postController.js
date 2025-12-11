// backend/controllers/postController.js
const { ObjectId } = require('mongodb');

// @desc    Create a post with media
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    console.log("📤 Creating post...", req.body);
    console.log("📤 Files:", req.files);
    
    // Handle both form-data and JSON
    let content = '';
    let media = [];
    
    if (req.body.content) {
      content = req.body.content;
    } else if (req.body) {
      // Handle JSON body
      content = req.body.content || '';
    }
    
    const userId = req.user.id;

    // Validate required fields
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Post content is required'
      });
    }

    // Get user details
    const user = await req.db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { name: 1, role: 1, department: 1, profilePhoto: 1 } }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Process uploaded files if any
    if (req.files && req.files.length > 0) {
      media = req.files.map(file => ({
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        url: file.path || file.location || `/uploads/${file.filename}`, // Cloudinary URL or local path
        publicId: file.filename,
        format: file.mimetype.split('/')[1],
        size: file.size || 0
      }));
    }

    // Create post object
    const post = {
      content: content.trim(),
      media: media,
      userId: new ObjectId(userId),
      likes: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("📝 Post to save:", post);

    const result = await req.db.collection('posts').insertOne(post);
    const postId = result.insertedId;

    // Get the saved post
    const savedPost = await req.db.collection('posts').findOne(
      { _id: postId },
      { projection: { userId: 0 } } // Exclude userId from response
    );

    // Prepare response with user info
    const postResponse = {
      _id: savedPost._id,
      content: savedPost.content,
      media: savedPost.media || [],
      likes: savedPost.likes || [],
      comments: savedPost.comments || [],
      createdAt: savedPost.createdAt,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        profilePhoto: user.profilePhoto,
        department: user.department
      }
    };

    console.log("✅ Post created successfully:", postResponse._id);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: postResponse
    });

  } catch (error) {
    console.error('❌ Create post error:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Server error creating post',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Keep other functions the same...
const getPosts = async (req, res) => {
  try {
    const posts = await req.db.collection('posts')
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const user = await req.db.collection('users').findOne(
          { _id: new ObjectId(post.userId) },
          { 
            projection: { 
              name: 1, 
              role: 1, 
              profilePhoto: 1, 
              department: 1,
              facultyDepartment: 1,
              designation: 1 
            } 
          }
        );

        return {
          _id: post._id,
          content: post.content,
          media: post.media || [], // Updated to use media array
          likes: post.likes || [],
          comments: post.comments || [],
          createdAt: post.createdAt,
          user: {
            id: user?._id,
            name: user?.name || "Unknown User",
            role: user?.role,
            profilePhoto: user?.profilePhoto,
            department: user?.department,
            facultyDepartment: user?.facultyDepartment,
            designation: user?.designation
          }
        };
      })
    );

    res.json({
      success: true,
      count: postsWithUsers.length,
      posts: postsWithUsers
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching posts'
    });
  }
};

// Keep likePost, addComment, searchPosts functions as they were...

module.exports = {
  createPost,
  getPosts,
  likePost,
  addComment,
  searchPosts
};