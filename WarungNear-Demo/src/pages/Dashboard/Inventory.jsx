import React, { useState, useEffect } from 'react';
import useProductStore from '../../store/useProductStore';
import { productOwnerService } from '../../services/productOwnerService';
import ErrorAlert from '../../components/ErrorAlert';
import { getImageUrl } from '../../services/api';


const Inventory = () => {
  const { products, setProducts, loading, setLoading, updateProduct } = useProductStore();
  const [filter, setFilter] = useState('Semua'); // Semua, Aman, Menipis, Habis
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productOwnerService.getProducts();
      if (response.success) {
        setProducts(response.data);
      } else {
        setError(response.message || 'Gagal memuat inventori');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data inventori. Hubungi server backend Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getStatus = (stock) => {
    if (stock === 0) return 'Habis';
    if (stock <= 5) return 'Menipis';
    return 'Aman';
  };

  const filteredProducts = products.filter(p => {
    const status = getStatus(p.stock);
    if (filter === 'Semua') return true;
    return status === filter;
  });

  const handleStockUpdate = async (id, currentStock, change) => {
    const newStock = Math.max(0, currentStock + change);
    try {
      const response = await productOwnerService.updateProduct(id, { stock: newStock });
      if (response.success) {
        updateProduct(id, { stock: newStock });
      }
    } catch (error) {
      console.error("Failed to update stock:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Inventori</h1>
        
        <div className="flex space-x-2">
          {['Semua', 'Aman', 'Menipis', 'Habis'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === f ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-border hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-100 text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-3">Produk</th>
                <th className="px-6 py-3 text-center">Stok Saat Ini</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Penyesuaian Manual</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading inventory...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4">
                    <ErrorAlert message={error} onRetry={fetchProducts} />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Tidak ada produk dengan status {filter}.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStatus(product.stock);
                  return (
                    <tr key={product.id} className="border-b border-border hover:bg-gray-50">
                      <td className="px-6 py-4 flex items-center">
                        <img src={getImageUrl(product.image)} alt={product.name} className="w-10 h-10 rounded object-cover mr-3 border border-gray-200" />
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-lg text-gray-900">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          status === 'Habis' ? 'bg-red-100 text-red-700' : 
                          status === 'Menipis' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center border border-border rounded-lg p-1 bg-white">
                          <button 
                            onClick={() => handleStockUpdate(product.id, product.stock, -1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{product.stock}</span>
                          <button 
                            onClick={() => handleStockUpdate(product.id, product.stock, 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-green-500 hover:bg-green-50 rounded"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
