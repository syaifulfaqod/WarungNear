import api from './api';

export const orderService = {
  /**
   * Place a new order
   * payload: { store_id, items: [{ product_id, quantity }] }
   */
  createOrder: async (storeId, items) => {
    try {
      const response = await api.post('/orders', {
        store_id: parseInt(storeId),
        items: items.map(item => ({
          product_id: parseInt(item.id),
          quantity: parseInt(item.quantity)
        }))
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal membuat pesanan' };
    } catch (error) {
      console.error('createOrder API error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal membuat pesanan' };
    }
  },

  /**
   * Get orders history (Customer or Owner)
   */
  getOrders: async () => {
    try {
      const response = await api.get('/orders');
      console.log("Orders Response:", response);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal memuat daftar pesanan' };
    } catch (error) {
      console.error('getOrders API error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat daftar pesanan' };
    }
  },

  /**
   * Update order status (Owner only)
   */
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal memperbarui status pesanan' };
    } catch (error) {
      console.error('updateOrderStatus API error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memperbarui status pesanan' };
    }
  },

  /**
   * Get store orders history (Owner only)
   */
  getStoreHistory: async () => {
    try {
      const response = await api.get('/orders/store-history');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal memuat riwayat transaksi toko' };
    } catch (error) {
      console.error('getStoreHistory API error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat riwayat transaksi toko' };
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/orders/unread-count');
      return response.data;
    } catch (error) {
      console.error('getUnreadCount API error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat unread order count' };
    }
  },

  cancelOrderByCustomer: async (orderId) => {
    try {
      const response = await api.put(`/orders/${orderId}/cancel-customer`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal membatalkan pesanan' };
    } catch (error) {
      console.error('cancelOrderByCustomer API error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal membatalkan pesanan' };
    }
  },

  cancelOrderByOwner: async (orderId) => {
    try {
      const response = await api.put(`/orders/${orderId}/cancel-owner`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal membatalkan pesanan' };
    } catch (error) {
      console.error('cancelOrderByOwner API error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal membatalkan pesanan' };
    }
  },

  getCustomerUnreadCount: async () => {
    try {
      const response = await api.get('/orders/customer/unread-count');
      return response.data;
    } catch (error) {
      console.error('getCustomerUnreadCount API error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat unread count customer' };
    }
  }
};
