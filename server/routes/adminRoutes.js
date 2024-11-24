const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middleware/adminAuth');
const bcrypt = require('bcryptjs');

// Admin login with rate limiting and security measures
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip;

    // Check if IP is locked out
    const attemptData = loginAttempts.get(clientIP);
    if (attemptData && attemptData.lockedUntil > Date.now()) {
      return res.status(429).json({
        message: 'Too many failed attempts. Try again later.',
        waitTime: Math.ceil((attemptData.lockedUntil - Date.now()) / 1000)
      });
    }

    // Reset attempts if lock time has passed
    if (attemptData && attemptData.lockedUntil < Date.now()) {
      loginAttempts.delete(clientIP);
    }

    // Validate credentials
    const isValidEmail = email === process.env.ADMIN_EMAIL;
    const isValidPassword = password === process.env.ADMIN_PASSWORD;

    if (!isValidEmail || !isValidPassword) {
      // Track failed attempts
      const currentAttempts = (loginAttempts.get(clientIP)?.attempts || 0) + 1;
      
      if (currentAttempts >= MAX_ATTEMPTS) {
        loginAttempts.set(clientIP, {
          attempts: currentAttempts,
          lockedUntil: Date.now() + LOCK_TIME
        });
        
        return res.status(429).json({
          message: 'Too many failed attempts. Try again later.',
          waitTime: LOCK_TIME / 1000
        });
      }

      loginAttempts.set(clientIP, {
        attempts: currentAttempts,
        lockedUntil: currentAttempts >= MAX_ATTEMPTS ? Date.now() + LOCK_TIME : 0
      });

      return res.status(401).json({
        message: 'Invalid admin credentials',
        attemptsLeft: MAX_ATTEMPTS - currentAttempts
      });
    }

    // Reset attempts on successful login
    loginAttempts.delete(clientIP);

    // Generate JWT token
    const token = jwt.sign(
      { 
        isAdmin: true,
        email: process.env.ADMIN_EMAIL
      },
      process.env.ADMIN_SECRET_KEY,
      { 
        expiresIn: '24h',
        algorithm: 'HS512'
      }
    );

    // Set secure cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Suspend/Unsuspend user
router.put('/users/:userId/suspend', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    user.isSuspended = !user.isSuspended;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Delete user
router.delete('/users/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all messages by this user
    await Message.deleteMany({ 
      $or: [
        { sender: req.params.userId },
        { receiver: req.params.userId }
      ]
    });

    // Delete the user using deleteOne()
    await User.deleteOne({ _id: req.params.userId });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Block/Unblock user from group chat
router.put('/users/:userId/block-group', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    user.isBlockedFromGroup = !user.isBlockedFromGroup;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Delete specific group message
router.delete('/messages/:messageId', adminAuth, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// Clear all group messages
router.delete('/messages/group/clear', adminAuth, async (req, res) => {
  try {
    await Message.deleteMany({ isGroupMessage: true });
    res.json({ message: 'Group chat cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear group chat' });
  }
});

module.exports = router; 