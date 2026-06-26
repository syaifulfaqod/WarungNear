import express from 'express';
import { getSalesAnalytics } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('OWNER', 'ADMIN'));

router.get('/sales', getSalesAnalytics);

export default router;
