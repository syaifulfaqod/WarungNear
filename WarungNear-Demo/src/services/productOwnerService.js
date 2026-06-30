import api from './api';

export const productOwnerService = {
  getProducts: async () => {
    try {
      const response = await api.get('/products');
      if (response.data.success) {
        // Map backend products to dashboard format (including status calculated from stock)
        const mapped = response.data.data.map(p => {
          const stock = p.stock;
          let status = 'Tersedia';
          if (stock === 0) status = 'Habis';
          else if (stock <= 5) status = 'Stok menipis';
          
          return {
            id: p.id,
            name: p.name,
            category: p.category,
            category_id: p.category_id,
            price: p.price,
            stock: p.stock,
            status: status,
            image: p.image || 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
          };
        });
        return { success: true, data: mapped };
      }
      return { success: false, message: response.data.message || 'Gagal memuat produk' };
    } catch (error) {
      console.error('owner getProducts error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat produk owner' };
    }
  },
  
  addProduct: async (productData) => {
    try {
      const response = await api.post('/products', {
        name: productData.name,
        category: productData.category,
        category_id: productData.category_id,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
        image: productData.image || ''
      });
      if (response.data.success) {
        const p = response.data.data;
        const stock = p.stock;
        let status = 'Tersedia';
        if (stock === 0) status = 'Habis';
        else if (stock <= 5) status = 'Stok menipis';
        
        return {
          success: true,
          data: {
            id: p.id,
            name: p.name,
            category: p.category,
            category_id: p.category_id,
            price: p.price,
            stock: p.stock,
            status: status,
            image: p.image || 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
          }
        };
      }
      return { success: false, message: response.data.message || 'Gagal menambahkan produk' };
    } catch (error) {
      console.error('owner addProduct error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal menambahkan produk' };
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const payload = {};
      if (productData.name) payload.name = productData.name;
      if (productData.category) payload.category = productData.category;
      if (productData.category_id !== undefined) payload.category_id = productData.category_id;
      if (productData.price !== undefined) payload.price = parseFloat(productData.price);
      if (productData.stock !== undefined) payload.stock = parseInt(productData.stock);
      if (productData.image !== undefined) payload.image = productData.image;

      const response = await api.put(`/products/${id}`, payload);
      if (response.data.success) {
        const p = response.data.data;
        const stock = p.stock;
        let status = 'Tersedia';
        if (stock === 0) status = 'Habis';
        else if (stock <= 5) status = 'Stok menipis';
        
        return {
          success: true,
          data: {
            id: p.id,
            name: p.name,
            category: p.category,
            category_id: p.category_id,
            price: p.price,
            stock: p.stock,
            status: status,
            image: p.image || 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
          }
        };
      }
      return { success: false, message: response.data.message || 'Gagal mengupdate produk' };
    } catch (error) {
      console.error('owner updateProduct error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal mengupdate produk' };
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      if (response.data.success) {
        return { success: true, data: { id } };
      }
      return { success: false, message: response.data.message || 'Gagal menghapus produk' };
    } catch (error) {
      console.error('owner deleteProduct error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal menghapus produk' };
    }
  }
};
