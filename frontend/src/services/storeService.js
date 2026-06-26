import api from './api';

export const storeService = {
  getNearbyStores: async (lat, lng, maxDistance = 5, keyword = '') => {
    try {
      const response = await api.get('/stores/nearby', {
        params: { latitude: lat, longitude: lng, maxDistance, keyword }
      });
      
      if (response.data.success) {
        const mapped = response.data.data.map(item => {
          const s = item.store;
          
          const openTime = s.open_time || "07:00";
          const closeTime = s.close_time || "22:00";
          
          // Determine isOpen based on Asia/Jakarta timezone & midnight safety
          let isOpen = true;
          try {
            const now = new Date();
            const jakartaFormatter = new Intl.DateTimeFormat('en-US', {
              timeZone: 'Asia/Jakarta',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
            const currentTimeStr = jakartaFormatter.format(now).replace('.', ':');
            
            const [currH, currM] = currentTimeStr.split(':').map(Number);
            const [openH, openM] = openTime.split(':').map(Number);
            const [closeH, closeM] = closeTime.split(':').map(Number);
            
            const currentVal = currH * 60 + currM;
            const openVal = openH * 60 + openM;
            const closeVal = closeH * 60 + closeM;
            
            if (openVal < closeVal) {
              isOpen = currentVal >= openVal && currentVal <= closeVal;
            } else if (openVal > closeVal) {
              isOpen = currentVal >= openVal || currentVal <= closeVal;
            } else {
              isOpen = true;
            }
          } catch (e) {
            isOpen = true;
          }
          
          return {
            id: s.id,
            name: s.name,
            address: s.address,
            lat: s.latitude,
            lng: s.longitude,
            latitude: s.latitude,
            longitude: s.longitude,
            phoneNumber: s.phoneNumber,
            distance: item.distance,
            distanceLabel: item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance.toFixed(1)}km`,
            isOpen: isOpen,
            openTime: openTime,
            closeTime: closeTime,
            productCount: item.availableProducts,
            image: s.image || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
          };
        });
        
        return { success: true, data: mapped };
      }
      return { success: false, message: response.data.message || 'Gagal memuat toko terdekat' };
    } catch (error) {
      console.error('getNearbyStores error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat data toko terdekat' };
    }
  },
  
  getStoreById: async (id) => {
    try {
      const response = await api.get(`/stores/${id}`);
      if (response.data.success) {
        const s = response.data.data;
        
        const openTime = s.open_time || "07:00";
        const closeTime = s.close_time || "22:00";
        
        // Determine isOpen based on Asia/Jakarta timezone & midnight safety
        let isOpen = true;
        try {
          const now = new Date();
          const jakartaFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          const currentTimeStr = jakartaFormatter.format(now).replace('.', ':');
          
          const [currH, currM] = currentTimeStr.split(':').map(Number);
          const [openH, openM] = openTime.split(':').map(Number);
          const [closeH, closeM] = closeTime.split(':').map(Number);
          
          const currentVal = currH * 60 + currM;
          const openVal = openH * 60 + openM;
          const closeVal = closeH * 60 + closeM;
          
          if (openVal < closeVal) {
            isOpen = currentVal >= openVal && currentVal <= closeVal;
          } else if (openVal > closeVal) {
            isOpen = currentVal >= openVal || currentVal <= closeVal;
          } else {
            isOpen = true;
          }
        } catch (e) {
          isOpen = true;
        }
        
        const mapped = {
          id: s.id,
          name: s.name,
          address: s.address,
          lat: s.latitude,
          lng: s.longitude,
          latitude: s.latitude,
          longitude: s.longitude,
          phoneNumber: s.phoneNumber,
          isOpen: isOpen,
          openTime: openTime,
          closeTime: closeTime,
          productCount: s.products?.length || 0,
          image: s.image || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          products: (s.products || []).map(p => {
            const stock = p.stock;
            let status = 'Tersedia';
            if (stock === 0) status = 'Habis';
            else if (stock <= 5) status = 'Stok menipis';
            
            return {
              id: p.id,
              storeId: s.id,
              storeName: s.name,
              name: p.name,
              category: p.category,
              price: p.price,
              stock: p.stock,
              status: status,
              image: p.image || 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
            };
          })
        };
        
        return { success: true, data: mapped };
      }
      return { success: false, message: response.data.message || 'Toko tidak ditemukan' };
    } catch (error) {
      console.error('getStoreById error:', error);
      return { success: false, message: error.response?.data?.message || 'Toko tidak ditemukan' };
    }
  },

  getOwnerStore: async () => {
    try {
      const response = await api.get('/stores/owner/store');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal memuat toko owner' };
    } catch (error) {
      console.error('getOwnerStore error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat toko owner' };
    }
  },

  saveOwnerStore: async (storeData) => {
    try {
      const response = await api.post('/stores/owner/store', storeData);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal menyimpan toko' };
    } catch (error) {
      console.error('saveOwnerStore error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal menyimpan toko' };
    }
  }
};
