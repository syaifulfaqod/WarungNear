import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, ToggleLeft, ToggleRight, MapPin, Clock, User, ShieldAlert, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const AdminStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const fetchStores = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/stores');
      if (response.data.success) {
        setStores(response.data.data);
      } else {
        setError(response.data.message || 'Gagal memuat manajemen toko');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleToggleStore = async (store) => {
    const nextStateText = store.isActive ? 'menonaktifkan' : 'mengaktifkan kembali';
    if (!window.confirm(`Apakah Anda yakin ingin ${nextStateText} Toko ${store.name}?`)) {
      return;
    }

    setTogglingId(store.id);
    try {
      const response = await api.put(`/admin/stores/${store.id}/toggle`);
      if (response.data.success) {
        toast.success(`Toko ${store.name} berhasil ${store.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
        setStores(prev => prev.map(s => s.id === store.id ? { ...s, isActive: !store.isActive } : s));
      } else {
        toast.error(response.data.message || 'Gagal memperbarui status toko');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan pada server.');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (store.owner?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[calc(100vh-150px)]">
        <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Memuat data toko kelontong...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Toko Kelontong</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola dan pantau seluruh warung/toko terdaftar di sistem WarungNear</p>
        </div>
        <button
          onClick={fetchStores}
          className="p-2 border border-gray-250 rounded-xl hover:bg-gray-50 text-gray-650 transition-colors self-end sm:self-auto"
          title="Segarkan data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-750 px-4 py-3 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari berdasarkan nama toko, pemilik, atau alamat..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Grid of Stores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.length === 0 ? (
          <div className="lg:col-span-3 md:col-span-2 bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-450 font-bold">
            Tidak ada toko ditemukan
          </div>
        ) : (
          filteredStores.map(store => {
            const storeImage = store.images?.find(img => img.is_primary) || store.images?.[0];
            const imageUrl = storeImage 
              ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${storeImage.image_url}` 
              : 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800';

            return (
              <div key={store.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-3xs flex flex-col justify-between hover:shadow-sm transition-all group">
                <div>
                  {/* Photo cover */}
                  <div className="h-44 w-full relative bg-gray-100 overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={store.name} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800';
                      }}
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm ${
                        store.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {store.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800 line-clamp-1">{store.name}</h3>
                      <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </p>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="space-y-2 text-xs font-semibold text-slate-700">
                      {/* Owner */}
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="truncate">Owner: {store.owner?.name} ({store.owner?.email})</span>
                      </div>

                      {/* Operation hours */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>Buka: {store.open_time} - {store.close_time}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-gray-100 bg-gray-50/30">
                  <span className="text-xs text-gray-400 font-bold">Suspensi Toko:</span>
                  <button
                    onClick={() => handleToggleStore(store)}
                    disabled={togglingId === store.id}
                    className="focus:outline-none cursor-pointer"
                  >
                    {store.isActive ? (
                      <ToggleRight className="w-9 h-9 text-green-600 hover:text-green-700 transition-colors" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-gray-300 hover:text-gray-400 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminStores;
