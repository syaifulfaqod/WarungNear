import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for simplicity in dev/prod, or we can use allowedOrigins.
      methods: ['GET', 'POST', 'PUT']
    }
  });

  // JWT auth middleware for Socket.IO handshake
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      
      // Fallback to query param or authorization header if needed
      if (!token && socket.handshake.headers?.authorization) {
        token = socket.handshake.headers.authorization;
      }
      
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Strip Bearer prefix if exists
      if (token.startsWith('Bearer ')) {
        token = token.substring(7);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication failed:', error.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    const userRole = socket.user.role;

    // Join personal user room
    socket.join(`user:${userId}`);
    console.log(`🔌 Client connected: ${socket.id} (User: ${userId}, Role: ${userRole})`);

    // If Owner, automatically join rooms for all stores they own
    if (userRole === 'OWNER') {
      try {
        const stores = await prisma.store.findMany({
          where: { owner_id: userId },
          select: { id: true }
        });
        
        for (const store of stores) {
          socket.join(`store:${store.id}`);
          console.log(`🏠 Owner socket ${socket.id} joined room store:${store.id}`);
        }
      } catch (error) {
        console.error(`Error querying stores for Owner ${userId}:`, error);
      }
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id} (User: ${userId})`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket(server) first.');
  }
  return io;
};

/**
 * Emit stock updates to all clients globally (so that stock updates are synchronized real-time)
 */
export const emitStockUpdate = (productId, stock) => {
  if (io) {
    io.emit('stock:update', { product_id: productId, stock });
    console.log(`📢 Broadcasted stock:update -> Product: ${productId}, Stock: ${stock}`);
  }
};

/**
 * Emit new order notification to a specific store owner room
 */
export const emitNewOrder = (storeId, order) => {
  if (io) {
    io.to(`store:${storeId}`).emit('order:new', order);
    console.log(`📢 Emitted order:new -> Store Room store:${storeId}`);
  }
};

/**
 * Emit order status updates to the customer who placed the order
 */
export const emitOrderUpdate = (userId, order) => {
  if (io) {
    io.to(`user:${userId}`).emit('order:update', order);
    console.log(`📢 Emitted order:update -> User Room user:${userId}`);
  }
};

/**
 * Emit real-time chat messages to participants
 */
export const emitChatMessage = (storeId, customerId, message) => {
  if (io) {
    // Send to store owner room
    io.to(`store:${storeId}`).emit('chat:new', message);
    io.to(`store:${storeId}`).emit('chat:update', message);
    io.to(`store:${storeId}`).emit('chat:message', message);
    // Send to customer room
    io.to(`user:${customerId}`).emit('chat:new', message);
    io.to(`user:${customerId}`).emit('chat:update', message);
    io.to(`user:${customerId}`).emit('chat:message', message);
    console.log(`📢 Emitted chat:new / chat:update -> Store: ${storeId}, Customer: ${customerId}`);
  }
};
