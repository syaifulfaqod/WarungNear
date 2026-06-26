import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, ArrowLeft } from 'lucide-react';
import { storeService } from '../services/storeService';
import { productService } from '../services/productService';
import ProductGrid from '../components/ProductGrid';
import MapView from '../components/MapView';
import ErrorAlert from '../components/ErrorAlert';
import useAuthStore from '../store/useAuthStore';
import useSearchStore from '../store/useSearchStore';
import useChatStore from '../store/useChatStore';


const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useAuthStore();
  const { userLocation } = useSearchStore();

  const formatWhatsAppNumber = (num) => {
    if (!num) return '';
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
  };

  const fetchStoreData = async () => {
    setLoading(true);
    setError('');
    try {
      const storeResponse = await storeService.getStoreById(id);
      if (storeResponse.success) {
        setStore(storeResponse.data);
      } else {
        setError(storeResponse.message || 'Toko tidak ditemukan');
        return;
      }
      
      const productsResponse = await productService.getStoreProducts(id);
      if (productsResponse.success) {
        setProducts(productsResponse.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data toko. Hubungi server backend Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStoreData();
    }
  }, [id]);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-64 bg-gray-200 rounded-xl mb-8"></div>
        <div className="h-8 w-1/3 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-1/4 bg-gray-200 rounded mb-8"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(n => <div key={n} className="h-64 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </button>
        <ErrorAlert message={error} onRetry={fetchStoreData} />
      </div>
    );
  }

  if (!store) return <div className="text-center py-20">Toko tidak ditemukan</div>;

  const openTime = store.openTime;
  const closeTime = store.closeTime;
  const isOpen = store.isOpen;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-600 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
      </button>

      {/* Store Header Info */}
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden mb-8">
        <div className="h-48 md:h-64 w-full relative">
          <img src={store.image || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800'} alt={store.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-6 text-white w-full">
              <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm items-center">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {store.address}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {openTime && closeTime ? `${openTime} - ${closeTime}` : 'Jam operasional belum tersedia'}
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {isOpen ? '🟢 Buka' : '🔴 Tutup'}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {store.lat !== undefined && store.lng !== undefined && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all border border-white/20 shadow-sm"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                    Navigasi ke Toko
                  </a>
                )}
                {store.phoneNumber && (
                  <a
                    href={`https://wa.me/${formatWhatsAppNumber(store.phoneNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm"
                  >
                    <span className="w-3.5 h-3.5">💬</span>
                    Hubungi WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Products Grid */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-border pb-2">Produk Tersedia</h2>
          <ProductGrid products={products} loading={loading} />
        </div>

        {/* Sidebar Info (Map) */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-border pb-2">Lokasi Peta</h2>
          <MapView 
            userLocation={userLocation}
            stores={[store]} 
          />
        </div>
      </div>
    </div>
  );
};

export default StoreDetail;
