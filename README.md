# SD-Adda 🌌
**SD-Adda** is a high-performance, real-time messaging and voice platform inspired by Discord. Built with the MERN stack and Socket.io, it offers seamless communication through text channels, private DMs, and persistent voice rooms.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Personal%20Use-orange)

## ✨ Features

- **Real-time Messaging:** Instant message delivery with Socket.io.
- **Persistent Voice Channels:** Join a voice room and keep talking while navigating the entire app.
- **Unread Indicators:** Professional sync of unread counts and dots across all servers and DMs.
- **Server Management:** Create servers, invite friends with unique codes, and manage channels.
- **Friend System:** Add friends by UID, see online status, and start private conversations.
- **Rich Media:** Support for image attachments and custom user avatars.
- **Mobile Responsive:** Modern, premium UI that works on all screen sizes.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Zustand (State Management), Tailwind CSS, Lucide React.
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.io.
- **Real-time Voice:** ZegoCloud Prebuilt SDK.
- **Cloud Storage:** Cloudinary for image uploads.

---

## 🚀 Installation Guide

Follow these steps to set up the project locally.

### 1. Clone the Repository
```bash
git clone https://github.com/SD-Sagar/SD-Adda.git
cd SD-Adda
```

### 2. Setup Backend
1. Go to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Fill in your credentials:
   - `MONGODB_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A random string for token security.
   - `ZEGO_APP_ID`: From ZegoCloud dashboard.
   - `ZEGO_SERVER_SECRET`: From ZegoCloud dashboard.
   - `CLOUDINARY_URL`: Your Cloudinary connection string.

### 3. Setup Frontend
1. Go to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
4. Fill in the variables:
   - `VITE_API_URL`: http://localhost:5000/api
   - `VITE_SOCKET_URL`: http://localhost:5000
   - `VITE_ZEGO_APP_ID`: (Your Zego App ID)
   - `VITE_ZEGO_SERVER_SECRET`: (Your Zego Server Secret)

---

## 🏃 Running the App

### Local Development
Open two terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run start
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## ☁️ Deployment Guide (Render)

For a free production-grade deployment on **Render**, check the detailed [INSTALLATION.txt](file:///c:/Users/RIZA/Desktop/New%20folder%20(2)/INSTALLATION.txt) guide.

### Quick Setup:
1. Connect GitHub to Render.
2. Build Command: `npm run build`
3. Start Command: `npm start`
4. Set `NODE_ENV=production` and all other environment variables in the Render dashboard.

---

## 📜 Documentation

### Project Structure
- `/backend`: Express API, Socket.io logic, and Mongoose models.
- `/frontend`: React application, UI components, and Zustand stores.

### Voice Sync Logic
Voice sessions are managed by a global `VoiceManager` component that persists across all routes. Joining a voice channel creates a global state that allows you to switch text channels without disconnecting.

### Messaging Sync
Unread counts are tracked using a "Last Seen" timestamp system in MongoDB. Every message received is checked against this timestamp to determine unread status in real-time.

---

## ⚖️ License
This project is licensed for **Personal Use Only**. 
- ✅ Modification for personal projects is allowed.
- ❌ Commercial use is strictly prohibited.
- ❌ Resale or redistribution is strictly prohibited.

Created with ❤️ by **Sagar Dey** (2026).
