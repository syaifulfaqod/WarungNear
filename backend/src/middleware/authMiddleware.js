import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { formatResponse } from '../utils/response.js';

export const authMiddleware = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json(formatResponse(false, "Not authorized, no token"));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, status: true, is_active: true, suspend_reason: true }
    });
    
    if (!user) {
      return res.status(401).json(formatResponse(false, "Not authorized, user not found"));
    }

    if (user.status === 'SUSPENDED' || !user.is_active) {
      const msg = user.suspend_reason || "Akun Anda telah dinonaktifkan oleh Admin WarungNear. Silakan hubungi admin untuk informasi lebih lanjut.";
      return res.status(403).json(formatResponse(false, msg));
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(formatResponse(false, "Not authorized, token failed"));
  }
};
