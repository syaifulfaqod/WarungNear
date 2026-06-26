import express from 'express';
import {
  getSubscriptionStatus,
  submitPayment,
  getAdminSubscriptions,
  approveSubscription,
  rejectSubscription,
  getSubscriptionPlans
} from '../controllers/subscriptionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Enforce authentication for all routes
router.use(authMiddleware);

// Owner routes
router.get('/subscription/status', roleMiddleware('OWNER'), getSubscriptionStatus);
router.get('/subscription/plans', roleMiddleware('OWNER'), getSubscriptionPlans);
router.post('/subscription/payment', roleMiddleware('OWNER'), submitPayment);

// Admin routes
router.get('/admin/subscriptions', roleMiddleware('ADMIN'), getAdminSubscriptions);
router.patch('/admin/subscription/:id/approve', roleMiddleware('ADMIN'), approveSubscription);
router.patch('/admin/subscription/:id/reject', roleMiddleware('ADMIN'), rejectSubscription);

export default router;
