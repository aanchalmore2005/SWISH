const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  contact: {
    type: String,
    trim: true
  },
  
  // Role & Verification
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Profile
  profilePhoto: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: 'Passionate about technology and innovation.',
    maxlength: 500
  },
  skills: [{
    type: String,
    trim: true
  }],
  
  // Student Specific
  studentId: {
    type: String,
    sparse: true
  },
  department: {
    type: String,
    trim: true
  },
  year: {
    type: String,
    enum: ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Postgraduate']
  },
  
  // Faculty Specific
  employeeId: {
    type: String,
    sparse: true
  },
  facultyDepartment: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Head of Department', 'Lab Incharge']
  },
  
  // Admin
  adminCode: {
    type: String
  },
  
  // Social
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compare password method (optional - can also use bcrypt.compare directly)
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);