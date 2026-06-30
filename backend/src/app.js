import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './config/db.js';
import { initSocket } from './socket/index.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import storeImageRoutes from './routes/storeImageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("❌ CRITICAL SECURITY ERROR: JWT_SECRET is not defined in the environment variables!");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("❌ CRITICAL CONFIGURATION ERROR: DATABASE_URL is not defined in the environment variables!");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Production CORS Configuration supporting local, staging, and production domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000'
];

if (process.env.FRONTEND_URL) {
  const origins = process.env.FRONTEND_URL.split(',').map(o => o.trim());
  allowedOrigins.push(...origins);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, postman, or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true
}));

app.use(express.json());

// Serve static uploads folder
const baseUploadDir = process.env.UPLOAD_DIR 
  ? path.resolve(process.env.UPLOAD_DIR) 
  : path.join(__dirname, '../uploads');

app.use('/uploads', express.static(baseUploadDir));

// Health check with Prisma Database connectivity check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    console.error('Database connection check failed in health check:', error);
  }

  res.status(dbStatus === 'connected' ? 200 : 500).json({
    success: dbStatus === 'connected',
    message: "Server running",
    database: dbStatus
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/store/images', storeImageRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const server = http.createServer(app);
initSocket(server, allowedOrigins);

server.listen(PORT, () => {
  console.log(`🚀 WarungNear API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful Shutdown Lifecycle
const gracefulShutdown = (signal) => {
  console.log(`\n=== Received ${signal}. Starting graceful shutdown lifecycle ===`);
  
  // 1. Stop Express server from accepting new requests
  server.close(async () => {
    console.log('✔ Express HTTP server stopped.');
    
    try {
      // 2. Disconnect Prisma client
      await prisma.$disconnect();
      console.log('✔ Prisma database client disconnected.');
      
      console.log('=== Graceful shutdown completed. Exiting process ===');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during Prisma client disconnect:', err);
      process.exit(1);
    }
  });

  // Force exit after 10s if shutdown hangs
  setTimeout(() => {
    console.error('❌ Graceful shutdown timed out. Force exiting process.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;

