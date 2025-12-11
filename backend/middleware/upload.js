// backend/middleware/upload.js
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage for Multer
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'swish_campus',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi'],
    resource_type: 'auto', // Automatically detect image/video
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' }, // Resize images
      { quality: 'auto:good' } // Auto optimize quality
    ]
  }
});

// File filter for both images and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image (JPEG, PNG, GIF, WebP) and video (MP4, MOV, AVI) files are allowed!'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: cloudinaryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for videos
    files: 10 // Max 10 files per upload
  }
});

// Multiple file upload middleware
const uploadMedia = upload.array('media', 10); // 'media' is the field name, max 10 files

// Single file upload middleware (for profile pictures, etc.)
const uploadSingle = upload.single('file');

module.exports = { uploadMedia, uploadSingle };