import express from 'express';
import { 
  getAdminStats, 
  getAdminUsers, 
  getAdminOwners, 
  getAdminStores, 
  toggleStoreStatus, 
  suspendUser, 
  unsuspendUser,
  getAdminReports 
} from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All admin routes require authentication and ADMIN role privilege
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.get('/owners', getAdminOwners);
router.get('/stores', getAdminStores);
router.get('/reports', getAdminReports);

router.put('/stores/:id/toggle', toggleStoreStatus);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/unsuspend', unsuspendUser);

export default router;
