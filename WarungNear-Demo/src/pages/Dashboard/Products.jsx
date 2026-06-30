import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import useProductStore from '../../store/useProductStore';
import { productOwnerService } from '../../services/productOwnerService';
import ProductForm from '../../components/ProductForm';
import ErrorAlert from '../../components/ErrorAlert';
import { getImageUrl } from '../../services/api';


const Products = () => {
  const { products, setProducts, loading, setLoading, addProduct, updateProduct, deleteProduct } = useProductStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productOwnerService.getProducts();
      if (response.success) {
        setProducts(response.data);
      } else {
        setError(response.message || 'Gagal memuat produk');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data produk. Hubungi server backend Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingProduct) {
        const response = await productOwnerService.updateProduct(editingProduct.id, formData);
        if (response.success) {
          const updated = response.data;
          let status = 'Tersedia';
          if (updated.stock === 0) status = 'Habis';
          else if (updated.stock <= 5) status = 'Stok menipis';
          updateProduct(editingProduct.id, { ...updated, status });
        }
      } else {
        const response = await productOwnerService.addProduct(formData);
        if (response.success) {
          const added = response.data;
          let status = 'Tersedia';
          if (added.stock === 0) status = 'Habis';
          else if (added.stock <= 5) status = 'Stok menipis';
          addProduct({ ...added, status });
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        const response = await productOwnerService.deleteProduct(id);
        if (response.success) {
          deleteProduct(id);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center justify-center">
          <Plus className="w-5 h-5 mr-2" />
          Tambah Produk
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari nama produk..." 
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-100 text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-3">Produk</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3">Harga</th>
                <th className="px-6 py-3">Stok</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading products...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4">
                    <ErrorAlert message={error} onRetry={fetchProducts} />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Tidak ada produk ditemukan.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center">
                      <img src={getImageUrl(product.image)} alt={product.name} className="w-12 h-12 rounded object-cover mr-3 border border-gray-200" />
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </td>
                    <td className="px-6 py-4">{product.category}</td>
                    <td className="px-6 py-4 font-semibold text-primary">{formatRupiah(product.price)}</td>
                    <td className="px-6 py-4">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        product.stock === 0 ? 'bg-red-100 text-red-700' : 
                        product.stock <= 5 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {product.stock === 0 ? 'Habis' : product.stock <= 5 ? 'Menipis' : 'Aman'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:text-blue-800 p-1 mr-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmit={handleSubmit} 
        initialData={editingProduct} 
      />
    </div>
  );
};

export default Products;
