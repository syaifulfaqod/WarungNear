import React, { useEffect, useState } from 'react';
import MapView from '../components/MapView';
import StoreList from '../components/StoreList';
import { storeService } from '../services/storeService';
import useSearchStore from '../store/useSearchStore';
import { Navigation } from 'lucide-react';

const MapPage = () => {
  const { userLocation, setUserLocation } = useSearchStore();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState('');

  const fetchStores = async () => {
    if (userLocation.lat === null || userLocation.lng === null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await storeService.getNearbyStores(userLocation.lat, userLocation.lng, 10);
      if (response.success) {
        setStores(response.data);
      } else {
        console.error(response.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [userLocation]);

  const handleGetLocation = () => {
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('Browser Anda tidak mendukung geolokasi.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`📍 Updated coordinates via button: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
        setUserLocation({
          lat: latitude,
          lng: longitude,
          latitude,
          longitude,
          accuracy
        });
      },
      (error) => {
        console.error('GPS detection error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocError('Lokasi tidak aktif. Aktifkan izin lokasi untuk menemukan toko terdekat.');
        } else {
          setLocError('Gagal mendeteksi lokasi asli Anda. Coba lagi.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] animate-fadeIn"> {/* 64px is Navbar height */}
      
      {/* Sidebar List */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white border-r border-border h-1/2 lg:h-full order-2 lg:order-1 shadow-md">
        <div className="p-4 border-b border-border shadow-xs z-10 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Toko Terdekat</h2>
              <p className="text-sm text-gray-500">Menemukan {stores.length} toko di sekitar Anda</p>
            </div>
            <button
              onClick={handleGetLocation}
              className="bg-primary hover:bg-green-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm shrink-0"
              title="Perbarui koordinat dengan lokasi saat ini"
            >
              <Navigation className="w-3.5 h-3.5 fill-white" />
              Gunakan Lokasi Saya
            </button>
          </div>
          
          {locError && (
            <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs text-red-650 font-semibold leading-relaxed animate-pulse">
              ⚠️ {locError}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <StoreList stores={stores} loading={loading} />
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-1/2 lg:h-full order-1 lg:order-2 z-0">
        <MapView userLocation={userLocation} stores={stores} heightClassName="h-full" />
      </div>

    </div>
  );
};

export default MapPage;
