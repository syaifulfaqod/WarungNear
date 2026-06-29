import prisma from '../config/db.js';
import { haversineDistance } from '../utils/haversine.js';
import { formatResponse } from '../utils/response.js';
import { storeCreateSchema } from '../utils/validators.js';
import { checkAndUpdateSubscriptions } from '../utils/subscriptionChecker.js';


export const getNearbyStores = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10, keyword } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json(formatResponse(false, "Latitude and longitude are required"));
    }

    // Auto-update expired subscriptions
    await checkAndUpdateSubscriptions();

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const now = new Date();

    // Fetch all active stores with active owners and subscriptions
    const stores = await prisma.store.findMany({
      where: { 
        isActive: true,
        owner: {
          status: 'ACTIVE',
          is_active: true,
          subscription: {
            OR: [
              { status: 'ACTIVE' },
              {
                status: 'TRIAL',
                trial_end_date: { gte: now }
              }
            ]
          }
        }
      },
      include: {
        products: true,
        images: true,
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
          owner: store.owner,
          images: store.images
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

    // Auto-update expired subscriptions
    await checkAndUpdateSubscriptions();

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        products: true,
        images: true,
        owner: {
          include: {
            subscription: true
          }
        }
      }
    });

    if (!store) {
      return res.status(404).json(formatResponse(false, "Store not found"));
    }

    // Verify if store is active, owner is active/not suspended, and owner has active subscription
    const now = new Date();
    const isOwnerActive = store.owner.status === 'ACTIVE' && store.owner.is_active;
    const sub = store.owner.subscription;
    const isSubActive = sub && (
      sub.status === 'ACTIVE' ||
      (sub.status === 'TRIAL' && new Date(sub.trial_end_date) >= now)
    );

    if (!store.isActive || !isOwnerActive || !isSubActive) {
      return res.status(404).json(formatResponse(false, "Store not found"));
    }

    // Return the store with a limited owner profile to match existing interface
    const formattedStore = {
      ...store,
      owner: {
        id: store.owner.id,
        name: store.owner.name
      }
    };

    res.json(formatResponse(true, formattedStore));
  } catch (error) {
    console.error('getStoreById error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

export const getOwnerStore = async (req, res) => {
  try {
    const store = await prisma.store.findFirst({
      where: { owner_id: req.user.id },
      include: {
        images: true
      }
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
        data: validatedData,
        include: {
          images: true
        }
      });
    } else {
      store = await prisma.store.create({
        data: {
          ...validatedData,
          owner_id: req.user.id
        },
        include: {
          images: true
        }
      });
    }
    
    res.json(formatResponse(true, store));
  } catch (error) {
    res.status(400).json(formatResponse(false, error.errors || error.message));
  }
};

