import prisma from '../config/db.js';
import { haversineDistance } from '../utils/haversine.js';
import { formatResponse } from '../utils/response.js';
import { storeCreateSchema } from '../utils/validators.js';


export const getNearbyStores = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10, keyword } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json(formatResponse(false, "Latitude and longitude are required"));
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Fetch all active stores with their products
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      include: {
        products: true,
        owner: {
          select: { id: true, name: true }
        }
      }
    });

    // Calculate distance for each store using Haversine
    let storesWithDistance = stores.map(store => {
      const distance = haversineDistance(lat, lng, store.latitude, store.longitude);
      const availableProducts = store.products.filter(p => p.stock > 0).length;
      const totalStock = store.products.reduce((sum, p) => sum + p.stock, 0);

      return {
        store: {
          id: store.id,
          name: store.name,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          open_time: store.open_time,
          close_time: store.close_time,
          phoneNumber: store.phoneNumber,
          owner: store.owner
        },
        distance,
        availableProducts,
        totalStock,
        products: store.products
      };
    });

    // Filter by maxDistance
    storesWithDistance = storesWithDistance.filter(s => s.distance <= parseFloat(maxDistance));

    // Filter by keyword if provided (search in store name or product names)
    if (keyword) {
      const kw = keyword.toLowerCase();
      storesWithDistance = storesWithDistance.filter(s =>
        s.store.name.toLowerCase().includes(kw) ||
        s.products.some(p => p.name.toLowerCase().includes(kw))
      );
    }

    // Sort: 1. Nearest distance, 2. Most available products, 3. Most total stock
    storesWithDistance.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (a.availableProducts !== b.availableProducts) return b.availableProducts - a.availableProducts;
      return b.totalStock - a.totalStock;
    });

    res.json(formatResponse(true, storesWithDistance));
  } catch (error) {
    console.error('getNearbyStores error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

export const getStoreById = async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        products: true,
        owner: {
          select: { id: true, name: true }
        }
      }
    });

    if (!store) {
      return res.status(404).json(formatResponse(false, "Store not found"));
    }

    res.json(formatResponse(true, store));
  } catch (error) {
    console.error('getStoreById error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

export const getOwnerStore = async (req, res) => {
  try {
    const store = await prisma.store.findFirst({
      where: { owner_id: req.user.id }
    });
    res.json(formatResponse(true, store));
  } catch (error) {
    console.error('getOwnerStore error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

export const createOrUpdateStore = async (req, res) => {
  try {
    const validatedData = storeCreateSchema.parse(req.body);
    
    // Ownership is always derived from req.user.id
    let store = await prisma.store.findFirst({
      where: { owner_id: req.user.id }
    });
    
    if (store) {
      store = await prisma.store.update({
        where: { id: store.id },
        data: validatedData
      });
    } else {
      store = await prisma.store.create({
        data: {
          ...validatedData,
          owner_id: req.user.id
        }
      });
    }
    
    res.json(formatResponse(true, store));
  } catch (error) {
    res.status(400).json(formatResponse(false, error.errors || error.message));
  }
};

