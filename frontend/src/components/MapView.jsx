import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix for default Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// User location icon (blue)
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Store location icon (green)
const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map when location changes
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const MapView = ({ userLocation, stores, heightClassName = 'h-[400px]' }) => {
  const defaultCenter = [userLocation?.lat || -7.27, userLocation?.lng || 112.74];
  
  return (
    <div className={`${heightClassName} w-full rounded-xl overflow-hidden shadow-sm border border-border z-0 relative`}>
      <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={false} className="h-full w-full">
        <ChangeView center={defaultCenter} zoom={13} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Marker */}
        {userLocation && userLocation.lat !== null && userLocation.lng !== null && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-center font-bold">Lokasi Anda</div>
            </Popup>
          </Marker>
        )}
        
        {/* Store Markers */}
        {stores && stores.map(store => (
          <Marker key={store.id} position={[store.lat, store.lng]} icon={storeIcon}>
            <Popup>
              <div className="w-48">
                <img src={store.image} alt={store.name} className="w-full h-24 object-cover rounded-t mb-2" />
                <h4 className="font-bold text-sm mb-0.5">{store.name}</h4>
                <div className="text-[10px] font-bold mb-1.5 flex items-center gap-1">
                  {store.isOpen ? (
                    <span className="text-green-600 font-extrabold bg-green-50 px-1.5 py-0.5 rounded border border-green-150">🟢 Buka {store.openTime} - {store.closeTime}</span>
                  ) : (
                    <span className="text-red-600 font-extrabold bg-red-55/10 px-1.5 py-0.5 rounded border border-red-200">
                      🔴 Tutup {store.openTime && store.closeTime ? `(Buka ${store.openTime} - ${store.closeTime})` : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-2">{store.address}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-primary">{store.distanceLabel}</span>
                  <Link to={`/store/${store.id}`} className="text-xs bg-primary text-white px-2 py-1 rounded">Detail</Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
