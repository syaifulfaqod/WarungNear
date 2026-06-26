import express from 'express';
import { getNearbyStores, getStoreById, getOwnerStore, createOrUpdateStore } from '../controllers/storeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes — no auth required
router.get('/nearby', getNearbyStores);

// Owner routes — requires auth and OWNER/ADMIN role
router.get('/owner/store', authMiddleware, roleMiddleware('OWNER', 'ADMIN'), getOwnerStore);
router.post('/owner/store', authMiddleware, roleMiddleware('OWNER', 'ADMIN'), createOrUpdateStore);

router.get('/:id', getStoreById);

export default router;

