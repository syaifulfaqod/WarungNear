import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import useSearchStore from '../store/useSearchStore';
import { productService } from '../services/productService';
import ProductGrid from '../components/ProductGrid';
import { categories } from '../data/products';
import ErrorAlert from '../components/ErrorAlert';


const SearchResult = () => {
  const { 
    searchKeyword, setSearchKeyword, 
    categoryFilter, setCategoryFilter,
    sortBy, setSortBy 
  } = useSearchStore();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localKeyword, setLocalKeyword] = useState(searchKeyword);

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productService.getProducts({
        keyword: searchKeyword,
        category: categoryFilter,
        sortBy: sortBy,
        maxDistance: 5 // Default distance filter
      });
      if (response.success) {
        setProducts(response.data);
      } else {
        setError(response.message || 'Gagal memuat produk');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat produk. Pastikan server backend Anda berjalan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [searchKeyword, categoryFilter, sortBy]);

  useEffect(() => {
    const handleStockUpdate = (e) => {
      const data = e.detail;
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === data.product_id ? { ...p, stock: data.stock } : p
        )
      );
    };

    window.addEventListener('stock:update', handleStockUpdate);
    return () => {
      window.removeEventListener('stock:update', handleStockUpdate);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchKeyword(localKeyword);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-border mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              value={localKeyword}
              onChange={(e) => setLocalKeyword(e.target.value)}
              placeholder="Cari barang..." 
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <button type="submit" className="btn-primary flex items-center">
            Cari
          </button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-border">
            <div className="flex items-center mb-4 pb-2 border-b border-border">
              <Filter className="w-5 h-5 mr-2 text-primary" />
              <h3 className="font-bold text-lg">Filter</h3>
            </div>
            
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm text-gray-700">Kategori</h4>
              <div className="space-y-2">
                {categories.map(cat => (
                  <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="category" 
                      checked={categoryFilter === cat}
                      onChange={() => setCategoryFilter(cat)}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm text-gray-700">Urutkan Berdasarkan</h4>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="Terdekat">Terdekat</option>
                <option value="Harga termurah">Harga termurah</option>
                <option value="Stok terbanyak">Stok terbanyak</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Hasil Pencarian {searchKeyword && `untuk "${searchKeyword}"`}
            </h2>
            <span className="text-sm text-gray-500">{products.length} produk ditemukan</span>
          </div>
          
          {error ? (
            <ErrorAlert message={error} onRetry={fetchResults} />
          ) : (
            <ProductGrid products={products} loading={loading} />
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResult;
