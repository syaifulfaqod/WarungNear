import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const router = express.Router();

// Optional auth middleware for public listing but personalized for owners
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true }
      });
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

router.route('/')
  .get(optionalAuth, getProducts)
  .post(authMiddleware, roleMiddleware('OWNER', 'ADMIN'), createProduct);

router.route('/:id')
  .get(optionalAuth, getProductById)
  .put(authMiddleware, roleMiddleware('OWNER', 'ADMIN'), updateProduct)
  .delete(authMiddleware, roleMiddleware('OWNER', 'ADMIN'), deleteProduct);

export default router;

