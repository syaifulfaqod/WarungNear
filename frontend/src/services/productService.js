import api from './api';
import useSearchStore from '../store/useSearchStore';

// Helper to calculate distance in km using Haversine formula
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const productService = {
  getProducts: async (filters = {}) => {
    try {
      const params = {};
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.category && filters.category !== 'Semua') params.category = filters.category;
      
      const response = await api.get('/products', { params });
      
      if (response.data.success) {
        let mapped = response.data.data.map(p => {
          const stock = p.stock;
          let status = 'Tersedia';
          if (stock === 0) status = 'Habis';
          else if (stock <= 5) status = 'Stok menipis';
          
          return {
            id: p.id,
            storeId: p.store_id,
            storeName: p.store?.name || 'Toko',
            distance: 0,
            distanceLabel: '0km',
            name: p.name,
            category: p.category,
            price: p.price,
            stock: p.stock,
            status: status,
            image: p.image || 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
          };
        });

        // Compute distance if location is available
        const userLoc = useSearchStore.getState().userLocation;
        if (userLoc && userLoc.lat !== null && userLoc.lng !== null) {
          mapped = mapped.map(p => {
            const rawProduct = response.data.data.find(dbProd => dbProd.id === p.id);
            const store = rawProduct?.store;
            if (store && store.latitude && store.longitude) {
              const dist = haversineDistance(userLoc.lat, userLoc.lng, store.latitude, store.longitude);
              return {
                ...p,
                distance: dist,
                distanceLabel: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`
              };
            }
            return p;
          });
        }

        // Apply filters in frontend for maxDistance and sorting to match expected UI behavior
        if (filters.maxDistance) {
          mapped = mapped.filter(p => p.distance <= filters.maxDistance);
        }

        if (filters.sortBy) {
          if (filters.sortBy === 'Terdekat') {
            mapped.sort((a, b) => a.distance - b.distance);
          } else if (filters.sortBy === 'Stok terbanyak' || filters.sortBy === 'Stok tersedia') {
            mapped.sort((a, b) => b.stock - a.stock);
          } else if (filters.sortBy === 'Harga termurah') {
            mapped.sort((a, b) => a.price - b.price);
          }
        }

        return { success: true, data: mapped };
      }
      return { success: false, message: response.data.message || 'Gagal memuat produk' };
    } catch (error) {
      console.error('getProducts error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat data produk' };
    }
  },
  
  getStoreProducts: async (storeId) => {
    try {
      const response = await api.get(`/stores/${storeId}`);
      if (response.data.success) {
        const store = response.data.data;
        const mapped = (store.products || []).map(p => {
          const stock = p.stock;
          let status = 'Tersedia';
          if (stock === 0) status = 'Habis';
          else if (stock <= 5) status = 'Stok menipis';
          
          return {
            id: p.id,
            storeId: store.id,
            storeName: store.name,
            name: p.name,
            category: p.category,
            price: p.price,
            stock: p.stock,
            status: status,
            image: p.image || 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
          };
        });
        return { success: true, data: mapped };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('getStoreProducts error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat produk toko' };
    }
  }
};
