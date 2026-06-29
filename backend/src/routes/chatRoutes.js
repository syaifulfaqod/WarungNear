import express from 'express';
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  getUnreadCount,
  getOrCreateConversation,
  getCustomerUnreadCount
} from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All chat routes require authentication
router.get('/conversations', authMiddleware, getConversations);
router.get('/unread-count', authMiddleware, getUnreadCount);
router.get('/customer/unread-count', authMiddleware, getCustomerUnreadCount);
router.get('/get-or-create', authMiddleware, getOrCreateConversation);
router.get('/:conversationId/messages', authMiddleware, getMessages);
router.post('/send', authMiddleware, sendMessage);

export default router;
