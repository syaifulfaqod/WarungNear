import React from 'react';
import { X, ShoppingCart, MapPin, MessageSquare, Phone } from 'lucide-react';
import { getImageUrl } from '../services/api';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import { useNavigate } from 'react-router-dom';

const ProductDetailModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  if (!isOpen || !product) return null;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  const getStatusColor = (stock) => {
    if (stock === 0) return 'bg-red-500 text-white';
    if (stock <= 5) return 'bg-amber-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  const formatWhatsAppNumber = (num) => {
    if (!num) return '';
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
  };

  const storeId = product.store_id || product.storeId || product.store?.id;
  const storeName = product.storeName || product.store?.name || 'Toko';
  const whatsappNum = product.store?.phoneNumber;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-border flex flex-col relative animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-700 hover:text-black p-2 rounded-full transition-colors z-10 shadow-sm border border-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="h-64 relative bg-gray-100">
          <img 
            src={getImageUrl(product.image)} 
            alt={product.name} 
            className="w-full h-full object-cover" 
          />
          <div className={`absolute top-4 left-4 text-xs font-extrabold px-3 py-1.5 rounded-full shadow-md ${getStatusColor(product.stock)}`}>
            {product.stock === 0 ? 'Habis' : (product.stock <= 5 ? 'Stok Menipis' : 'Tersedia')}
          </div>
        </div>

        {/* Product Details Content */}
        <div className="p-6 space-y-4">
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{product.category}</span>
            <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mt-1">{product.name}</h2>
            <p className="text-2xl font-black text-primary mt-2">{formatRupiah(product.price)}</p>
          </div>

          <div className="border-t border-b border-gray-100 py-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ketersediaan Stok</span>
              <span className="font-bold text-gray-800">{product.stock} pcs</span>
            </div>
            {storeName && (
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500">Toko Penjual</span>
                <span 
                  onClick={() => {
                    onClose();
                    navigate(`/store/${storeId}`);
                  }}
                  className="font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  {storeName}
                </span>
              </div>
            )}
          </div>

          {/* Buttons Area */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(e);
                onClose();
              }}
              disabled={product.stock === 0}
              className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              {product.stock === 0 ? 'Stok Habis' : 'Tambah Ke Keranjang'}
            </button>

            {/* WhatsApp option for Customer role only */}
            {(!user || user.role?.toUpperCase() === 'CUSTOMER') && (
              <div className="w-full">
                {whatsappNum ? (
                  <a
                    href={`https://wa.me/${formatWhatsAppNumber(whatsappNum)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs shadow-xs"
                  >
                    <Phone className="w-4 h-4 text-white fill-white" />
                    Hubungi Toko via WhatsApp
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 text-gray-400 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs cursor-not-allowed"
                  >
                    <Phone className="w-4 h-4" />
                    No WhatsApp Toko Tidak Tersedia
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
