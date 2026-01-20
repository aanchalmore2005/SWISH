# Swish 🌐

**Swish – Private Social Sharing Platform for Campus Communities**

Swish is a **full-stack MERN web application** built to bring the experience of modern social media into a **secure, campus-exclusive environment**. It allows students and faculty to share photos, updates, and achievements within their academic network while maintaining privacy, moderation, and institutional safety.

The platform mirrors the fast, visual, and engaging nature of popular social apps—designed specifically for campus communities.

**Project Code:** SOC-WEB-2025-094

---

## 🚀 Core Features

* 🔐 **JWT-Based Authentication** – Secure login with role-based access (Student, Faculty, Admin)
* 🧑‍🎓 **Campus-Exclusive Access** – Only verified campus users can join
* 👤 **User Profiles** – Profile photo, bio, and personal details
* 📝 **Post Creation** – Share image & video posts with captions
* ❤️ **Likes & 💬 Comments** – Real-time engagement on posts
* 🤝 **Follow System** – Follow other users within the campus
* 🔔 **Real-Time Notifications** – Instant alerts using Socket.io
* 🔍 **Explore Section** – Discover trending posts and profiles
* 🛡️ **Admin Dashboard** – Content moderation, reports, and user management

---

## 🛠️ Tech Stack

### Frontend

* React.js
* CSS (Custom styling)
* React Router

### Backend

* Node.js
* Express.js
* JWT Authentication

### Database

* MongoDB

### Media Handling

* Multer and Cloudinary (for image & video uploads)

### Deployment

* Vercel (Frontend)
* Render (Backend)

---

## 📂 Project Structure

```
SWISH_campus_connect/
│
├── frontend/
│   └── my-app/
│       ├── src/
│       │   ├── components/
│       │   ├── styles/
│       │   ├── pages/
│       │   └── App.jsx
│       └── package.json
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── server.js
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Sayali2611/SWISH.git
cd SWISH_campus_connect
```

### 2️⃣ Frontend Setup

```bash
cd frontend/my-app
npm install
npm start
```

### 3️⃣ Backend Setup (Render Deployment)

```bash
cd backend
npm install
npm start
```

> Ensure the `start` script is properly configured in `package.json` for Render deployment.

---

## 🔑 Environment Variables

Create a `.env` file in the backend directory and add:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## 🎯 Future Enhancements

* 💬 Private messaging
* 🧠 AI-based content moderation
* 📱 Mobile application version

---

## 👩‍💻 Author

**Aanchal More (aanchalmore2005)**
**Sayali Bhanage (Sayali2611)**
**Anjali Bhalkhede (Anjali200306)**
**Bhupati Sharma (bhupatisharma)**

---

## 📜 License

This project is licensed under the MIT License.

---

> Swish aims to create a **safe, private, and engaging digital space** for campus communities ✨
