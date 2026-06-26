import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { createOrder, getOrders, updateOrderStatus, getStoreHistory } from '../controllers/orderController.js';

const router = express.Router();

// Global authentication check
router.use(authMiddleware);

// POST /api/orders - only customer role can checkout
router.post('/', roleMiddleware('CUSTOMER'), createOrder);

// GET /api/orders/store-history - only owners viewing their store sales history
router.get('/store-history', roleMiddleware('OWNER'), getStoreHistory);

// GET /api/orders - customers viewing their own history, owners viewing incoming orders
router.get('/', roleMiddleware('CUSTOMER', 'OWNER'), getOrders);

// PUT /api/orders/:id/status - only owners can update their store's order status
router.put('/:id/status', roleMiddleware('OWNER'), updateOrderStatus);

export default router;
