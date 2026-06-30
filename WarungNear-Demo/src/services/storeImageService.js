import api from './api';

export const storeImageService = {
  /**
   * Upload store photo.
   * @param {File} file - Store image file
   */
  uploadStoreImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/store/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message || 'Gagal mengunggah foto toko' };
    } catch (error) {
      console.error('uploadStoreImage error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal mengunggah foto toko' };
    }
  },

  /**
   * Delete store photo.
   * @param {number} id - Store image ID
   */
  deleteStoreImage: async (id) => {
    try {
      const response = await api.delete(`/store/images/${id}`);
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message || 'Gagal menghapus foto toko' };
    } catch (error) {
      console.error('deleteStoreImage error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal menghapus foto toko' };
    }
  },

  /**
   * Set store photo as primary.
   * @param {number} id - Store image ID
   */
  setPrimaryStoreImage: async (id) => {
    try {
      const response = await api.patch(`/store/images/${id}/primary`);
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message || 'Gagal mengubah foto utama' };
    } catch (error) {
      console.error('setPrimaryStoreImage error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal mengubah foto utama' };
    }
  }
};
