import api from './api';

export const categoryService = {
  /**
   * Get all categories for the logged-in owner's store
   */
  getCategories: async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal memuat kategori' };
    } catch (error) {
      console.error('getCategories error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat kategori' };
    }
  },

  /**
   * Create a new category
   */
  createCategory: async (name) => {
    try {
      const response = await api.post('/categories', { name });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal membuat kategori' };
    } catch (error) {
      console.error('createCategory error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal membuat kategori' };
    }
  },

  /**
   * Update category name
   */
  updateCategory: async (id, name) => {
    try {
      const response = await api.put(`/categories/${id}`, { name });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal memperbarui kategori' };
    } catch (error) {
      console.error('updateCategory error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memperbarui kategori' };
    }
  },

  /**
   * Delete category (protected by backend if in use)
   */
  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal menghapus kategori' };
    } catch (error) {
      console.error('deleteCategory error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal menghapus kategori' };
    }
  }
};
