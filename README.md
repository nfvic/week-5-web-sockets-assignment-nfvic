# 🔄 Real-Time Chat Application (Socket.io + React + Express)

[![Repo](https://img.shields.io/badge/GitHub-Repo-blue?logo=github)](https://github.com/PLP-MERN-Stack-Development/week-5-web-sockets-assignment-nfvic)

## 🚀 Project Overview

This is a full-featured real-time chat application built for the [PLP MERN Stack Week 5 Assignment](https://github.com/PLP-MERN-Stack-Development/week-5-web-sockets-assignment-nfvic.git).
It uses:
- **Node.js** and **Express** for the backend
- **Socket.io** for real-time communication
- **React** (with Vite) for the frontend

The app supports global and private messaging, message reactions, read receipts, file/image sharing, real-time notifications, and more. It is fully responsive and works on both desktop and mobile devices.

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js v18+ installed

### 1. Clone the repository
```sh
git clone https://github.com/PLP-MERN-Stack-Development/week-5-web-sockets-assignment-nfvic.git
cd week-5-web-sockets-assignment-nfvic
```

### 2. Install server dependencies
```sh
cd server
npm install
```

### 3. Install client dependencies
```sh
cd ../client
npm install
```

### 4. Start the development servers
- In one terminal:
  ```sh
  cd server
  npm run dev
  ```
- In another terminal:
  ```sh
  cd client
  npm run dev
  ```

### 5. Open the app
- Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## ✨ Features Implemented

- **User authentication** (username-based, prevents duplicates)
- **Global chat room** (all users can send/receive messages)
- **Private messaging** between users
- **Message reactions** (like, love, etc.)
- **Read receipts** for messages
- **File/image sharing** (images shown inline, other files as download links)
- **Message search** (filter messages by text or sender)
- **Typing indicators** (see when users are typing)
- **Online/offline status** for users
- **Real-time notifications** (sound, browser, unread count)
- **Reconnection logic** (status indicator, retry button)
- **Message pagination** (load older messages)
- **Responsive design** (works on desktop and mobile)
- **Message delivery acknowledgment** (shows if a message was delivered)

---

## 🖼️ Screenshots or GIFs of the Application


### Chat UI (Desktop)
<img width="1366" height="678" alt="image" src="https://github.com/user-attachments/assets/493a681d-5827-4b12-9210-d501f503036f" />




---



## 📋 Notes

- For browser notifications, allow notifications when prompted.
- For file/image sharing, images are displayed inline; other files are downloadable.
- All features are implemented as per the [assignment requirements](./Week5-Assignment.md).



---

## 📚 Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Assignment Repo](https://github.com/PLP-MERN-Stack-Development/week-5-web-sockets-assignment-nfvic.git) 
