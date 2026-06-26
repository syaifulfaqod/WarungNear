import prisma from '../config/db.js';
import { formatResponse } from '../utils/response.js';
import { emitChatMessage } from '../socket/index.js';

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let conversations = [];

    if (userRole === 'CUSTOMER') {
      conversations = await prisma.conversation.findMany({
        where: { customer_id: userId },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              address: true,
              phoneNumber: true,
              owner: {
                select: {
                  name: true
                }
              }
            }
          },
          order: {
            select: {
              id: true,
              status: true,
              total: true
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      console.log('[DEBUG Backend Chat] Customer getConversations:', {
        customerId: userId,
        conversationsCount: conversations.length
      });
    } else if (userRole === 'OWNER') {
      // Find all stores owned by this owner
      const stores = await prisma.store.findMany({
        where: { owner_id: userId },
        select: { id: true }
      });

      const storeIds = stores.map(s => s.id);

      if (storeIds.length === 0) {
        console.log('[DEBUG Backend Chat] Owner getConversations: No stores found for owner:', userId);
        return res.json(formatResponse(true, []));
      }

      conversations = await prisma.conversation.findMany({
        where: { store_id: { in: storeIds } },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          store: {
            select: {
              id: true,
              name: true
            }
          },
          order: {
            select: {
              id: true,
              status: true,
              total: true
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      console.log('[DEBUG Backend Chat] Owner getConversations:', {
        ownerId: userId,
        storeIds,
        conversationsCount: conversations.length
      });
    } else {
      return res.status(403).json(formatResponse(false, "Forbidden: Invalid role"));
    }

    res.json(formatResponse(true, conversations));
  } catch (error) {
    console.error('getConversations error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

export const getMessages = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const userId = req.user.id;
    const userRole = req.user.role;

    if (isNaN(conversationId)) {
      return res.status(400).json(formatResponse(false, "Invalid conversation ID"));
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        store: {
          select: {
            owner_id: true
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json(formatResponse(false, "Conversation not found"));
    }

    // Security Check: Customer must be customer_id, Owner must be store owner_id
    if (userRole === 'CUSTOMER' && conversation.customer_id !== userId) {
      return res.status(403).json(formatResponse(false, "Unauthorized access to this conversation"));
    }

    if (userRole === 'OWNER' && conversation.store.owner_id !== userId) {
      return res.status(403).json(formatResponse(false, "Unauthorized access to this conversation"));
    }

    const messages = await prisma.message.findMany({
      where: { conversation_id: conversationId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(formatResponse(true, messages));
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { storeId, conversationId, orderId, message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('[DEBUG Backend Chat] Send Message parameters:', {
      userId,
      userRole,
      storeId,
      conversationId,
      orderId,
      message: message ? message.trim() : null
    });

    if (!message || message.trim() === '') {
      return res.status(400).json(formatResponse(false, "Pesan tidak boleh kosong"));
    }

    let conversation = null;

    if (userRole === 'CUSTOMER') {
      if (conversationId) {
        conversation = await prisma.conversation.findUnique({
          where: { id: parseInt(conversationId) },
          include: { store: true }
        });
        
        if (!conversation || conversation.customer_id !== userId) {
          return res.status(403).json(formatResponse(false, "Percakapan tidak valid"));
        }
      } else if (storeId) {
        const sId = parseInt(storeId);
        
        // Validate store exists
        const store = await prisma.store.findUnique({
          where: { id: sId }
        });
        if (!store) {
          return res.status(404).json(formatResponse(false, "Toko tidak ditemukan"));
        }

        // Find existing store-based conversation
        conversation = await prisma.conversation.findUnique({
          where: {
            customer_id_store_id: {
              customer_id: userId,
              store_id: sId
            }
          },
          include: { store: true }
        });

        // If not exists, create it
        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              customer_id: userId,
              store_id: sId
            },
            include: { store: true }
          });
        }
      } else if (orderId) {
        const oId = parseInt(orderId);

        // Fetch order to validate ownership and get storeId
        const order = await prisma.order.findUnique({
          where: { id: oId }
        });

        if (!order) {
          return res.status(404).json(formatResponse(false, "Pesanan tidak ditemukan"));
        }

        if (order.customer_id !== userId) {
          return res.status(403).json(formatResponse(false, "Anda hanya dapat mengirim chat untuk pesanan milik sendiri"));
        }

        const sId = order.store_id;
        
        // Find existing store-based conversation
        conversation = await prisma.conversation.findUnique({
          where: {
            customer_id_store_id: {
              customer_id: userId,
              store_id: sId
            }
          },
          include: { store: true }
        });

        // If not exists, create it and link the order_id
        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              customer_id: userId,
              store_id: sId,
              order_id: oId
            },
            include: { store: true }
          });
        }
      } else {
        return res.status(400).json(formatResponse(false, "Diperlukan conversationId, storeId atau orderId"));
      }
    } else if (userRole === 'OWNER') {
      if (!conversationId) {
        return res.status(400).json(formatResponse(false, "conversationId diperlukan"));
      }

      conversation = await prisma.conversation.findUnique({
        where: { id: parseInt(conversationId) },
        include: { store: true }
      });

      if (!conversation || conversation.store.owner_id !== userId) {
        return res.status(403).json(formatResponse(false, "Akses obrolan ditolak"));
      }
    } else {
      return res.status(403).json(formatResponse(false, "Role tidak memiliki akses"));
    }

    // Save message to database
    const newMessage = await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender_id: userId,
        message: message.trim()
      }
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    // Emit realtime message through Socket.IO helper
    emitChatMessage(conversation.store_id, conversation.customer_id, newMessage);

    console.log('[DEBUG Backend Chat] Message processed successfully:', {
      conversationId: conversation.id,
      messageId: newMessage.id,
      storeId: conversation.store_id,
      customerId: conversation.customer_id
    });

    res.json(formatResponse(true, newMessage));
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};
