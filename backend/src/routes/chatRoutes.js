import express from 'express';
import { getConversations, getMessages, sendMessage } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All chat routes require authentication
router.get('/conversations', authMiddleware, getConversations);
router.get('/:conversationId/messages', authMiddleware, getMessages);
router.post('/send', authMiddleware, sendMessage);

export default router;
