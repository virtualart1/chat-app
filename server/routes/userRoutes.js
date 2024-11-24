const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, fullName, password } = req.body;
    
    if (!username || !fullName || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = await User.create({
      username,
      fullName,
      password,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      token: jwt.sign({ id: user._id }, 'your_jwt_secret', {
        expiresIn: '30d',
      }),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        token: jwt.sign({ id: user._id }, 'your_jwt_secret', {
          expiresIn: '30d',
        }),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed', 
      error: error.message 
    });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all users...');
    const users = await User.find({}, '-password');
    console.log('Users found:', users);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users', 
      error: error.message 
    });
  }
});

module.exports = router; 