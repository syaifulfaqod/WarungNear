import prisma from '../config/db.js';
import { productCreateSchema, productUpdateSchema } from '../utils/validators.js';
import { formatResponse } from '../utils/response.js';
import { storageService } from '../services/storageService.js';

export const getProducts = async (req, res) => {
  try {
    // 1. If user is authenticated and is an OWNER, only return their store's products
    if (req.user && req.user.role === 'OWNER') {
      const store = await prisma.store.findFirst({
        where: { owner_id: req.user.id }
      });
      
      if (!store) {
        return res.json(formatResponse(true, []));
      }
      
      const products = await prisma.product.findMany({
        where: { store_id: store.id }
      });
      
      return res.json(formatResponse(true, products));
    }
    
    // 2. Otherwise (CUSTOMER or unauthenticated), return public products with optional filters
    const { keyword, category } = req.query;
    
    let whereClause = {
      store: {
        isActive: true
      }
    };
    
    if (keyword) {
      whereClause.name = {
        contains: keyword,
        mode: 'insensitive'
      };
    }
    
    if (category && category !== 'Semua') {
      whereClause.category = category;
    }
    
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        store: true
      }
    });
    
    res.json(formatResponse(true, products));
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};


export const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!product) return res.status(404).json(formatResponse(false, "Product not found"));
    
    res.json(formatResponse(true, product));
  } catch (error) {
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

export const createProduct = async (req, res) => {
  try {
    const validatedData = productCreateSchema.parse(req.body);
    
    let store = await prisma.store.findFirst({
      where: { owner_id: req.user.id }
    });
    
    if (!store) {
      return res.status(400).json(formatResponse(false, "You must create a store first"));
    }
    
    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        category: validatedData.category,
        category_id: validatedData.category_id || null,
        price: validatedData.price,
        stock: validatedData.stock,
        image: validatedData.image || null,
        store_id: store.id
      }
    });
    
    res.status(201).json(formatResponse(true, product));
  } catch (error) {
    res.status(400).json(formatResponse(false, error.errors || error.message));
  }
};

export const updateProduct = async (req, res) => {
  try {
    const validatedData = productUpdateSchema.parse(req.body);
    const productId = parseInt(req.params.id);
    
    const productExists = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true }
    });
    
    if (!productExists || productExists.store.owner_id !== req.user.id) {
      return res.status(404).json(formatResponse(false, "Product not found or unauthorized"));
    }

    // Clean up old image if a new one is uploaded or image is removed
    if (validatedData.image !== undefined && productExists.image && productExists.image !== validatedData.image) {
      await storageService.deleteProductImage(productExists.image);
    }
    
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: validatedData.name,
        category: validatedData.category,
        category_id: validatedData.category_id !== undefined ? (validatedData.category_id || null) : undefined,
        price: validatedData.price,
        stock: validatedData.stock,
        image: validatedData.image
      }
    });
    
    res.json(formatResponse(true, product));
  } catch (error) {
    res.status(400).json(formatResponse(false, error.errors || error.message));
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    const productExists = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true }
    });
    
    if (!productExists || productExists.store.owner_id !== req.user.id) {
      return res.status(404).json(formatResponse(false, "Product not found or unauthorized"));
    }

    // Clean up image file from disk
    if (productExists.image) {
      await storageService.deleteProductImage(productExists.image);
    }
    
    await prisma.product.delete({
      where: { id: productId }
    });
    
    res.json(formatResponse(true, { id: productId }));
  } catch (error) {
    console.error('deleteProduct error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};
