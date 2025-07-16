// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:5173',
  'https://week-5-web-sockets-assignment-nfvic.vercel.app',
  'https://week-5-web-sockets-assignment-nfvic-qj3hm971s-nfvics-projects.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users and messages
const users = {};
const messages = [];
const typingUsers = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', (username) => {
    // Prevent duplicate usernames
    const usernameTaken = Object.values(users).some(
      (user) => user.username === username
    );
    if (usernameTaken) {
      socket.emit('username_error', 'Username is already taken.');
      return;
    }
    if (!username || typeof username !== 'string' || !username.trim()) {
      socket.emit('username_error', 'Invalid username.');
      return;
    }
    users[socket.id] = { username, id: socket.id };
    io.emit('user_list', Object.values(users));
    io.emit('user_joined', { username, id: socket.id });
    console.log(`${username} joined the chat`);
  });

  // Handle chat messages
  socket.on('send_message', (messageData, ack) => {
    const message = {
      ...messageData,
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      timestamp: new Date().toISOString(),
    };
    
    messages.push(message);
    
    // Limit stored messages to prevent memory issues
    if (messages.length > 100) {
      messages.shift();
    }
    
    io.emit('receive_message', message);
    // Send delivery acknowledgment to sender
    if (typeof ack === 'function') {
      ack({ delivered: true, messageId: message.id });
    }
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    if (users[socket.id]) {
      const username = users[socket.id].username;
      
      if (isTyping) {
        typingUsers[socket.id] = username;
      } else {
        delete typingUsers[socket.id];
      }
      
      io.emit('typing_users', Object.values(typingUsers));
    }
  });

  // Handle private messages
  socket.on('private_message', ({ to, message }) => {
    const messageData = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };
    
    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
  });

  // Handle message reactions
  socket.on('react_message', ({ messageId, reaction }) => {
    // Find the message
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      // Use username as key to allow one reaction per user
      const username = users[socket.id]?.username || 'Anonymous';
      msg.reactions[username] = reaction;
      io.emit('message_reaction', { messageId, reactions: msg.reactions });
    }
  });

  // Handle message read receipts
  socket.on('message_read', ({ messageId }) => {
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      if (!msg.readBy) msg.readBy = [];
      const username = users[socket.id]?.username || 'Anonymous';
      if (!msg.readBy.includes(username)) {
        msg.readBy.push(username);
        io.emit('message_read_update', { messageId, readBy: msg.readBy });
      }
    }
  });

  // Handle file/image messages
  socket.on('file_message', (fileData, ack) => {
    const message = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      timestamp: new Date().toISOString(),
      isFile: true,
      file: {
        name: fileData.name,
        type: fileData.type,
        data: fileData.data, // base64 string
        url: fileData.url || null,
      },
      message: fileData.caption || '',
    };
    messages.push(message);
    if (messages.length > 100) messages.shift();
    io.emit('file_message', message);
    if (typeof ack === 'function') {
      ack({ delivered: true, messageId: message.id });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const { username } = users[socket.id];
      io.emit('user_left', { username, id: socket.id });
      console.log(`${username} left the chat`);
    }
    
    delete users[socket.id];
    delete typingUsers[socket.id];
    
    io.emit('user_list', Object.values(users));
    io.emit('typing_users', Object.values(typingUsers));
  });
});

// API routes
app.get('/api/messages', (req, res) => {
  // Pagination: ?before=<timestamp>&limit=<number>
  let { before, limit } = req.query;
  limit = parseInt(limit) || 20;
  let filtered = messages;
  if (before) {
    filtered = filtered.filter(m => new Date(m.timestamp) < new Date(before));
  }
  // Sort by timestamp descending, then take the most recent 'limit' messages
  filtered = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  // Return in chronological order
  filtered = filtered.reverse();
  res.json(filtered);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 