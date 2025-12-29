// PostModal.jsx - Combined Comments + Likes Modal
import React, { useState, useRef, useEffect } from 'react';
import '../styles/PostModal.css';

const PostModal = ({ 
  post, 
  currentUser, 
  users = [], // Array of all users to show who liked
  onClose, 
  onAddComment, 
  onEditComment, 
  onDeleteComment, 
  onLikeComment,
  onLikePost 
}) => {
  const [activeTab, setActiveTab] = useState('comments'); // 'likes' or 'comments'
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const modalRef = useRef();

  // Close modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      const updatedPost = await onAddComment(post._id, newComment);
      if (updatedPost) {
        setNewComment('');
      }
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment._id || comment.timestamp);
    setEditText(comment.content || comment.text);
  };

  const handleEditSubmit = async (commentId) => {
    if (editText.trim()) {
      const updatedPost = await onEditComment(post._id, commentId, editText);
      if (updatedPost) {
        setEditingCommentId(null);
        setEditText('');
      }
    }
  };

  const handleLikePostFromModal = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      await onLikePost(post._id);
    } catch (error) {
      console.error("Error liking post:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else if (diffInHours < 730) {
      return `${Math.floor(diffInHours / 168)}w`;
    } else {
      return `${Math.floor(diffInHours / 730)}mo`;
    }
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const getUserAvatar = (userData) => {
    if (userData?.profilePhoto) {
      return <img src={userData.profilePhoto} alt={userData.name} className="modal-avatar-img" />;
    }
    return <div className="modal-avatar-initials">{getInitials(userData?.name)}</div>;
  };

  // Get likers with proper user data
  const getLikers = () => {
    if (!post.likes || post.likes.length === 0) {
      return [];
    }
    
    return post.likes.map(like => {
      // Get user ID
      let userId = '';
      if (typeof like === 'object' && like.userId) {
        userId = like.userId.toString();
      } else if (typeof like === 'string') {
        userId = like;
      } else {
        return null;
      }
      
      // Find user in users array
      let userData = {
        id: userId,
        name: 'Unknown User',
        department: '',
        profilePhoto: null,
        timestamp: new Date()
      };
      
      if (users && users.length > 0) {
        const foundUser = users.find(u => {
          // Compare IDs as strings
          const uid = u._id ? u._id.toString() : (u.id ? u.id.toString() : '');
          return uid === userId;
        });
        
        if (foundUser) {
          userData.name = foundUser.name || 'Unknown User';
          userData.profilePhoto = foundUser.profilePhoto;
          userData.department = foundUser.department || foundUser.facultyDepartment || '';
          userData.timestamp = foundUser.createdAt || new Date();
        }
      }
      
      // If like object already has username, use it
      if (typeof like === 'object' && like.userName) {
        userData.name = like.userName;
        userData.profilePhoto = like.userProfilePhoto || userData.profilePhoto;
        userData.timestamp = like.timestamp || new Date();
      }
      
      return userData;
    }).filter(Boolean); // Remove null values
  };

  const likers = getLikers();

  return (
    <div className="post-modal-overlay">
      <div className="post-modal" ref={modalRef}>
        {/* Header */}
        <div className="post-modal-header">
          <div className="post-modal-title">
            <h3>Post interactions</h3>
            <div className="post-modal-tabs">
              <button 
                className={`post-modal-tab ${activeTab === 'likes' ? 'active' : ''}`}
                onClick={() => setActiveTab('likes')}
              >
                👍 Likes ({post.likes?.length || 0})
              </button>
              <button 
                className={`post-modal-tab ${activeTab === 'comments' ? 'active' : ''}`}
                onClick={() => setActiveTab('comments')}
              >
                💬 Comments ({post.comments?.length || 0})
              </button>
            </div>
          </div>
          <button className="post-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Content */}
        <div className="post-modal-content">
          {/* Post Preview */}
          <div className="modal-post-preview">
            <div className="modal-post-user">
              {getUserAvatar(post.user)}
              <div className="modal-post-user-info">
                <div className="modal-post-username">{post.user?.name || 'Unknown User'}</div>
                <div className="modal-post-time">{formatTime(post.createdAt)}</div>
              </div>
            </div>
            <div className="modal-post-text">{post.content}</div>
          </div>

          {/* Likes Tab */}
          {activeTab === 'likes' && (
            <div className="modal-likes-tab">
              <div className="likes-count-header">
                <span className="likes-count-icon">👍</span>
                <h4>{post.likes?.length || 0} likes</h4>
              </div>
              <div className="likes-list">
                {likers.length > 0 ? (
                  likers.map((user, index) => (
                    <div key={user.id || index} className="like-item">
                      <div className="like-user-avatar">
                        {getUserAvatar(user)}
                      </div>
                      <div className="like-user-info">
                        <div className="like-user-name">{user.name}</div>
                        <div className="like-user-meta">
                          {user.department && user.department.trim() && (
                            <span className="like-user-department">{user.department}</span>
                          )}
                          <span className="like-user-time">{formatTime(user.timestamp)} ago</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-likes">No likes yet</div>
                )}
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="modal-comments-tab">
              <div className="comments-list-container">
                <div className="comments-list">
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map((comment, index) => (
                      <div key={comment._id || index} className="comment-item">
                        <div className="comment-avatar">
                          {getUserAvatar({ name: comment.userName, profilePhoto: comment.userProfilePhoto })}
                        </div>
                        <div className="comment-content">
                          <div className="comment-header">
                            <div className="comment-user-info">
                              <span className="comment-username">{comment.userName}</span>
                              <span className="comment-time">{formatTime(comment.timestamp)}</span>
                            </div>
                            {comment.userId === currentUser?.id && (
                              <div className="comment-actions">
                                {editingCommentId === (comment._id || comment.timestamp) ? (
                                  <>
                                    <button className="comment-action-btn save-btn" onClick={() => handleEditSubmit(comment._id || comment.timestamp)}>Save</button>
                                    <button className="comment-action-btn cancel-btn" onClick={() => setEditingCommentId(null)}>Cancel</button>
                                  </>
                                ) : (
                                  <>
                                    <button className="comment-action-btn edit-btn" onClick={() => startEditComment(comment)}>Edit</button>
                                     <button className="comment-action-btn delete-btn" 
                                        onClick={() => {
                                            // Make sure we're passing the comment._id
                                            console.log("Deleting comment ID:", comment._id);
                                            onDeleteComment(post._id, comment._id);
                                        }}>
                                        Delete
                                        </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {editingCommentId === (comment._id || comment.timestamp) ? (
                            <textarea
                              className="comment-edit-input"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows="2"
                            />
                          ) : (
                            <div className="comment-text">{comment.content || comment.text}</div>
                          )}
                          <div className="comment-footer">
                            <button 
                              className={`comment-like-btn ${comment.likes?.includes(currentUser?.id) ? 'liked' : ''}`}
                              onClick={() => onLikeComment(post._id, comment._id || comment.timestamp)}
                            >
                              Like
                            </button>
                            <span className="comment-likes-count">{comment.likes?.length || 0} likes</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-comments">No comments yet. Be the first to comment!</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Comment (only shown in comments tab) */}
        {activeTab === 'comments' && (
          <div className="add-comment-section">
            <div className="add-comment-avatar">
              {getUserAvatar(currentUser)}
            </div>
            <form onSubmit={handleSubmitComment} className="add-comment-form">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="add-comment-input"
              />
              <button type="submit" className="add-comment-btn" disabled={!newComment.trim()}>
                Post
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostModal;