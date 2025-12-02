const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'campus-connect/profiles',
    format: async (req, file) => 'png',
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return 'profile-' + uniqueSuffix;
    },
    transformation: [
      { width: 500, height: 500, crop: "limit" },
      { quality: "auto" },
      { format: "png" }
    ]
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// MongoDB connection
let db;
const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI); // Fixed: MONGODB_URI not MONGO_URI
    await client.connect();
    db = client.db('swish');
    console.log("✅ MongoDB connected successfully to Atlas");
    
    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('posts').createIndex({ createdAt: -1 });
    await db.collection('posts').createIndex({ userId: 1 });
    
  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
  }
};
connectDB();

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// ==================== AUTH ROUTES ====================

// Register with Cloudinary
app.post("/api/auth/register", upload.single('profilePhoto'), async (req, res) => {
  try {
    const { 
      name, email, password, role, contact,
      studentId, department, year,
      employeeId, facultyDepartment, designation,
      adminCode
    } = req.body;

    // Validate university email
    if (!email.endsWith('@sigce.edu')) {
      if (req.file && req.file.path) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(400).json({ message: 'Please use your SIGCE email (@sigce.edu)' });
    }

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      if (req.file && req.file.path) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate admin code
    if (role === 'admin' && adminCode !== "CAMPUS2024") {
      if (req.file && req.file.path) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(400).json({ message: 'Invalid admin access code' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Handle profile photo
    let profilePhotoUrl = '';
    if (req.file) {
      profilePhotoUrl = req.file.path;
    }

    const user = {
      name,
      email,
      password: hashedPassword,
      contact,
      role: role || 'student',
      profilePhoto: profilePhotoUrl,
      bio: 'Passionate about technology and innovation. Always eager to learn and grow.',
      skills: ["JavaScript", "React", "Node.js", "Python"],
      campus: 'SIGCE Campus',
      followers: [],
      following: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add role-specific fields
    if (role === 'student') {
      user.studentId = studentId;
      user.department = department;
      user.year = year;
    } else if (role === 'faculty') {
      user.employeeId = employeeId;
      user.department = facultyDepartment;
      user.designation = designation;
    } else if (role === 'admin') {
      user.permissions = ['manage_users', 'moderate_content'];
    }

    const result = await db.collection('users').insertOne(user);

    // Generate token
    const token = jwt.sign(
      { userId: result.insertedId.toString() }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare user response
    const userResponse = {
      id: result.insertedId,
      name: user.name,
      email: user.email,
      contact: user.contact,
      role: user.role,
      profilePhoto: user.profilePhoto,
      bio: user.bio,
      skills: user.skills,
      campus: user.campus
    };

    // Add role-specific fields to response
    if (user.studentId) userResponse.studentId = user.studentId;
    if (user.department) userResponse.department = user.department;
    if (user.year) userResponse.year = user.year;
    if (user.employeeId) userResponse.employeeId = user.employeeId;
    if (user.designation) userResponse.designation = user.designation;

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    if (req.file && req.file.path) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate university email
    if (!email.endsWith('@sigce.edu')) {
      return res.status(400).json({ message: 'Please use your SIGCE email (@sigce.edu)' });
    }

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      contact: user.contact,
      role: user.role,
      profilePhoto: user.profilePhoto,
      bio: user.bio,
      skills: user.skills || [],
      campus: user.campus,
      studentId: user.studentId || '',
      department: user.department || '',
      year: user.year || '',
      employeeId: user.employeeId || '',
      facultyDepartment: user.facultyDepartment || '',
      designation: user.designation || ''
    };

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== PROFILE ROUTES ====================

// Get user profile
app.get("/api/auth/profile", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userResponse = { ...user };
    delete userResponse.password;
    userResponse.id = userResponse._id;

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
app.put("/api/auth/profile", auth, async (req, res) => {
  try {
    const { 
      name,
      contact,
      bio,
      skills,
      studentId,
      department,
      year,
      employeeId,
      facultyDepartment,
      designation
    } = req.body;

    const userId = req.user.userId;

    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (contact !== undefined) updateData.contact = contact;
    if (bio !== undefined) updateData.bio = bio;
    if (skills) {
      updateData.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    }
    if (department) updateData.department = department;
    if (year) updateData.year = year;
    if (studentId) updateData.studentId = studentId;
    if (employeeId) updateData.employeeId = employeeId;
    if (facultyDepartment) updateData.facultyDepartment = facultyDepartment;
    if (designation) updateData.designation = designation;

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }

    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    const userResponse = { ...updatedUser };
    delete userResponse.password;
    userResponse.id = userResponse._id;

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== POST ROUTES ====================

// Create post
app.post("/api/posts", auth, async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = {
      content: content.trim(),
      userId: new ObjectId(userId),
      likes: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('posts').insertOne(post);
    
    // Get user data for response
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    const postResponse = {
      _id: result.insertedId,
      content: post.content,
      likes: post.likes,
      comments: post.comments,
      createdAt: post.createdAt,
      user: {
        id: user._id,
        name: user.name,
        profilePhoto: user.profilePhoto,
        role: user.role,
        department: user.department
      }
    };

    res.status(201).json(postResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all posts
app.get("/api/posts", auth, async (req, res) => {
  try {
    const posts = await db.collection('posts').find().sort({ createdAt: -1 }).toArray();
    
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const user = await db.collection('users').findOne({ _id: new ObjectId(post.userId) });
        return {
          _id: post._id,
          content: post.content,
          imageUrl: post.imageUrl,
          likes: post.likes || [],
          comments: post.comments || [],
          createdAt: post.createdAt,
          user: {
            id: user?._id,
            name: user?.name || "Unknown User",
            profilePhoto: user?.profilePhoto,
            role: user?.role,
            department: user?.department
          }
        };
      })
    );

    res.json(postsWithUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like/unlike post
app.post("/api/posts/:postId/like", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.includes(userId);
    
    if (alreadyLiked) {
      await db.collection('posts').updateOne(
        { _id: new ObjectId(postId) },
        { $pull: { likes: userId } }
      );
    } else {
      await db.collection('posts').updateOne(
        { _id: new ObjectId(postId) },
        { $push: { likes: userId } }
      );
    }

    // Get updated post
    const updatedPost = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    const user = await db.collection('users').findOne({ _id: new ObjectId(updatedPost.userId) });
    
    const postResponse = {
      _id: updatedPost._id,
      content: updatedPost.content,
      likes: updatedPost.likes || [],
      comments: updatedPost.comments || [],
      createdAt: updatedPost.createdAt,
      user: {
        id: user?._id,
        name: user?.name || "Unknown User",
        profilePhoto: user?.profilePhoto,
        role: user?.role,
        department: user?.department
      }
    };

    res.json(postResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment to post
app.post("/api/posts/:postId/comment", auth, async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    const userId = req.user.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Get user info for comment
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      content: content.trim(),
      userId: userId,
      userName: user.name,
      timestamp: new Date()
    };

    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      { $push: { comments: comment } }
    );

    // Get updated post
    const updatedPost = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    const postUser = await db.collection('users').findOne({ _id: new ObjectId(updatedPost.userId) });
    
    const postResponse = {
      _id: updatedPost._id,
      content: updatedPost.content,
      likes: updatedPost.likes || [],
      comments: updatedPost.comments || [],
      createdAt: updatedPost.createdAt,
      user: {
        id: postUser?._id,
        name: postUser?.name || "Unknown User",
        profilePhoto: postUser?.profilePhoto,
        role: postUser?.role,
        department: postUser?.department
      }
    };

    res.json({
      message: 'Comment added successfully',
      post: postResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== TEST ROUTES ====================

app.get("/", (req, res) => {
  res.json({ 
    message: "Swish Backend API is running 🚀",
    version: "1.0",
    campus: "SIGCE Campus"
  });
});

app.get("/api/test", async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    const posts = await db.collection('posts').find().toArray();
    res.json({ 
      message: 'API is working!', 
      users: users.length,
      posts: posts.length,
      campus: 'SIGCE Campus'
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port: ${PORT}`));