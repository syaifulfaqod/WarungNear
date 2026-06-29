import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { 
  createOrder, 
  getOrders, 
  updateOrderStatus, 
  getStoreHistory, 
  getUnreadCount,
  cancelOrderByCustomer,
  cancelOrderByOwner,
  getCustomerUnreadCount
} from '../controllers/orderController.js';

const router = express.Router();

// Global authentication check
router.use(authMiddleware);

// POST /api/orders - only customer role can checkout
router.post('/', roleMiddleware('CUSTOMER'), createOrder);

// GET /api/orders/store-history - only owners viewing their store sales history
router.get('/store-history', roleMiddleware('OWNER'), getStoreHistory);

// GET /api/orders/unread-count - only owners can get unread order count
router.get('/unread-count', roleMiddleware('OWNER'), getUnreadCount);

// GET /api/orders/customer/unread-count - only customers can get unread order count
router.get('/customer/unread-count', roleMiddleware('CUSTOMER'), getCustomerUnreadCount);

// GET /api/orders - customers viewing their own history, owners viewing incoming orders
router.get('/', roleMiddleware('CUSTOMER', 'OWNER'), getOrders);

// PUT /api/orders/:id/status - only owners can update their store's order status
router.put('/:id/status', roleMiddleware('OWNER'), updateOrderStatus);

// PUT /api/orders/:id/cancel-customer - customer cancels order
router.put('/:id/cancel-customer', roleMiddleware('CUSTOMER'), cancelOrderByCustomer);

// PUT /api/orders/:id/cancel-owner - owner cancels order
router.put('/:id/cancel-owner', roleMiddleware('OWNER'), cancelOrderByOwner);

export default router;
