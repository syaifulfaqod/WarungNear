import express from 'express';
import { createTransaction, getTransactions } from '../controllers/transactionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('OWNER', 'ADMIN'));

router.route('/')
  .get(getTransactions)
  .post(checkSubscription, createTransaction);

export default router;
