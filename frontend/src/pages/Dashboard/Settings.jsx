import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { storeService } from '../../services/storeService';
import { Clock, Store } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Fix for default Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Store location icon (green)
const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to change map focus dynamically
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

// Helper component to capture map click events
const MapEventsHandler = ({ onClick }) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    }
  });
  return null;
};

const Settings = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('-7.27'); // default Surabaya as string
  const [longitude, setLongitude] = useState('112.74');
  const [openTime, setOpenTime] = useState('07:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Draggable marker handlers
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latlng = marker.getLatLng();
          setLatitude(latlng.lat.toString());
          setLongitude(latlng.lng.toString());
        }
      },
    }),
    []
  );

  const position = useMemo(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
    return [-7.27, 112.74]; // default Surabaya
  }, [latitude, longitude]);

  const handleMapClick = (latlng) => {
    setLatitude(latlng.lat.toString());
    setLongitude(latlng.lng.toString());
  };

  const handleGetMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          toast.success('Lokasi berhasil diambil dari GPS browser!');
        },
        (error) => {
          console.error(error);
          toast.error('Gagal mengambil lokasi GPS: ' + error.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolokasi tidak didukung oleh browser ini.');
    }
  };

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await storeService.getOwnerStore();
        if (response.success && response.data) {
          setName(response.data.name);
          setAddress(response.data.address);
          setLatitude(response.data.latitude.toString());
          setLongitude(response.data.longitude.toString());
          setOpenTime(response.data.open_time || '07:00');
          setCloseTime(response.data.close_time || '22:00');
          setPhoneNumber(response.data.phoneNumber || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !address || !openTime || !closeTime) {
      setError('Nama Toko, Alamat, Jam Buka, dan Jam Tutup wajib diisi');
      return;
    }

    const indonesianPhoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/;
    if (phoneNumber && !indonesianPhoneRegex.test(phoneNumber)) {
      setError('Format nomor WhatsApp tidak valid. Gunakan format Indonesia (contoh: 08123456789 atau +628123456789)');
      return;
    }

    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setError('Latitude dan Longitude wajib berupa angka desimal valid');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await storeService.saveOwnerStore({
        name,
        address,
        latitude: parsedLat,
        longitude: parsedLng,
        open_time: openTime,
        close_time: closeTime,
        phoneNumber
      });

      if (response.success) {
        setSuccess('Profil toko berhasil disimpan!');
        toast.success('Profil toko berhasil disimpan!');
      } else {
        setError(response.message || 'Gagal menyimpan profil toko');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menghubungi server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600 font-semibold">Memuat profil toko...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pengaturan Toko</h1>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}

      <div className="card bg-white p-6 rounded-xl border border-border">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center space-x-3 border-b border-border pb-4 mb-4">
            <Store className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-text">Informasi Warung / Toko</h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-1">Nama Toko</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Warung Berkah Abadi"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-1">Alamat Lengkap</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Jl. Raya Indah No. 45, Surabaya"
              rows="3"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-1">Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. -7.2756"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-1">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 112.7381"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-text">Peta Lokasi Toko</label>
              <button
                type="button"
                onClick={handleGetMyLocation}
                className="text-xs font-bold text-primary hover:text-green-700 flex items-center gap-1 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200 transition-colors cursor-pointer"
              >
                📍 Ambil Lokasi Saya (GPS)
              </button>
            </div>
            <div className="w-full h-72 rounded-xl overflow-hidden border border-border z-0">
              <MapContainer 
                center={position} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeView center={position} zoom={15} />
                <MapEventsHandler onClick={handleMapClick} />
                <Marker 
                  position={position} 
                  draggable={true} 
                  eventHandlers={eventHandlers} 
                  ref={markerRef}
                  icon={storeIcon}
                >
                  <Popup>
                    <span className="font-semibold text-xs">Lokasi Toko Anda</span>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <p className="text-xs text-gray-400">
              * Anda bisa mengeklik area di peta atau menggeser marker hijau untuk memindahkan posisi toko.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-1">Nomor WhatsApp Toko</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 08123456789"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Gunakan format Indonesia (contoh: 08123456789 atau +628123456789).</p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-text">Jam Operasional</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Jam Buka</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Jam Tutup</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2.5 rounded-lg font-bold text-white transition-colors text-sm ${
                saving ? 'bg-green-300 cursor-not-allowed' : 'bg-primary hover:bg-green-700'
              }`}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
