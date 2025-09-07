const express = require('express');
const { body, validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'username profilePicture isOnline lastSeen')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

// @route   POST /api/messages/conversations
// @desc    Create new conversation
// @access  Private
router.post('/conversations', [
  authMiddleware,
  body('participants')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('isGroup')
    .optional()
    .isBoolean()
    .withMessage('isGroup must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { participants, isGroup = false, groupName, groupDescription } = req.body;
    
    // Add current user to participants
    const allParticipants = [...new Set([req.user.id, ...participants])];

    // Check if conversation already exists (for direct messages)
    if (!isGroup && allParticipants.length === 2) {
      const existingConversation = await Conversation.findOne({
        participants: { $all: allParticipants },
        isGroup: false
      });

      if (existingConversation) {
        return res.json({
          message: 'Conversation already exists',
          conversation: existingConversation
        });
      }
    }

    const conversation = new Conversation({
      participants: allParticipants,
      isGroup,
      groupName: isGroup ? groupName : '',
      groupDescription: isGroup ? groupDescription : ''
    });

    await conversation.save();
    await conversation.populate('participants', 'username profilePicture isOnline lastSeen');

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error creating conversation' });
  }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages in a conversation
// @access  Private
router.get('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user is participant in conversation
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'username profilePicture')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMessages = await Message.countDocuments({ conversation: req.params.conversationId });
    const totalPages = Math.ceil(totalMessages / limit);

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// @route   POST /api/messages
// @desc    Send message
// @access  Private
router.post('/', [
  authMiddleware,
  body('conversationId')
    .notEmpty()
    .withMessage('Conversation ID is required'),
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 1000 })
    .withMessage('Message content cannot exceed 1000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file'])
    .withMessage('Invalid message type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { conversationId, content, messageType = 'text', attachments = [], replyTo } = req.body;

    // Check if user is participant in conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to send message to this conversation' });
    }

    const message = new Message({
      conversation: conversationId,
      sender: req.user.id,
      content,
      messageType,
      attachments,
      replyTo
    });

    await message.save();
    await message.populate('sender', 'username profilePicture');
    await message.populate('replyTo');

    // Update conversation's last message and activity
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is participant in conversation
    const conversation = await Conversation.findById(message.conversation);
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }

    // Check if already marked as read
    const alreadyRead = message.isRead.some(read => 
      read.user.toString() === req.user.id
    );

    if (!alreadyRead) {
      message.isRead.push({
        user: req.user.id,
        readAt: new Date()
      });
      await message.save();
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error marking message as read' });
  }
});

// @route   PUT /api/messages/:messageId
// @desc    Edit message
// @access  Private
router.put('/:messageId', [
  authMiddleware,
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 1000 })
    .withMessage('Message content cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    const { content } = req.body;
    message.content = content;
    message.isEdited = true;
    await message.save();

    await message.populate('sender', 'username profilePicture');

    res.json({
      message: 'Message updated successfully',
      messageData: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error editing message' });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete message
// @access  Private
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error deleting message' });
  }
});

module.exports = router;
