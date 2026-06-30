import api from './api';

export const dashboardService = {
  getSalesAnalytics: async (filters = {}) => {
    try {
      const params = {};
      if (filters.period) params.period = filters.period;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/dashboard/sales', { params });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal memuat data analisis penjualan' };
    } catch (error) {
      console.error('getSalesAnalytics error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat data analisis penjualan' };
    }
  }
};
