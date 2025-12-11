import React, { useCallback, useState } from 'react';
import '../styles/MediaUploader.css';

const MediaUploader = ({ 
  onFilesSelect, 
  onRemoveFile, 
  previews = [], 
  isUploading = false, 
  progress = 0 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  // File validation constants
  const FILE_LIMITS = {
    MAX_FILES: 10,
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
    ACCEPTED_TYPES: {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      videos: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
    }
  };

  // Get all accepted MIME types
  const acceptedTypes = [
    ...FILE_LIMITS.ACCEPTED_TYPES.images,
    ...FILE_LIMITS.ACCEPTED_TYPES.videos
  ].join(',');

  const validateFiles = (files) => {
    const fileArray = Array.from(files);
    let totalSize = 0;
    
    // Check number of files
    if (previews.length + fileArray.length > FILE_LIMITS.MAX_FILES) {
      setError(`Maximum ${FILE_LIMITS.MAX_FILES} files allowed`);
      return false;
    }

    // Validate each file
    for (const file of fileArray) {
      // Check file type
      const isImage = FILE_LIMITS.ACCEPTED_TYPES.images.includes(file.type);
      const isVideo = FILE_LIMITS.ACCEPTED_TYPES.videos.includes(file.type);
      
      if (!isImage && !isVideo) {
        setError(`File type not supported: ${file.name}`);
        return false;
      }

      // Check file size
      if (isImage && file.size > FILE_LIMITS.MAX_IMAGE_SIZE) {
        setError(`Image ${file.name} is too large (max ${FILE_LIMITS.MAX_IMAGE_SIZE/1024/1024}MB)`);
        return false;
      }

      if (isVideo && file.size > FILE_LIMITS.MAX_VIDEO_SIZE) {
        setError(`Video ${file.name} is too large (max ${FILE_LIMITS.MAX_VIDEO_SIZE/1024/1024}MB)`);
        return false;
      }

      totalSize += file.size;
    }

    // Check total size (optional)
    if (totalSize > 500 * 1024 * 1024) { // 500MB total limit
      setError('Total files size exceeds 500MB limit');
      return false;
    }

    setError('');
    return true;
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (!files.length) return;

    if (validateFiles(files)) {
      onFilesSelect(files);
      e.target.value = ''; // Reset input
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length && validateFiles(files)) {
      onFilesSelect(files);
    }
  }, [onFilesSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="media-uploader-container">
      {/* Upload Zone */}
      <div 
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id="media-upload"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
        
        <label htmlFor="media-upload" className="upload-label">
          <div className="upload-icon">
            {isUploading ? '⏳' : '📁'}
          </div>
          <div className="upload-text">
            {isUploading ? (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span>{progress}% Uploading...</span>
              </div>
            ) : (
              <>
                <h3>📸 Add Photos & Videos</h3>
                <p>Drag & drop or click to browse</p>
                <p className="upload-hint">
                  Supports: JPG, PNG, GIF, WebP, MP4, MOV, AVI
                </p>
                <p className="upload-limits">
                  📏 Max: 10 files • 🖼️ 10MB/image • 🎥 100MB/video
                </p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="upload-error">
          ⚠️ {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="preview-grid">
          <div className="preview-header">
            <h4>Selected Media ({previews.length}/{FILE_LIMITS.MAX_FILES})</h4>
            <button 
              className="clear-all-btn"
              onClick={() => {
                previews.forEach((_, index) => onRemoveFile(index));
              }}
              disabled={isUploading}
            >
              Clear All
            </button>
          </div>
          
          <div className="preview-items">
            {previews.map((preview, index) => (
              <div key={index} className="preview-item">
                <div className="preview-content">
                  {preview.type === 'image' ? (
                    <img 
                      src={preview.url} 
                      alt={`Preview ${index + 1}`}
                      className="preview-image"
                    />
                  ) : (
                    <div className="preview-video">
                      <video src={preview.url} className="video-thumbnail" />
                      <div className="video-badge">🎥</div>
                      {preview.duration && (
                        <span className="video-duration">
                          {Math.floor(preview.duration / 60)}:
                          {String(preview.duration % 60).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="preview-info">
                    <span className="file-name">
                      {preview.name?.substring(0, 15)}...
                    </span>
                    <span className="file-size">
                      {formatFileSize(preview.size)}
                    </span>
                  </div>
                </div>
                
                <button
                  className="remove-preview-btn"
                  onClick={() => onRemoveFile(index)}
                  disabled={isUploading}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;