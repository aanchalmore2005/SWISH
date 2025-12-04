import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Admin.css";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      navigate("/feed");
      return;
    }
    
    if (activeTab === "dashboard") {
      fetchStats();
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "posts") {
      fetchPosts();
    } else if (activeTab === "reports") {
      fetchReports();
    } else if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [activeTab, navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 403) {
        setError("Admin access required");
        navigate("/feed");
        return;
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      setError("Failed to fetch stats");
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 403) {
        setError("Admin access required");
        navigate("/feed");
        return;
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 403) {
        setError("Admin access required");
        navigate("/feed");
        return;
      }
      
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      setError("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 403) {
        setError("Admin access required");
        navigate("/feed");
        return;
      }
      
      const data = await response.json();
      setReports(data);
    } catch (error) {
      setError("Failed to fetch reports");
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 403) {
        setError("Admin access required");
        navigate("/feed");
        return;
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      setError("Failed to fetch analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setUsers(users.filter(user => user._id !== userId));
        setSuccess("User deleted successfully");
        setTimeout(() => setSuccess(""), 3000);
        fetchStats(); // Refresh stats
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete user");
      }
    } catch (error) {
      setError("Network error");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setPosts(posts.filter(post => post._id !== postId));
        setSuccess("Post deleted successfully");
        setTimeout(() => setSuccess(""), 3000);
        fetchStats(); // Refresh stats
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete post");
      }
    } catch (error) {
      setError("Network error");
    }
  };

  const handleResolveReport = async (postId, action) => {
    if (!window.confirm(`Are you sure you want to ${action === 'delete' ? 'delete' : 'keep'} this reported post?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/reports/${postId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        setReports(reports.filter(report => report._id !== postId));
        setSuccess(`Report resolved. Post ${action === 'delete' ? 'deleted' : 'kept'}.`);
        setTimeout(() => setSuccess(""), 3000);
        fetchStats(); // Refresh stats
      } else {
        const data = await response.json();
        setError(data.message || "Failed to resolve report");
      }
    } catch (error) {
      setError("Network error");
    }
  };

  const handleWarnUser = async (userId, postId) => {
    const reason = prompt("Enter warning reason for the user:");
    
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/warn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        setSuccess("Warning issued to user");
        setTimeout(() => setSuccess(""), 3000);
        // Also resolve the report after warning
        handleResolveReport(postId, 'keep');
      } else {
        const data = await response.json();
        setError(data.message || "Failed to warn user");
      }
    } catch (error) {
      setError("Network error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate("/");
  };

  return (
    <div className="admin-container">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>👑 Swish Admin Panel</h1>
          <p>SIGCE Campus Management</p>
        </div>
        <div className="admin-header-right">
          <button className="admin-logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="admin-notification error">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
      {success && (
        <div className="admin-notification success">
          {success}
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* Admin Navigation */}
      <nav className="admin-nav">
        <button 
          className={`admin-nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button 
          className={`admin-nav-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Users ({stats?.totalUsers || 0})
        </button>
        <button 
          className={`admin-nav-btn ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          📝 Posts ({stats?.totalPosts || 0})
        </button>
        <button 
          className={`admin-nav-btn ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          🚨 Reports ({reports.length})
        </button>
        <button 
          className={`admin-nav-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          📈 Analytics
        </button>
      </nav>

      {/* Admin Content */}
      <div className="admin-content">
        {activeTab === "dashboard" && (
          <div className="admin-dashboard">
            <h2>Platform Overview</h2>
            
            {stats ? (
              <div className="stats-grid">
                <div className="stat-card total-users">
                  <h3>Total Users</h3>
                  <div className="stat-number">{stats.totalUsers}</div>
                  <div className="stat-breakdown">
                    <span>🎓 {stats.usersByRole?.students || 0} Students</span>
                    <span>👨‍🏫 {stats.usersByRole?.faculty || 0} Faculty</span>
                    <span>👑 {stats.usersByRole?.admins || 0} Admins</span>
                  </div>
                </div>
                
                <div className="stat-card total-posts">
                  <h3>Total Posts</h3>
                  <div className="stat-number">{stats.totalPosts}</div>
                  <div className="stat-breakdown">
                    <span>📅 {stats.postsToday || 0} Today</span>
                  </div>
                </div>
                
                <div className="stat-card platform-health">
                  <h3>Platform Health</h3>
                  <div className="stat-status">✅ Active</div>
                  <div className="stat-breakdown">
                    <span>🔒 Secure Authentication</span>
                    <span>📱 Mobile Responsive</span>
                    <span>⚡ Fast Performance</span>
                  </div>
                </div>
                
                <div className="stat-card quick-actions">
                  <h3>Quick Actions</h3>
                  <div className="action-buttons">
                    <button onClick={() => setActiveTab("users")}>
                      👤 Manage Users
                    </button>
                    <button onClick={() => setActiveTab("posts")}>
                      📝 Moderate Posts
                    </button>
                    <button onClick={() => setActiveTab("reports")}>
                      🚨 Handle Reports
                    </button>
                    <button onClick={fetchStats}>
                      🔄 Refresh Stats
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading">Loading stats...</div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="admin-users">
            <h2>User Management</h2>
            <p className="admin-subtitle">Manage campus users: Students, Faculty, and Admins</p>
            
            {loading ? (
              <div className="loading">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="empty-state">No users found</div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-cell">
                            {user.profilePhoto ? (
                              <img src={user.profilePhoto} alt={user.name} className="user-avatar-small" />
                            ) : (
                              <div className="user-avatar-placeholder">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge role-${user.role}`}>
                            {user.role === 'student' && '🎓 Student'}
                            {user.role === 'faculty' && '👨‍🏫 Faculty'}
                            {user.role === 'admin' && '👑 Admin'}
                          </span>
                        </td>
                        <td>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={user.role === 'admin'}
                            title={user.role === 'admin' ? 'Cannot delete admin users' : 'Delete user'}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="admin-posts">
            <h2>Post Moderation</h2>
            <p className="admin-subtitle">Monitor and manage campus posts</p>
            
            {loading ? (
              <div className="loading">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="empty-state">No posts found</div>
            ) : (
              <div className="posts-list">
                {posts.map(post => (
                  <div key={post._id} className="post-card-admin">
                    <div className="post-header-admin">
                      <div className="post-user-admin">
                        {post.user?.profilePhoto ? (
                          <img src={post.user.profilePhoto} alt={post.user.name} className="user-avatar-small" />
                        ) : (
                          <div className="user-avatar-placeholder">
                            {post.user?.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="user-info-admin">
                          <div className="user-name-admin">{post.user?.name || "Unknown User"}</div>
                          <div className="user-email-admin">{post.user?.email}</div>
                          <div className="user-role-admin">
                            {post.user?.role === 'student' && '🎓 Student'}
                            {post.user?.role === 'faculty' && '👨‍🏫 Faculty'}
                            {post.user?.role === 'admin' && '👑 Admin'}
                          </div>
                        </div>
                      </div>
                      <div className="post-meta-admin">
                        <span className="post-time">
                          {new Date(post.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="post-stats-admin">
                          <span>👍 {post.likesCount || 0}</span>
                          <span>💬 {post.commentsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="post-content-admin">
                      <p>{post.content}</p>
                    </div>
                    
                    <div className="post-actions-admin">
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeletePost(post._id)}
                      >
                        🗑️ Delete Post
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "reports" && (
          <div className="admin-reports">
            <h2>🚨 Reported Content</h2>
            <p className="admin-subtitle">Review and take action on reported posts</p>
            
            {reportsLoading ? (
              <div className="loading">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="empty-state">🎉 No pending reports! All clear.</div>
            ) : (
              <div className="reports-list">
                {reports.map(post => (
                  <div key={post._id} className="report-card">
                    <div className="report-header">
                      <div className="reported-post-info">
                        <h4>Post by: {post.user?.name}</h4>
                        <p className="post-content-preview">{post.content?.substring(0, 150)}...</p>
                        <div className="post-meta">
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span className="report-count">🚨 {post.totalReports} reports</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Reports List */}
                    <div className="reports-details">
                      <h5>Reports ({post.reports?.length || 0}):</h5>
                      {post.reports?.map((report, index) => (
                        <div key={index} className="report-item">
                          <div className="reporter-info">
                            <strong>{report.reporterName}</strong> ({report.reporterRole})
                            <span className="report-time">
                              {new Date(report.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="report-reason"><strong>Reason:</strong> {report.reason}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="report-resolve-actions">
                      <button 
                        className="action-btn keep-btn"
                        onClick={() => handleResolveReport(post._id, 'keep')}
                      >
                        ✅ Keep Post (No issue)
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleResolveReport(post._id, 'delete')}
                      >
                        🗑️ Delete Post (Inappropriate)
                      </button>
                      {post.user?.id && (
                        <button 
                          className="action-btn warn-btn"
                          onClick={() => handleWarnUser(post.user.id, post._id)}
                        >
                          ⚠️ Warn User & Keep Post
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="admin-analytics">
            <h2>📈 Platform Analytics</h2>
            <p className="admin-subtitle">Detailed insights about platform usage</p>
            
            {analyticsLoading ? (
              <div className="loading">Loading analytics...</div>
            ) : analytics ? (
              <div className="analytics-content">
                <div className="analytics-grid">
                  <div className="analytics-card">
                    <h3>📊 Daily Posts (Last 7 Days)</h3>
                    {analytics.dailyPosts?.length > 0 ? (
                      <div className="daily-posts-chart">
                        {analytics.dailyPosts.map((day, index) => (
                          <div key={index} className="chart-bar">
                            <div className="bar-label">{day._id}</div>
                            <div className="bar-container">
                              <div 
                                className="bar-fill" 
                                style={{ width: `${Math.min(day.count * 20, 100)}%` }}
                              >
                                <span className="bar-value">{day.count}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data">No data available</p>
                    )}
                  </div>
                  
                  <div className="analytics-card">
                    <h3>🏆 Top Active Users</h3>
                    {analytics.topUsers?.length > 0 ? (
                      <div className="top-users-list">
                        {analytics.topUsers.slice(0, 5).map((user, index) => (
                          <div key={user._id} className="top-user-item">
                            <div className="user-rank">#{index + 1}</div>
                            <div className="user-details">
                              <div className="user-name">{user.name}</div>
                              <div className="user-stats">
                                <span className="user-role">{user.role}</span>
                                <span className="user-posts">{user.postCount} posts</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data">No data available</p>
                    )}
                  </div>
                </div>
                
                <div className="analytics-card full-width">
                  <h3>🎓 Posts by Department</h3>
                  {analytics.postsByDept?.length > 0 ? (
                    <div className="dept-stats">
                      {analytics.postsByDept.map((dept, index) => (
                        <div key={dept._id || index} className="dept-item">
                          <div className="dept-name">{dept._id || 'Unknown'}</div>
                          <div className="dept-bar">
                            <div 
                              className="dept-fill" 
                              style={{ width: `${(dept.count / Math.max(...analytics.postsByDept.map(d => d.count))) * 80}%` }}
                            >
                              <span className="dept-count">{dept.count} posts</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No data available</p>
                  )}
                </div>
                
                <div className="analytics-meta">
                  <p>📅 Analytics generated: {new Date(analytics.generatedAt).toLocaleString()}</p>
                  <button className="refresh-btn" onClick={fetchAnalytics}>
                    🔄 Refresh Analytics
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">No analytics data available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;