const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// Get group messages
router.get('/group', async (req, res) => {
  try {
    const messages = await Message.find({ isGroupMessage: true })
      .sort({ createdAt: 1 })
      .populate('sender', 'username fullName')
      .populate('replyTo.sender', 'username fullName');
    
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.timestamp || msg.createdAt,
      createdAt: msg.createdAt,
      isGroupMessage: true,
      replyTo: msg.replyTo ? {
        messageId: msg.replyTo.messageId,
        content: msg.replyTo.content,
        sender: msg.replyTo.sender
      } : null
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get private messages
router.get('/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
      isGroupMessage: false
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username fullName')
    .populate('replyTo.sender', 'username fullName');
    
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      sender: msg.sender,
      receiver: msg.receiver,
      content: msg.content,
      timestamp: msg.timestamp || msg.createdAt,
      createdAt: msg.createdAt,
      replyTo: msg.replyTo ? {
        messageId: msg.replyTo.messageId,
        content: msg.replyTo.content,
        sender: msg.replyTo.sender
      } : null
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save message
router.post('/', async (req, res) => {
  try {
    const { sender, content, isGroupMessage = false, receiver, replyTo } = req.body;
    
    // Check if user is suspended
    const senderUser = await User.findById(sender);
    if (!senderUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (senderUser.isSuspended) {
      return res.status(403).json({ 
        message: 'Your account is suspended. You cannot send messages.',
        isSuspended: true
      });
    }

    // Check if user is blocked from group chat
    if (isGroupMessage && senderUser.isBlockedFromGroup) {
      return res.status(403).json({ 
        message: 'You are blocked from sending messages in group chat.',
        isBlockedFromGroup: true
      });
    }

    // Validate required fields
    if (!sender || !content) {
      return res.status(400).json({ 
        message: 'Sender and content are required' 
      });
    }

    // Create the message data
    const messageData = {
      sender,
      content,
      isGroupMessage
    };

    // Add receiver for private messages
    if (!isGroupMessage && receiver) {
      messageData.receiver = receiver;
    }

    // Add reply information if exists
    if (replyTo && typeof replyTo === 'object') {
      messageData.replyTo = {
        messageId: replyTo._id || replyTo.messageId,
        content: replyTo.content,
        sender: replyTo.sender && (replyTo.sender._id || replyTo.sender)
      };
    }

    console.log('Creating message with data:', messageData); // Debug log

    // Create and save the message
    const message = await Message.create(messageData);

    // Populate the sender and reply sender information
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName')
      .populate('replyTo.sender', 'username fullName');

    if (!populatedMessage) {
      throw new Error('Failed to populate message data');
    }

    // Format the response
    const formattedMessage = {
      _id: populatedMessage._id,
      sender: populatedMessage.sender,
      content: populatedMessage.content,
      timestamp: populatedMessage.timestamp,
      createdAt: populatedMessage.createdAt,
      isGroupMessage
    };

    // Add reply information if exists
    if (populatedMessage.replyTo) {
      formattedMessage.replyTo = {
        messageId: populatedMessage.replyTo.messageId,
        content: populatedMessage.replyTo.content,
        sender: populatedMessage.replyTo.sender
      };
    }

    // Add receiver information for private messages
    if (!isGroupMessage && populatedMessage.receiver) {
      formattedMessage.receiver = populatedMessage.receiver;
    }

    console.log('Sending formatted message:', formattedMessage); // Debug log

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ 
      message: 'Failed to save message',
      error: error.message
    });
  }
});

module.exports = router; 