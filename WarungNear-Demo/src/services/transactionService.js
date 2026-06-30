import api from './api';

const transformTransaction = (trx) => {
  return {
    id: `TRX-${trx.id}`,
    date: trx.created_at || new Date().toISOString(),
    total: trx.total,
    status: 'Sukses',
    items: (trx.details || []).map(d => ({
      productId: d.product_id,
      name: d.product?.name || 'Produk',
      quantity: d.quantity,
      price: d.price
    }))
  };
};

export const transactionService = {
  getTransactions: async () => {
    try {
      const response = await api.get('/transactions');
      if (response.data.success) {
        const mapped = response.data.data.map(transformTransaction);
        return { success: true, data: mapped };
      }
      return { success: false, message: response.data.message || 'Gagal memuat transaksi' };
    } catch (error) {
      console.error('getTransactions error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat transaksi' };
    }
  },

  createTransaction: async (items, total) => {
    try {
      // Map frontend items format to backend format expected by transactionCreateSchema
      const backendItems = items.map(item => ({
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price)
      }));

      const response = await api.post('/transactions', {
        items: backendItems,
        total: parseFloat(total)
      });

      if (response.data.success) {
        const mapped = transformTransaction(response.data.data);
        return { success: true, data: mapped };
      }
      return { success: false, message: response.data.message || 'Gagal membuat transaksi' };
    } catch (error) {
      console.error('createTransaction error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal membuat transaksi' };
    }
  }
};
