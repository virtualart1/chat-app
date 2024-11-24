const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_SECRET_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);

// Add before your routes
app.options('*', cors()); // Enable preflight for all routes

// Socket.IO connection handling
const onlineUsers = new Map();

io.on('connection', (socket) => {
  let userId = null;

  socket.on('user_connected', (newUserId) => {
    // Only update if it's a new connection or different user
    if (userId !== newUserId) {
      // Remove old mapping if exists
      if (userId) {
        onlineUsers.delete(userId);
      }
      
      userId = newUserId;
      console.log('User connected:', userId, 'Socket ID:', socket.id);
      onlineUsers.set(userId, socket.id);
      io.emit('user_status_update', Array.from(onlineUsers.keys()));
    }
  });

  socket.on('send_message', async (data) => {
    console.log('Message received from client:', data);
    
    try {
      if (data.isGroupMessage) {
        // For group messages, broadcast to all clients
        socket.broadcast.emit('receive_message', {
          ...data,
          isGroupMessage: true
        });
      } else {
        // For private messages
        const receiverSocketId = onlineUsers.get(data.receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', {
            ...data,
            isGroupMessage: false
          });
        }
      }
    } catch (error) {
      console.error('Socket error:', error);
    }
  });

  socket.on('typing', (data) => {
    if (!data.receiverId) return;
    
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit('user_typing', {
        userId: data.senderId
      });
    }
  });

  socket.on('stop_typing', (data) => {
    if (!data.receiverId) return;
    
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit('user_stop_typing', {
        userId: data.senderId
      });
    }
  });

  socket.on('disconnect', () => {
    if (userId) {
      console.log('User disconnected:', userId);
      onlineUsers.delete(userId);
      io.emit('user_status_update', Array.from(onlineUsers.keys()));
    }
  });

  // Admin actions
  socket.on('user_deleted', (userId) => {
    io.emit('user_deleted', userId);
  });

  socket.on('user_updated', (user) => {
    io.emit('user_updated', user);
  });

  socket.on('group_message_deleted', (messageId) => {
    io.emit('group_message_deleted', messageId);
  });

  // Add new socket event for user deletion
  socket.on('admin_deleted_user', (userId) => {
    console.log('User deleted by admin:', userId);
    
    // Find socket of deleted user and disconnect them
    const userSocketId = onlineUsers.get(userId);
    if (userSocketId) {
      // Emit event to the deleted user to force logout
      io.to(userSocketId).emit('force_logout', {
        message: 'Your account has been deleted by admin'
      });
      
      // Remove from online users
      onlineUsers.delete(userId);
    }

    // Broadcast to all clients that user was deleted
    io.emit('user_deleted', userId);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.originalUrl);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Admin credentials loaded:', {
    email: process.env.ADMIN_EMAIL,
    hasPassword: !!process.env.ADMIN_PASSWORD,
    hasSecretKey: !!process.env.ADMIN_SECRET_KEY
  });
}); 