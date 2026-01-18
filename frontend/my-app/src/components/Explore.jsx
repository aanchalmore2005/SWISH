import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/Explore.css";
import { getSocket } from "../components/NotificationBell";
import Toast from "../components/Toast";
import "../styles/Notifications.css";
import ExploreSearch from "../components/ExploreSearch";

// ==================== IMAGE CAROUSEL COMPONENT ====================
const ImageCarousel = ({ images, videos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRefs = useRef([]);
  const carouselRef = useRef(null);
  const observerRef = useRef(null);
  const videoIntervalRef = useRef(null);
  const isInViewportRef = useRef(true);
  const scrollTimeoutRef = useRef(null);

  const media = [...(images || []), ...(videos || [])];
  
  if (!media || media.length === 0) return null;

  const isVideo = (item) => item.type === 'video';
  const totalSlides = media.length;

  const handleVideoPlayPause = useCallback(() => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;
    
    if (video.paused) {
      video.play().then(() => {
        setIsVideoPlaying(true);
        startProgressInterval();
      }).catch(e => console.log("Auto-play prevented:", e));
    } else {
      video.pause();
      setIsVideoPlaying(false);
      clearProgressInterval();
    }
  }, [currentIndex]);

  const startProgressInterval = useCallback(() => {
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
    }
    videoIntervalRef.current = setInterval(() => {
      const video = videoRefs.current[currentIndex];
      if (video && !video.paused && video.duration) {
        const progress = (video.currentTime / video.duration) * 100;
        setVideoProgress(progress);
        setVideoCurrentTime(video.currentTime);
      }
    }, 100);
  }, [currentIndex]);

  const clearProgressInterval = useCallback(() => {
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
  }, []);

  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const goToSlide = useCallback((index) => {
    if (isVideo(media[currentIndex])) {
      const video = videoRefs.current[currentIndex];
      if (video) {
        video.pause();
        setIsVideoPlaying(false);
        clearProgressInterval();
      }
    }
    
    setCurrentIndex(index);
    setVideoProgress(0);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    
    if (isVideo(media[index]) && isInViewportRef.current) {
      setTimeout(() => {
        const video = videoRefs.current[index];
        if (video) {
          video.muted = false;
          setIsMuted(false);
          video.play().then(() => {
            setIsVideoPlaying(true);
            startProgressInterval();
          }).catch(e => console.log("Auto-play prevented:", e));
        }
      }, 100);
    }
  }, [currentIndex, media, clearProgressInterval, startProgressInterval]);

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex === totalSlides - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, totalSlides, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex === 0 ? totalSlides - 1 : currentIndex - 1);
  }, [currentIndex, totalSlides, goToSlide]);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleVideoPlay = useCallback(() => {
    setIsVideoPlaying(true);
    startProgressInterval();
  }, [startProgressInterval]);

  const handleVideoPause = useCallback(() => {
    setIsVideoPlaying(false);
    clearProgressInterval();
  }, [clearProgressInterval]);

  const handleVideoEnded = useCallback(() => {
    setIsVideoPlaying(false);
    setVideoProgress(0);
    setVideoCurrentTime(0);
    clearProgressInterval();
  }, [clearProgressInterval]);

  const handleVideoLoadedMetadata = useCallback((e) => {
    const video = e.target;
    if (video) {
      setVideoDuration(video.duration);
      setVideoCurrentTime(0);
      setVideoProgress(0);
    }
  }, []);

  const handleVideoTimeUpdate = useCallback((e) => {
    const video = e.target;
    if (video && video.duration) {
      const progress = (video.currentTime / video.duration) * 100;
      setVideoProgress(progress);
      setVideoCurrentTime(video.currentTime);
    }
  }, []);

  const handleProgressChange = (e) => {
    const value = parseFloat(e.target.value);
    const video = videoRefs.current[currentIndex];
    if (video && video.duration) {
      const newTime = (value / 100) * video.duration;
      video.currentTime = newTime;
      setVideoProgress(value);
      setVideoCurrentTime(newTime);
    }
  };

  const handleToggleMute = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  useEffect(() => {
    if (!carouselRef.current) return;

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        isInViewportRef.current = entry.isIntersecting;
        
        if (!entry.isIntersecting && isVideo(media[currentIndex])) {
          const video = videoRefs.current[currentIndex];
          if (video && !video.paused) {
            video.pause();
            setIsVideoPlaying(false);
            clearProgressInterval();
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.3,
      rootMargin: '50px'
    });

    observerRef.current.observe(carouselRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentIndex, media, clearProgressInterval]);

  useEffect(() => {
    return () => {
      videoRefs.current.forEach(video => {
        if (video) {
          video.pause();
          video.src = '';
          video.load();
        }
      });
      clearProgressInterval();
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [clearProgressInterval]);

  return (
    <div className="linkedin-carousel" ref={carouselRef}>
      <div 
        className="carousel-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {totalSlides > 1 && (
          <button 
            className="carousel-arrow left-arrow"
            onClick={prevSlide}
            aria-label="Previous"
          >
            ‹
          </button>
        )}

        <div className="carousel-slide">
          {isVideo(media[currentIndex]) ? (
            <div className="video-slide">
              <video
                ref={el => {
                  videoRefs.current[currentIndex] = el;
                  if (el) {
                    el.onplay = handleVideoPlay;
                    el.onpause = handleVideoPause;
                    el.onended = handleVideoEnded;
                    el.ontimeupdate = handleVideoTimeUpdate;
                    el.onloadedmetadata = handleVideoLoadedMetadata;
                    el.muted = false;
                    el.playsInline = true;
                    el.preload = "metadata";
                    el.controls = false;
                  }
                }}
                src={media[currentIndex].url}
                className="carousel-video"
                playsInline
                preload="metadata"
              />
              
              <div className="carousel-video-controls">
                <button 
                  className="video-control-btn play-pause-btn"
                  onClick={handleVideoPlayPause}
                  aria-label={isVideoPlaying ? "Pause" : "Play"}
                >
                  {isVideoPlaying ? '⏸' : '▶'}
                </button>
                
                <div className="video-time-display">
                  {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
                </div>
                
                <div className="video-progress-container">
                  <input
                    type="range"
                    className="video-progress-slider"
                    min="0"
                    max="100"
                    step="0.1"
                    value={videoProgress}
                    onChange={handleProgressChange}
                    aria-label="Video progress"
                  />
                </div>
                
                <button 
                  className="video-control-btn mute-btn"
                  onClick={handleToggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>
              </div>
              
              {!isVideoPlaying && (
                <div className="video-play-overlay">
                  <button 
                    className="video-play-button"
                    onClick={handleVideoPlayPause}
                    aria-label="Play video"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
          ) : (
            <img
              src={media[currentIndex].url}
              alt={`Slide ${currentIndex + 1}`}
              className="carousel-image"
              loading="lazy"
            />
          )}
        </div>

        {totalSlides > 1 && (
          <button 
            className="carousel-arrow right-arrow"
            onClick={nextSlide}
            aria-label="Next"
          >
            ›
          </button>
        )}

        {totalSlides > 1 && (
          <div className="image-counter">
            {currentIndex + 1} / {totalSlides}
          </div>
        )}
      </div>

      {totalSlides > 1 && (
        <div className="carousel-dots">
          {media.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Post Card Component
const PostCard = forwardRef(({ post, currentUser, onLike, onComment, onSave, onFollow, isFollowing }, ref) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [localLikes, setLocalLikes] = useState(post.likes || []);
  const [localComments, setLocalComments] = useState(post.comments || []);
  const [localSaves, setLocalSaves] = useState(post.saves || []);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);
  const [savesCount, setSavesCount] = useState(post.saves?.length || 0);
  
  const navigate = useNavigate();
  
  // Check if current user has liked/saved the post
  useEffect(() => {
    if (!currentUser || !post) return;
    
    const userLiked = localLikes.some(like => {
      if (typeof like === 'string') {
        return like === currentUser.id || like === currentUser._id;
      } else if (like && typeof like === 'object') {
        return like._id === currentUser.id || 
               like.userId === currentUser.id ||
               like.userId === currentUser._id ||
               like._id === currentUser._id;
      }
      return false;
    });
    
    const userSaved = localSaves.some(save => {
      if (typeof save === 'string') {
        return save === currentUser.id || save === currentUser._id;
      } else if (save && typeof save === 'object') {
        return save._id === currentUser.id || 
               save.userId === currentUser.id ||
               save.userId === currentUser._id ||
               save._id === currentUser._id;
      }
      return false;
    });
    
    setIsLiked(userLiked);
    setIsSaved(userSaved);
    setLikesCount(localLikes.length);
    setCommentsCount(localComments.length);
    setSavesCount(localSaves.length);
  }, [currentUser, post, localLikes, localComments, localSaves]);
  
  const handleLike = async () => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    const updatedPost = await onLike(localPost._id);
    if (updatedPost) {
      setLocalPost(updatedPost);
      setLocalLikes(updatedPost.likes || []);
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    }
  };
  
  const handleSave = async () => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    const updatedPost = await onSave(localPost._id);
    if (updatedPost) {
      setLocalPost(updatedPost);
      setLocalSaves(updatedPost.saves || []);
      setIsSaved(!isSaved);
      setSavesCount(prev => isSaved ? prev - 1 : prev + 1);
    }
  };
  
  const handleFollow = async () => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    await onFollow(localPost.user?._id || localPost.userId);
  };
  
  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser) {
      navigate("/");
      return;
    }
    setIsCommenting(true);
    try {
      const updatedPost = await onComment(localPost._id, commentText);
      if (updatedPost) {
        setLocalPost(updatedPost);
        setLocalComments(updatedPost.comments || []);
        setCommentsCount(prev => prev + 1);
        setCommentText("");
        setShowComments(true);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsCommenting(false);
    }
  };
  
  const getUserAvatar = (userData) => {
    if (userData?.profilePhoto) {
      return (
        <img 
          src={userData.profilePhoto} 
          alt={userData.name} 
          className="user-avatar-img"
        />
      );
    }
    return userData?.name?.charAt(0).toUpperCase() || "U";
  };
  
  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  return (
    <div className="post-card" ref={ref}>
      {/* Post Header */}
      <div className="post-header">
        <div className="post-user">
          <div 
            className="user-avatar"
            onClick={() => navigate(`/profile/${localPost.user?._id || localPost.userId}`)}
            style={{ cursor: 'pointer' }}
          >
            {getUserAvatar(localPost.user)}
          </div>
          <div className="user-info">
            <div className="user-name">
              {localPost.user?.name || "Unknown User"}
              {localPost.user?.isPrivate && (
                <span className="private-badge" title="Private Account"> 🔒</span>
              )}
              {localPost.user?.role === 'faculty' && (
                <span className="verified-badge" title="Faculty Member"> 👨‍🏫</span>
              )}
              {localPost.user?.role === 'admin' && (
                <span className="admin-badge" title="Administrator"> 👑</span>
              )}
            </div>
            <div className="post-meta">
              <span className="post-time">
                {new Date(localPost.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {localPost.user?.department && (
                <span className="user-department">• {localPost.user.department}</span>
              )}
            </div>
          </div>
        </div>
        
        {localPost.user?._id !== currentUser?.id && (
          <button 
            className={`follow-btn ${isFollowing ? 'following' : ''}`}
            onClick={handleFollow}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
      
      {/* Post Content */}
      <div className="post-content">
        <p>{localPost.content}</p>
        
        {/* Hashtags */}
        {localPost.content && localPost.content.includes('#') && (
          <div className="hashtags">
            {localPost.content.match(/#\w+/g)?.map((tag, index) => (
              <span key={index} className="hashtag" onClick={() => navigate(`/explore/hashtag/${tag.replace('#', '')}`)}>
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Media with Carousel */}
        {localPost.media && localPost.media.length > 0 && (
          <ImageCarousel 
            images={localPost.media.filter(m => m.type === 'image')} 
            videos={localPost.media.filter(m => m.type === 'video')} 
          />
        )}
        
        {/* Category */}
        {localPost.category && (
          <div className="post-category">
            <span className="category-badge">{localPost.category}</span>
          </div>
        )}
      </div>
      
      {/* Post Stats */}
      <div className="post-stats">
        <span className="stat-item">👍 {formatNumber(likesCount)}</span>
        <span className="stat-item">💬 {formatNumber(commentsCount)}</span>
        <span className="stat-item">💾 {formatNumber(savesCount)}</span>
        {localPost.tags && localPost.tags.length > 0 && (
          <span className="stat-item"># {localPost.tags.length}</span>
        )}
      </div>
      
      {/* Post Actions */}
      <div className="post-actions-buttons">
        <button 
          className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          {isLiked ? '❤️ Liked' : '🤍 Like'}
        </button>
        <button 
          className={`action-btn comment-btn ${showComments ? 'active' : ''}`}
          onClick={() => setShowComments(!showComments)}
        >
          💬 Comment
        </button>
        <button 
          className={`action-btn save-btn ${isSaved ? 'saved' : ''}`}
          onClick={handleSave}
        >
          {isSaved ? '💾 Saved' : '💾 Save'}
        </button>
        <button className="action-btn share-btn" onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: 'Check out this post on Swish',
              text: localPost.content.substring(0, 100),
              url: window.location.origin + `/post/${localPost._id}`
            });
          } else {
            navigator.clipboard.writeText(window.location.origin + `/post/${localPost._id}`);
            alert('Link copied to clipboard!');
          }
        }}>
          🔄 Share
        </button>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          {localComments.length > 0 ? (
            <div className="comments-list">
              <h4>Comments ({commentsCount})</h4>
              {localComments.slice(0, 3).map((comment, index) => (
                <div key={index} className="comment-item">
                  <div className="comment-avatar">
                    {comment.user?.name?.charAt(0).toUpperCase() || 
                     comment.userName?.charAt(0).toUpperCase() || 
                     "U"}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">
                        {comment.user?.name || comment.userName || "Anonymous"}
                      </span>
                      <span className="comment-time">
                        {new Date(comment.createdAt || comment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                  </div>
                </div>
              ))}
              {localComments.length > 3 && (
                <button 
                  className="view-more-comments"
                  onClick={() => navigate(`/post/${localPost._id}`)}
                >
                  View all {localComments.length} comments
                </button>
              )}
            </div>
          ) : (
            <div className="no-comments">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
          
          {/* Add Comment */}
          <div className="add-comment">
            <div className="comment-avatar-small">
              {getUserAvatar(currentUser)}
            </div>
            <input 
              type="text" 
              placeholder="Write a comment..." 
              className="comment-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              disabled={isCommenting}
            />
            <button 
              className="comment-submit-btn"
              onClick={handleAddComment}
              disabled={isCommenting || !commentText.trim()}
            >
              {isCommenting ? '...' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

PostCard.displayName = 'PostCard';

// User Card Component
const UserCard = ({ userData, currentUser, onFollow, isFollowing }) => {
  const navigate = useNavigate();
  
  const getUserAvatar = (user) => {
    if (user?.profilePhoto) {
      return (
        <img 
          src={user.profilePhoto} 
          alt={user.name} 
          className="user-avatar-img"
        />
      );
    }
    return user?.name?.charAt(0).toUpperCase() || "U";
  };
  
  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  const followersCount = Array.isArray(userData.followers) ? userData.followers.length : 0;
  const connectionsCount = Array.isArray(userData.connections) ? userData.connections.length : 0;
  
  return (
    <div className="user-card">
      <div 
        className="user-avatar-large"
        onClick={() => navigate(`/profile/${userData._id || userData.id}`)}
        style={{ cursor: 'pointer' }}
      >
        {getUserAvatar(userData)}
      </div>
      <div className="user-info">
        <h4 
          className="user-name"
          onClick={() => navigate(`/profile/${userData._id || userData.id}`)}
          style={{ cursor: 'pointer' }}
        >
          {userData.name}
          {userData.isPrivate && (
            <span className="private-badge" title="Private Account"> 🔒</span>
          )}
          {userData.role === 'faculty' && (
            <span className="verified-badge" title="Faculty Member"> 👨‍🏫</span>
          )}
        </h4>
        <p className="user-department">{userData.department || userData.facultyDepartment || 'No department'}</p>
        <div className="user-stats">
          <span>{formatNumber(followersCount)} followers</span>
          <span>•</span>
          <span>{formatNumber(connectionsCount)} connections</span>
        </div>
      </div>
      {currentUser?.id !== (userData._id || userData.id) && (
        <button 
          className={`follow-btn ${isFollowing ? 'following' : ''}`}
          onClick={() => onFollow(userData._id || userData.id)}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
};

// Hashtag Card Component
const HashtagCard = ({ tag, count, onClick }) => {
  return (
    <div className="hashtag-card" onClick={() => onClick(tag)}>
      <div className="hashtag-icon">#</div>
      <div className="hashtag-content">
        <h4>#{tag}</h4>
        <p>{count.toLocaleString()} posts</p>
      </div>
    </div>
  );
};

function Explore() {
  const [activeTab, setActiveTab] = useState('trending');
  const [timeFilter, setTimeFilter] = useState('week');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [categoryPosts, setCategoryPosts] = useState([]);
  const [hashtagPosts, setHashtagPosts] = useState([]);
  const [mediaPosts, setMediaPosts] = useState([]);
  const [searchResults, setSearchResults] = useState({ posts: [], users: [], hashtags: [] });
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState({});
  const [userStats, setUserStats] = useState({
    posts: 0,
    connections: 0,
    followers: 0,
    following: 0
  });
  
  const navigate = useNavigate();
  const observerRef = useRef();
  const lastPostRef = useRef();
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  
  // Consolidated avatar function
  const getUserAvatar = (userObj) => {
    if (!userObj) return "U";
    
    if (userObj.profilePhoto && userObj.profilePhoto !== "null" && userObj.profilePhoto !== "undefined") {
      return (
        <img 
          src={userObj.profilePhoto} 
          alt={userObj.name || "User"} 
          className="user-avatar-img"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.textContent = userObj?.name?.charAt(0).toUpperCase() || "U";
          }}
        />
      );
    }
    return userObj?.name?.charAt(0).toUpperCase() || "U";
  };
  
  // Fetch user data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate("/");
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      fetchUserProfile(parsedUser.id, token);
      fetchUserStats(parsedUser.id, token);
      
      // Initialize Socket for notifications
      const socket = getSocket();
      if (socket) {
        socket.on("new_notification", (payload) => {
          console.log("New notification:", payload);
        });
      }
      
      return () => {
        if (socket) {
          socket.off("new_notification");
        }
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/");
    }
  }, [navigate]);
  
  // Fetch detailed user profile
  const fetchUserProfile = async (userId, token) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  // Fetch user stats
  const fetchUserStats = async (userId, token) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/profile/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserStats({
          posts: data.posts || 0,
          connections: data.connections || 0,
          followers: data.followers || 0,
          following: data.following || 0
        });
      } else {
        setUserStats({
          posts: 0,
          connections: 0,
          followers: 0,
          following: 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setUserStats({
        posts: 0,
        connections: 0,
        followers: 0,
        following: 0
      });
    }
  };
  
  // Fetch trending posts
  const fetchTrendingPosts = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/explore/trending?timeframe=${timeFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return;
      }
      
      const data = await response.json();
      if (response.ok) {
        setTrendingPosts(data);
      } else {
        setError(data.message || 'Failed to fetch trending posts');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user, timeFilter, navigate]);
  
  // Fetch latest posts
  const fetchLatestPosts = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/explore/latest?page=${pageRef.current}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return;
      }
      
      const data = await response.json();
      if (response.ok) {
        if (pageRef.current === 1) {
          setLatestPosts(data.posts || []);
        } else {
          setLatestPosts(prev => [...prev, ...(data.posts || [])]);
        }
        hasMoreRef.current = data.currentPage < data.totalPages;
      } else {
        setError(data.message || 'Failed to fetch latest posts');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);
  
  // Fetch posts by category
  const fetchCategoryPosts = useCallback(async () => {
    if (!user || categoryFilter === 'all') return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/explore/category/${categoryFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return;
      }
      
      const data = await response.json();
      if (response.ok) {
        setCategoryPosts(data);
      } else {
        setError(data.message || 'Failed to fetch category posts');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user, categoryFilter, navigate]);
  
  // Fetch posts by media type
  const fetchMediaPosts = useCallback(async () => {
    if (!user || mediaFilter === 'all') return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/explore/media/${mediaFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return;
      }
      
      const data = await response.json();
      if (response.ok) {
        setMediaPosts(data);
      } else {
        setError(data.message || 'Failed to fetch media posts');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user, mediaFilter, navigate]);
  
  // Fetch discover users
  const fetchDiscoverUsers = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        'http://localhost:5000/api/explore/people',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return;
      }
      
      const data = await response.json();
      if (response.ok) {
        setDiscoverUsers(data);
        
        // Initialize following state
        const followingState = {};
        data.forEach(userData => {
          if (userData.followers && Array.isArray(userData.followers)) {
            followingState[userData._id] = userData.followers.some(
              follower => follower === user.id || 
                         (typeof follower === 'object' && follower._id === user.id)
            );
          } else {
            followingState[userData._id] = false;
          }
        });
        setFollowing(followingState);
      }
    } catch (error) {
      console.error('Error fetching discover users:', error);
    }
  }, [user, navigate]);
  
  // Fetch trending hashtags
  const fetchTrendingHashtags = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        'http://localhost:5000/api/explore/hashtags/trending',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return;
      }
      
      const data = await response.json();
      if (response.ok) {
        setTrendingHashtags(data);
      }
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
    }
  }, [user, navigate]);
  
  // Search posts and users
  const handleSearchFromNavbar = useCallback(async (query) => {
    if (!user || !query.trim()) return;
    
    setActiveTab('search');
    setSearchQuery(query);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/explore/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return;
      }
      
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.results || { posts: [], users: [], hashtags: [] });
      } else {
        setError(data.message || 'Search failed');
      }
    } catch (error) {
      setError('Network error during search');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);
  
  // Listen for search events from navbar
  useEffect(() => {
    const handleNavbarSearch = (event) => {
      if (event.detail && event.detail.query) {
        handleSearchFromNavbar(event.detail.query);
      }
    };
    
    window.addEventListener('navbarSearch', handleNavbarSearch);
    
    return () => {
      window.removeEventListener('navbarSearch', handleNavbarSearch);
    };
  }, [handleSearchFromNavbar]);
  
  // Handle like
  const handleLike = async (postId) => {
    if (!user) {
      navigate("/");
      return null;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return null;
      }
      
      if (response.ok) {
        const updatedPost = await response.json();
        setSuccess('Post liked!');
        setTimeout(() => setSuccess(""), 2000);
        return updatedPost;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to like post');
        return null;
      }
    } catch (error) {
      setError('Failed to like post');
      return null;
    }
  };
  
  // Handle save
  const handleSave = async (postId) => {
    if (!user) {
      navigate("/");
      return null;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return null;
      }
      
      if (response.ok) {
        const updatedPost = await response.json();
        setSuccess('Post saved!');
        setTimeout(() => setSuccess(""), 2000);
        return updatedPost;
      } else {
        const errorData = await response.json();
        setSuccess('Save feature will be available soon!');
        setTimeout(() => setSuccess(""), 2000);
        return null;
      }
    } catch (error) {
      console.log('Save feature not implemented yet');
      return null;
    }
  };
  
  // Handle follow
  const handleFollow = async (userId) => {
    if (!user) {
      navigate("/");
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/network/request/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return;
      }
      
      const data = await response.json();
      if (response.ok) {
        setFollowing(prev => ({ ...prev, [userId]: true }));
        setSuccess(data.message || 'Connection request sent!');
        setTimeout(() => setSuccess(""), 2000);
        
        // Update discover users list
        setDiscoverUsers(prev => prev.map(u => 
          u._id === userId ? { ...u, followers: [...(u.followers || []), user.id] } : u
        ));
      } else {
        setError(data.message || 'Failed to send connection request');
      }
    } catch (error) {
      setError('Failed to send connection request');
    }
  };
  
  // Handle comment
  const handleComment = async (postId, content) => {
    if (!user) {
      navigate("/");
      return null;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return null;
      }
      
      if (response.ok) {
        const data = await response.json();
        const updatedPost = data.post;
        setSuccess('Comment added!');
        setTimeout(() => setSuccess(""), 2000);
        return updatedPost;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add comment');
        throw new Error(errorData.message);
      }
    } catch (error) {
      setError('Failed to add comment');
      throw error;
    }
  };
  
  // Handle hashtag click
  const handleHashtagClick = async (tag) => {
    if (!user) {
      navigate("/");
      return;
    }
    
    setActiveTab('hashtag');
    const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
    setSearchQuery(`#${cleanTag}`);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/explore/hashtag/${encodeURIComponent(cleanTag)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
        return;
      }
      
      const data = await response.json();
      if (response.ok) {
        setHashtagPosts(data);
      } else {
        setError(data.message || 'Failed to fetch hashtag posts');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };
  
  // Infinite scroll observer
  useEffect(() => {
    if (!lastPostRef.current || !hasMoreRef.current || loading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current) {
          pageRef.current += 1;
          
          switch (activeTab) {
            case 'latest':
              fetchLatestPosts();
              break;
            default:
              break;
          }
        }
      },
      { threshold: 0.5 }
    );
    
    if (lastPostRef.current) {
      observer.observe(lastPostRef.current);
    }
    
    return () => {
      if (observer) observer.disconnect();
    };
  }, [activeTab, loading, fetchLatestPosts]);
  
  // Initial data fetch
  useEffect(() => {
    if (!user) return;
    
    pageRef.current = 1;
    hasMoreRef.current = true;
    
    switch (activeTab) {
      case 'trending':
        fetchTrendingPosts();
        break;
      case 'latest':
        fetchLatestPosts();
        break;
      case 'category':
        fetchCategoryPosts();
        break;
      case 'media':
        fetchMediaPosts();
        break;
      case 'hashtag':
        break;
      case 'search':
        break;
    }
    
    fetchDiscoverUsers();
    fetchTrendingHashtags();
  }, [
    user, 
    activeTab, 
    timeFilter, 
    categoryFilter, 
    mediaFilter, 
    fetchTrendingPosts, 
    fetchLatestPosts, 
    fetchCategoryPosts, 
    fetchMediaPosts, 
    fetchDiscoverUsers, 
    fetchTrendingHashtags
  ]);
  
  // Get current posts based on active tab
  const getCurrentPosts = () => {
    switch (activeTab) {
      case 'trending':
        return trendingPosts;
      case 'latest':
        return latestPosts;
      case 'category':
        return categoryPosts;
      case 'media':
        return mediaPosts;
      case 'hashtag':
        return hashtagPosts;
      case 'search':
        return searchResults.posts || [];
      default:
        return trendingPosts;
    }
  };
  
  // Get current users for search
  const getCurrentUsers = () => {
    if (activeTab !== 'search') return [];
    return searchResults.users || [];
  };
  
  if (!user) {
    return (
      <div className="explore-page-root">
        <Navbar />
        <div className="network-loading-container">
          <div className="network-loading-spinner"></div>
          <p>Loading Explore...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="explore-page-root">
      <Navbar />

      {error && (
        <Toast message={error} type="error" onClose={() => setError("")} />
      )}
      {success && (
        <Toast message={success} type="success" onClose={() => setSuccess("")} />
      )}

      <div className="explore-layout-container">
        {/* ========== LEFT SIDEBAR ========== */}
        <div className="explore-sidebar explore-left-sidebar">
          {/* User Profile Card - DYNAMIC */}
          <div className="explore-profile-mini-card" onClick={() => navigate("/profile")}>
            <div className="explore-mini-avatar">
              {getUserAvatar(user)}
            </div>
            <div className="explore-mini-info">
              <h4>{user?.name || "User"}</h4>
              <p className="explore-mini-title">
                {user?.role === 'student' ? `🎓 ${user?.department || 'Student'}` : 
                 user?.role === 'faculty' ? `👨‍🏫 ${user?.department || 'Faculty'}` : 
                 user?.role === 'admin' ? '👑 Administrator' : '👤 Member'}
              </p>
              <p className="explore-mini-bio">
                {user?.bio?.slice(0, 80) || "Welcome to Swish! Explore trending content and connect with your community."}
              </p>
            </div>
            <div className="explore-mini-stats">
              <div className="explore-stats-grid">
                <div className="explore-stat-item">
                  <span className="explore-stat-number">{userStats.posts}</span>
                  <span className="explore-stat-label">Posts</span>
                </div>
                <div className="explore-stat-item">
                  <span className="explore-stat-number">{userStats.followers}</span>
                  <span className="explore-stat-label">Followers</span>
                </div>
                <div className="explore-stat-item">
                  <span className="explore-stat-number">{userStats.following}</span>
                  <span className="explore-stat-label">Following</span>
                </div>
                <div className="explore-stat-item">
                  <span className="explore-stat-number">{userStats.connections}</span>
                  <span className="explore-stat-label">Connections</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="explore-quick-actions-card">
            <h3 className="explore-sidebar-title">
              <span>⚡ Quick Filters</span>
            </h3>
            <div className="explore-quick-actions-grid">
              <button className="explore-quick-action-btn" onClick={() => {
                setActiveTab('trending');
                setTimeFilter('day');
                setSearchQuery('Today\'s trending');
              }}>
                <span className="explore-action-icon">🔥</span>
                <span>Trending Today</span>
              </button>
              <button className="explore-quick-action-btn" onClick={() => {
                setActiveTab('media');
                setMediaFilter('video');
                setSearchQuery('Videos');
              }}>
                <span className="explore-action-icon">🎥</span>
                <span>Videos Only</span>
              </button>
              <button className="explore-quick-action-btn" onClick={() => {
                setActiveTab('category');
                setCategoryFilter('events');
                setSearchQuery('Events');
              }}>
                <span className="explore-action-icon">📅</span>
                <span>Events</span>
              </button>
              <button className="explore-quick-action-btn" onClick={() => {
                if (trendingHashtags.length > 0) {
                  handleHashtagClick(trendingHashtags[0].tag);
                }
              }}>
                <span className="explore-action-icon">#</span>
                <span>Top Hashtag</span>
              </button>
            </div>
          </div>

          {/* Trending Hashtags in Sidebar */}
          {trendingHashtags.length > 0 && (
            <div className="explore-analytics-card">
              <h3 className="explore-sidebar-title">
                <span>🔥 Trending Hashtags</span>
              </h3>
              <div className="explore-suggestions-list">
                {trendingHashtags.slice(0, 5).map((tag, index) => (
                  <div 
                    key={index} 
                    className="explore-suggestion-item" 
                    onClick={() => handleHashtagClick(tag.tag)}
                  >
                    <div className="explore-suggestion-avatar">
                      <span>#</span>
                    </div>
                    <div className="explore-suggestion-info">
                      <h4>#{tag.tag}</h4>
                      <p className="explore-suggestion-meta">{tag.count || tag.posts || 0} posts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========== MAIN CONTENT ========== */}
        <div className="explore-main-content">
          <div className="explore-container">
            <div className="explore-content-header">
              <h2 className="explore-content-title">
                Explore Content
                {trendingPosts.length > 0 && <span className="explore-title-badge">{trendingPosts.length} trending</span>}
              </h2>
              <div className="explore-header-actions">
                <button className="explore-feature-btn" onClick={() => {
                  setActiveTab('trending');
                  setTimeFilter('week');
                }}>
                  🔥 Trending
                </button>
                <button className="explore-feature-btn" onClick={() => navigate("/feed")}>
                  ✨ Create Post
                </button>
              </div>
            </div>

            {/* Search/Filter Bar */}
            {searchQuery && (
              <div className="explore-filter-bar">
                <div className="explore-filter-info">
                  <span className="explore-filter-icon">🔍</span>
                  <span className="explore-filter-text">Showing: {searchQuery}</span>
                  <span className="explore-filter-count">({getCurrentPosts().length} results)</span>
                </div>
                <button className="explore-clear-filter-btn" onClick={() => {
                  setSearchQuery('');
                  setActiveTab('trending');
                  setTimeFilter('week');
                  setMediaFilter('all');
                  setCategoryFilter('all');
                }}>
                  <span className="explore-clear-icon">✕</span>
                  Clear Filter
                </button>
              </div>
            )}

            {/* Explore Tabs */}
            <div className="explore-tabs-container">
              <div 
                className={`explore-tab-item ${activeTab === 'trending' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('trending'); setSearchQuery(''); }}
              >
                <span className="explore-tab-icon">🔥</span>
                <span className="explore-tab-text">Trending</span>
              </div>

              <div 
                className={`explore-tab-item ${activeTab === 'latest' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('latest'); setSearchQuery(''); }}
              >
                <span className="explore-tab-icon">🕒</span>
                <span className="explore-tab-text">Latest</span>
              </div>

              <div 
                className={`explore-tab-item ${activeTab === 'category' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('category'); setSearchQuery(''); }}
              >
                <span className="explore-tab-icon">🏷️</span>
                <span className="explore-tab-text">Categories</span>
              </div>

              <div 
                className={`explore-tab-item ${activeTab === 'media' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('media'); setSearchQuery(''); }}
              >
                <span className="explore-tab-icon">📷</span>
                <span className="explore-tab-text">Media</span>
              </div>
            </div>

            {/* Tab Content */}
            <div className="explore-tab-content active">
              {loading && pageRef.current === 1 ? (
                // Skeleton Loaders
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="post-card skeleton">
                    <div className="skeleton-header">
                      <div className="skeleton-avatar"></div>
                      <div className="skeleton-user">
                        <div className="skeleton-line short"></div>
                        <div className="skeleton-line shorter"></div>
                      </div>
                    </div>
                    <div className="skeleton-content">
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line half"></div>
                    </div>
                    <div className="skeleton-media"></div>
                    <div className="skeleton-actions">
                      <div className="skeleton-button"></div>
                      <div className="skeleton-button"></div>
                      <div className="skeleton-button"></div>
                    </div>
                  </div>
                ))
              ) : activeTab === 'search' && getCurrentUsers().length > 0 ? (
                // Search Results - Users
                <div className="search-results">
                  <h3>👥 Users ({getCurrentUsers().length})</h3>
                  <div className="users-grid">
                    {getCurrentUsers().map((userResult) => (
                      <UserCard
                        key={userResult._id || userResult.id}
                        userData={userResult}
                        currentUser={user}
                        onFollow={handleFollow}
                        isFollowing={following[userResult._id]}
                      />
                    ))}
                  </div>
                  
                  {/* Search Results - Posts */}
                  {getCurrentPosts().length > 0 && (
                    <>
                      <h3>📝 Posts ({getCurrentPosts().length})</h3>
                      {getCurrentPosts().map((post, index) => (
                        <PostCard
                          key={post._id}
                          ref={index === getCurrentPosts().length - 1 ? lastPostRef : null}
                          post={post}
                          currentUser={user}
                          onLike={handleLike}
                          onSave={handleSave}
                          onFollow={handleFollow}
                          onComment={handleComment}
                          isFollowing={following[post.user?._id || post.userId]}
                        />
                      ))}
                    </>
                  )}
                </div>
              ) : getCurrentPosts().length > 0 ? (
                // Regular Posts - ONE BELOW ANOTHER
                <>
                  {getCurrentPosts().map((post, index) => (
                    <PostCard
                      key={post._id}
                      ref={index === getCurrentPosts().length - 1 ? lastPostRef : null}
                      post={post}
                      currentUser={user}
                      onLike={handleLike}
                      onSave={handleSave}
                      onFollow={handleFollow}
                      onComment={handleComment}
                      isFollowing={following[post.user?._id || post.userId]}
                    />
                  ))}
                  
                  {loading && pageRef.current > 1 && (
                    <div className="loading-more">
                      <div className="loading-spinner"></div>
                      <p>Loading more posts...</p>
                    </div>
                  )}
                </>
              ) : (
                // Empty State
                <div className="explore-empty-state">
                  <div className="explore-empty-icon">
                    {activeTab === 'trending' && '🔥'}
                    {activeTab === 'latest' && '🕒'}
                    {activeTab === 'category' && '🏷️'}
                    {activeTab === 'media' && '📷'}
                    {activeTab === 'search' && '🔍'}
                    {activeTab === 'hashtag' && '#'}
                  </div>
                  <h3>
                    {activeTab === 'trending' && 'No trending posts found'}
                    {activeTab === 'latest' && 'No posts yet'}
                    {activeTab === 'category' && `No posts in "${categoryFilter}" category`}
                    {activeTab === 'media' && `No "${mediaFilter}" posts found`}
                    {activeTab === 'search' && 'No results found'}
                    {activeTab === 'hashtag' && `No posts with "${searchQuery}" found`}
                  </h3>
                  <p>
                    {activeTab === 'trending' && 'Be the first to create trending content!'}
                    {activeTab === 'latest' && 'Create a post to get started!'}
                    {activeTab === 'category' && 'Be the first to post in this category!'}
                    {activeTab === 'media' && 'Create a post with this media type!'}
                    {activeTab === 'search' && 'Try a different search term'}
                    {activeTab === 'hashtag' && 'Try a different hashtag or create a post with this hashtag!'}
                  </p>
                  {(activeTab !== 'search' && activeTab !== 'hashtag') && (
                    <button 
                      className="explore-connect-btn"
                      onClick={() => navigate("/feed")}
                      style={{marginTop: '20px', maxWidth: '200px'}}
                    >
                      ✨ Create a Post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== RIGHT SIDEBAR ========== */}
        <div className="explore-sidebar explore-right-sidebar">
          {/* Time Filter */}
          <div className="explore-analytics-card">
            <h3 className="explore-sidebar-title">
              <span>📅 Time Range</span>
            </h3>
            <div className="filter-options">
              {[
                { key: 'day', label: 'Today', icon: '☀️' },
                { key: 'week', label: 'This Week', icon: '📅' },
                { key: 'month', label: 'This Month', icon: '🗓️' }
              ].map((time) => (
                <button
                  key={time.key}
                  className={`filter-btn ${timeFilter === time.key ? 'active' : ''}`}
                  onClick={() => {
                    setTimeFilter(time.key);
                    if (activeTab === 'trending') {
                      fetchTrendingPosts();
                    }
                  }}
                >
                  <span className="filter-btn-icon">{time.icon}</span>
                  <span>{time.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="explore-analytics-card">
            <h3 className="explore-sidebar-title">
              <span>🏷️ Categories</span>
            </h3>
            <div className="filter-options">
              {[
                { key: 'all', label: 'All Categories', icon: '📋' },
                { key: 'events', label: 'Events', icon: '📅' },
                { key: 'polls', label: 'Polls', icon: '📊' },
                { key: 'media', label: 'Media', icon: '📷' },
                { key: 'announcements', label: 'Announcements', icon: '📢' },
                { key: 'discussions', label: 'Discussions', icon: '💬' }
              ].map((category) => (
                <button
                  key={category.key}
                  className={`filter-btn ${categoryFilter === category.key ? 'active' : ''}`}
                  onClick={() => {
                    setCategoryFilter(category.key);
                    setActiveTab('category');
                  }}
                >
                  <span className="filter-btn-icon">{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Media Filter */}
          <div className="explore-analytics-card">
            <h3 className="explore-sidebar-title">
              <span>📷 Media Type</span>
            </h3>
            <div className="filter-options">
              {[
                { key: 'all', label: 'All Media', icon: '📱' },
                { key: 'image', label: 'Images Only', icon: '🖼️' },
                { key: 'video', label: 'Videos Only', icon: '🎥' }
              ].map((media) => (
                <button
                  key={media.key}
                  className={`filter-btn ${mediaFilter === media.key ? 'active' : ''}`}
                  onClick={() => {
                    setMediaFilter(media.key);
                    setActiveTab('media');
                  }}
                >
                  <span className="filter-btn-icon">{media.icon}</span>
                  <span>{media.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="explore-analytics-card">
            <h3 className="explore-sidebar-title">
              <span>📊 Explore Stats</span>
            </h3>
            
            <div className="explore-mini-stats">
              <div className="explore-stats-grid">
                <div className="explore-stat-item">
                  <span className="explore-stat-number">{trendingPosts.length}</span>
                  <span className="explore-stat-label">Trending</span>
                </div>
                <div className="explore-stat-item">
                  <span className="explore-stat-number">{latestPosts.length}</span>
                  <span className="explore-stat-label">Latest</span>
                </div>
                <div className="explore-stat-item">
                  <span className="explore-stat-number">{discoverUsers.length}</span>
                  <span className="explore-stat-label">People</span>
                </div>
                <div className="explore-stat-item">
                  <span className="explore-stat-number">{trendingHashtags.length}</span>
                  <span className="explore-stat-label">Hashtags</span>
                </div>
              </div>
            </div>
          </div>

          {/* Discover People */}
          {discoverUsers.length > 0 && (
            <div className="explore-analytics-card">
              <h3 className="explore-sidebar-title">
                <span>👥 Discover People</span>
              </h3>
              
              <div className="explore-suggestions-list">
                {discoverUsers.slice(0, 3).map((discoverUser) => (
                  <div 
                    key={discoverUser._id} 
                    className="explore-suggestion-item"
                    onClick={() => navigate(`/profile/${discoverUser._id}`)}
                  >
                    <div className="explore-suggestion-avatar">
                      {getUserAvatar(discoverUser)}
                    </div>
                    <div className="explore-suggestion-info">
                      <h4>{discoverUser.name}</h4>
                      <p className="explore-suggestion-meta">{discoverUser.department || 'No department'}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="explore-view-all-btn"
                onClick={() => navigate("/network")}
              >
                View all people →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Explore;