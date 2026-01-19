// src/components/NotificationBell.jsx
import { io } from "socket.io-client";

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    const token = localStorage.getItem("token");
    if (!token) return null;

    socketInstance = io("${process.env.VITE_API_URL}", {
      auth: { token }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });
  }
  return socketInstance;
}


// // src/components/NotificationBell.jsx
// import React, { useEffect, useState } from "react";
// import io from "socket.io-client";
// import "../styles/Notifications.css";

// let socketInstance = null;

// export function getSocket() {
//   return socketInstance;
// }

// export default function NotificationBell({ onOpenNotifications }) {
//   const [count, setCount] = useState(0);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) return;

//     // join socket and listen for count updates or new_notification
//     socketInstance = io("${process.env.VITE_API_URL}", {
//       auth: { token: token }
//     });

//     socketInstance.on("connect_error", (err) => {
//       console.error("Socket connect error:", err.message);
//     });

//     // When server sends new_notification, increment unread count
//     socketInstance.on("new_notification", (payload) => {
//       setCount(c => c + 1);
//     });

//     // fetch initial unread count
//     fetch("${process.env.VITE_API_URL}/api/notifications/unread/count", {
//       headers: { Authorization: `Bearer ${token}` }
//     })
//     .then(res => res.json())
//     .then(data => setCount(data.count || 0))
//     .catch(err => console.error(err));

//     return () => {
//       if (socketInstance) socketInstance.disconnect();
//       socketInstance = null;
//     };
//   }, []);

//   return (
//     <div className="notif-bell" title="Notifications" onClick={() => { setCount(0); onOpenNotifications?.(); }}>
//       <button className="nav-btn">
//         🔔
//         {count > 0 && <span className="notif-badge">{count}</span>}
//       </button>
//     </div>
//   );
// }


// src/components/NotificationBell.jsx

