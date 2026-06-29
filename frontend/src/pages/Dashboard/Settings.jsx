import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { storeService } from '../../services/storeService';
import { storeImageService } from '../../services/storeImageService';
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

  // Store Images State
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

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
          setImages(response.data.images || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (images.length >= 3) {
      toast.error('Maksimal upload 3 foto toko.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file melebihi batas maksimal 5MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await storeImageService.uploadStoreImage(file);
      if (res.success) {
        setImages([...images, res.data]);
        toast.success('Foto toko berhasil diunggah!');
      } else {
        toast.error(res.message || 'Gagal mengunggah foto toko');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghubungi server untuk mengunggah gambar');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      const res = await storeImageService.setPrimaryStoreImage(imageId);
      if (res.success) {
        const updatedImages = images.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }));
        setImages(updatedImages);
        toast.success('Foto utama berhasil diubah!');
      } else {
        toast.error(res.message || 'Gagal mengubah foto utama');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghubungi server untuk mengubah foto utama');
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const res = await storeImageService.deleteStoreImage(imageId);
      if (res.success) {
        const storeRes = await storeService.getOwnerStore();
        if (storeRes.success && storeRes.data) {
          setImages(storeRes.data.images || []);
        } else {
          setImages(images.filter(img => img.id !== imageId));
        }
        toast.success('Foto berhasil dihapus!');
      } else {
        toast.error(res.message || 'Gagal menghapus foto toko');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghubungi server untuk menghapus foto');
    }
  };

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

      <div className="card bg-white p-6 rounded-xl border border-border">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <Store className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-text">Foto Toko</h2>
          </div>
          <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded-md">
            {images.length} / 3 Foto
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className={`relative rounded-xl overflow-hidden border ${img.is_primary ? 'border-primary ring-2 ring-primary/20' : 'border-border'} group aspect-video sm:aspect-square bg-gray-55 flex flex-col`}>
              <img 
                src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${img.image_url}`} 
                alt="Foto Toko" 
                className="w-full h-full object-cover"
              />
              
              <div className="absolute top-2 left-2">
                {img.is_primary ? (
                  <span className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    ⭐ Foto Utama
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.id)}
                    className="bg-white/90 hover:bg-white text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm hover:text-primary transition-colors cursor-pointer"
                  >
                    Jadikan Utama
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDeleteImage(img.id)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-650 text-white p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                title="Hapus Foto"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}

          {images.length < 3 && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-primary rounded-xl aspect-video sm:aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors p-4 group"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg,image/png,image/jpg,image/webp"
                className="hidden"
              />
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-gray-500 font-medium">Mengunggah...</span>
                </div>
              ) : (
                <>
                  <span className="text-2xl text-gray-400 group-hover:text-primary transition-colors">+</span>
                  <span className="text-xs text-gray-500 font-semibold mt-1 group-hover:text-primary transition-colors">Tambah Foto</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WEBP (Max 5MB)</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
