import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Feed from "./components/Feed";
import Profile from "./components/Profile";
import NotificationsPage from "./components/Notifications"; // Her component
import AdminDashboard from "./components/AdminDashboard"; // Your component
import "./styles/global.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<NotificationsPage />} /> {/* Her route */}
        <Route path="/admin" element={<AdminDashboard />} /> {/* Your route */}
      </Routes>
    </Router>
  );
}

export default App;