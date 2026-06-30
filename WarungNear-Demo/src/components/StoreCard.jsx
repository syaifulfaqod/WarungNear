import React from 'react';
import { MapPin, Clock, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const StoreCard = ({ store }) => {
  return (
    <div id="tour-store-card" className="card hover:shadow-md transition-shadow flex flex-col sm:flex-row h-full sm:h-auto overflow-hidden p-0">
      <div className="sm:w-48 h-48 sm:h-auto relative">
        <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
        {!store.isOpen && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg bg-red-500 px-3 py-1 rounded">TUTUP</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-text">{store.name}</h3>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                store.isOpen 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-750 border-red-200'
              }`}>
                {store.isOpen ? '🟢 Buka' : '🔴 Tutup'}
              </span>
            </div>
          </div>
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-green-200">
            {store.distanceLabel}
          </span>
        </div>
        
        <div className="mt-3 space-y-2 text-sm text-gray-600 flex-grow">
          <div className="flex items-start">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{store.address}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>
              {store.openTime && store.closeTime ? `${store.openTime} - ${store.closeTime}` : 'Jam operasional belum tersedia'}
            </span>
          </div>
          <div className="flex items-center">
            <Package className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{store.productCount} produk tersedia</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border flex justify-end">
          <Link to={`/store/${store.id}`} className="btn-secondary w-full text-center sm:w-auto">
            Lihat Detail
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;
