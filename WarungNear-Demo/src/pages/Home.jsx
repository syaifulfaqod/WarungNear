import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Store, ShoppingBag, ShieldCheck } from 'lucide-react';
import useSearchStore from '../store/useSearchStore';
import { categories } from '../data/products';
import { storeService } from '../services/storeService';
import CategoryCard from '../components/CategoryCard';
import StoreList from '../components/StoreList';
import ErrorAlert from '../components/ErrorAlert';

const Home = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const { setSearchKeyword, setCategoryFilter, userLocation } = useSearchStore();
  
  const [nearbyStores, setNearbyStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [error, setError] = useState('');

  const fetchStores = async () => {
    if (userLocation.lat === null || userLocation.lng === null) {
      setLoadingStores(false);
      return;
    }
    setLoadingStores(true);
    setError('');
    try {
      const response = await storeService.getNearbyStores(userLocation.lat, userLocation.lng, 5);
      if (response.success) {
        setNearbyStores(response.data.slice(0, 3)); // Only show top 3
      } else {
        setError(response.message || 'Gagal memuat toko terdekat');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError('Koneksi terputus. Pastikan server backend Anda berjalan.');
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [userLocation]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      setSearchKeyword(keyword);
      navigate('/search');
    }
  };

  const handleCategoryClick = (category) => {
    setCategoryFilter(category);
    navigate('/search');
  };

  const categoryIcons = {
    "Semua": <ShoppingBag />,
    "Makanan": "🍜",
    "Minuman": "🥤",
    "Sembako": "🍚",
    "Kebersihan": "🧼",
    "Kesehatan": "💊"
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary pt-16 pb-24 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Cari Barang Terdekat<br />Dengan Stok yang Tersedia
          </h1>
          <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
            WarungNear membantu Anda menemukan ketersediaan barang di toko kelontong atau warung di sekitar Anda tanpa harus keliling mencari.
          </p>
          
          <div className="bg-white p-2 rounded-2xl shadow-lg max-w-2xl mx-auto flex items-center">
            <div className="flex-1 flex items-center px-4 border-r border-gray-200">
              <Search className="text-gray-400 w-5 h-5 mr-2" />
              <form onSubmit={handleSearch} className="flex-1">
                <input 
                  type="text" 
                  placeholder="Contoh: Indomie Goreng, Beras..." 
                  className="w-full py-3 focus:outline-none text-gray-700"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </form>
            </div>
            <button 
              onClick={handleSearch}
              className="bg-accent hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Cari
            </button>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute top-1/2 -right-24 w-64 h-64 rounded-full bg-white"></div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Categories Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Kategori Barang</h2>
              <p className="text-gray-500">Pilih kategori untuk pencarian cepat</p>
            </div>
          </div>
          <div className="flex overflow-x-auto pb-4 space-x-4 hide-scrollbar">
            {categories.map(cat => (
              <CategoryCard 
                key={cat} 
                title={cat} 
                icon={categoryIcons[cat] || <ShoppingBag />} 
                onClick={() => handleCategoryClick(cat)}
              />
            ))}
          </div>
        </section>

        {/* Nearby Stores Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Toko Terdekat</h2>
              <p className="text-gray-500">Warung di sekitar lokasi Anda</p>
            </div>
            <button 
              onClick={() => navigate('/map')}
              className="text-primary font-medium hover:underline flex items-center"
            >
              Lihat Semua <MapPin className="w-4 h-4 ml-1" />
            </button>
          </div>
          {error ? (
            <ErrorAlert message={error} onRetry={fetchStores} />
          ) : (
            <StoreList stores={nearbyStores} loading={loadingStores} />
          )}
        </section>

        {/* How it works Section */}
        <section className="bg-green-50 rounded-2xl p-8 mb-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Cara Kerja WarungNear</h2>
            <p className="text-gray-500">Tiga langkah mudah temukan barang kebutuhanmu</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-primary mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">1. Cari Barang</h3>
              <p className="text-gray-600">Ketik nama barang yang sedang Anda cari di kotak pencarian.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-primary mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">2. Temukan Toko</h3>
              <p className="text-gray-600">Sistem akan mencari warung terdekat yang memiliki stok barang tersebut.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-primary mb-4">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">3. Datangi & Beli</h3>
              <p className="text-gray-600">Datangi toko menggunakan panduan peta dan beli barang tanpa takut kehabisan.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;
