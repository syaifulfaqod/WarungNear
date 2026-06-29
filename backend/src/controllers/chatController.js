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

      // Mark all customer messages in these stores' conversations as read
      await prisma.message.updateMany({
        where: {
          conversation: {
            store_id: { in: storeIds }
          },
          sender_id: { not: userId },
          is_read: false
        },
        data: {
          is_read: true
        }
      });

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

    // Mark all customer messages in this conversation as read
    if (userRole === 'OWNER') {
      await prisma.message.updateMany({
        where: {
          conversation_id: conversationId,
          sender_id: { not: userId },
          is_read: false
        },
        data: {
          is_read: true
        }
      });
    }

    if (userRole === 'CUSTOMER') {
      await prisma.message.updateMany({
        where: {
          conversation_id: conversationId,
          sender_id: { not: userId },
          customer_is_read: false
        },
        data: {
          customer_is_read: true
        }
      });
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
        message: message.trim(),
        is_read: userRole === 'OWNER',
        customer_is_read: userRole === 'CUSTOMER'
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

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'OWNER') {
      return res.status(403).json(formatResponse(false, "Forbidden: Only owners can check unread counts"));
    }

    const stores = await prisma.store.findMany({
      where: { owner_id: userId },
      select: { id: true }
    });

    const storeIds = stores.map(s => s.id);

    if (storeIds.length === 0) {
      return res.json(formatResponse(true, { count: 0, unreadConversations: [] }));
    }

    // Count unread customer messages
    const count = await prisma.message.count({
      where: {
        conversation: {
          store_id: { in: storeIds }
        },
        is_read: false,
        sender_id: { not: userId }
      }
    });

    // Get list of unique customers who sent unread messages for the header dropdown
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversation: {
          store_id: { in: storeIds }
        },
        is_read: false,
        sender_id: { not: userId }
      },
      select: {
        conversation: {
          select: {
            id: true,
            customer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      distinct: ['conversation_id']
    });

    const unreadConversations = unreadMessages.map(m => ({
      id: m.conversation.id,
      customerName: m.conversation.customer?.name || 'Customer'
    }));

    res.json(formatResponse(true, { count, unreadConversations }));
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

/**
 * Get or create a conversation between Customer and Store
 */
export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { storeId, orderId, customerId } = req.query;

    console.log('[DEBUG Backend Chat] getOrCreateConversation query:', {
      userId,
      userRole,
      storeId,
      orderId,
      customerId
    });

    let sId = storeId ? parseInt(storeId) : null;
    let oId = orderId ? parseInt(orderId) : null;
    let cId = customerId ? parseInt(customerId) : null;

    let conversation = null;

    if (userRole === 'CUSTOMER') {
      // Customer opening chat with a store (via storeId or orderId)
      if (oId && !sId) {
        // Fetch order to get storeId
        const order = await prisma.order.findUnique({
          where: { id: oId }
        });
        if (!order) {
          return res.status(404).json(formatResponse(false, "Order tidak ditemukan"));
        }
        if (order.customer_id !== userId) {
          return res.status(403).json(formatResponse(false, "Unauthorized"));
        }
        sId = order.store_id;
      }

      if (!sId) {
        return res.status(400).json(formatResponse(false, "storeId atau orderId diperlukan"));
      }

      // Check if conversation exists
      conversation = await prisma.conversation.findUnique({
        where: {
          customer_id_store_id: {
            customer_id: userId,
            store_id: sId
          }
        },
        include: {
          store: {
            select: { id: true, name: true, address: true, phoneNumber: true }
          },
          order: {
            select: { id: true, status: true, total: true }
          },
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      // If not, create it
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            customer_id: userId,
            store_id: sId,
            order_id: oId || null
          },
          include: {
            store: {
              select: { id: true, name: true, address: true, phoneNumber: true }
            },
            order: {
              select: { id: true, status: true, total: true }
            },
            messages: true
          }
        });
      }
    } else if (userRole === 'OWNER') {
      // Owner opening chat with a customer (via orderId or customerId)
      // First, get the owner's store
      const store = await prisma.store.findFirst({
        where: { owner_id: userId }
      });

      if (!store) {
        return res.status(404).json(formatResponse(false, "Toko Anda tidak ditemukan"));
      }

      sId = store.id;

      if (oId && !cId) {
        const order = await prisma.order.findUnique({
          where: { id: oId }
        });
        if (!order) {
          return res.status(404).json(formatResponse(false, "Order tidak ditemukan"));
        }
        if (order.store_id !== sId) {
          return res.status(403).json(formatResponse(false, "Unauthorized: Order belongs to another store"));
        }
        cId = order.customer_id;
      }

      if (!cId) {
        return res.status(400).json(formatResponse(false, "customerId atau orderId diperlukan"));
      }

      // Check if conversation exists
      conversation = await prisma.conversation.findUnique({
        where: {
          customer_id_store_id: {
            customer_id: cId,
            store_id: sId
          }
        },
        include: {
          store: {
            select: { id: true, name: true }
          },
          customer: {
            select: { id: true, name: true, email: true }
          },
          order: {
            select: { id: true, status: true, total: true }
          },
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      // If not, create it
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            customer_id: cId,
            store_id: sId,
            order_id: oId || null
          },
          include: {
            store: {
              select: { id: true, name: true }
            },
            customer: {
              select: { id: true, name: true, email: true }
            },
            order: {
              select: { id: true, status: true, total: true }
            },
            messages: true
          }
        });
      }
    } else {
      return res.status(403).json(formatResponse(false, "Forbidden: Invalid role"));
    }

    res.json(formatResponse(true, conversation));
  } catch (error) {
    console.error('getOrCreateConversation error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

export const getCustomerUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'CUSTOMER') {
      return res.status(403).json(formatResponse(false, "Forbidden: Only customers can check customer unread counts"));
    }

    const count = await prisma.message.count({
      where: {
        conversation: {
          customer_id: userId
        },
        sender_id: { not: userId },
        customer_is_read: false
      }
    });

    res.json(formatResponse(true, { unreadChatCount: count }));
  } catch (error) {
    console.error('getCustomerUnreadCount error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};
