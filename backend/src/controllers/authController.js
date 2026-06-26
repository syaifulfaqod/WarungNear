import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { registerSchema, loginSchema } from '../utils/validators.js';
import { formatResponse } from '../utils/response.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const registerUser = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    const userExists = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (userExists) {
      return res.status(400).json(formatResponse(false, "User already exists"));
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);
    
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role || 'CUSTOMER'
      }
    });

    if (user.role === 'OWNER') {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      await prisma.subscription.create({
        data: {
          owner_id: user.id,
          status: 'TRIAL',
          trial_end_date: trialEndDate
        }
      });
    }
    
    res.status(201).json(formatResponse(true, {
      token: generateToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: user.role === 'OWNER' ? 'Selamat! Anda mendapatkan akses gratis selama 7 hari.' : undefined
    }));
  } catch (error) {
    res.status(400).json(formatResponse(false, error.errors || error.message));
  }
};

export const loginUser = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (user && (await bcrypt.compare(validatedData.password, user.password))) {
      res.json(formatResponse(true, {
        token: generateToken(user.id),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }));
    } else {
      res.status(401).json(formatResponse(false, "Invalid email or password"));
    }
  } catch (error) {
    res.status(400).json(formatResponse(false, error.errors || error.message));
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true }
    });
    
    if (!user) {
      return res.status(404).json(formatResponse(false, "User not found"));
    }
    
    res.json(formatResponse(true, user));
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

