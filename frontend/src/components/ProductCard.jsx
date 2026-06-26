import React, { useState } from 'react';
import { MapPin, Package, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../services/api';
import ProductDetailModal from './ProductDetailModal';

const ProductCard = ({ product }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Tersedia': return 'bg-success text-white';
      case 'Stok menipis': return 'bg-accent text-white';
      case 'Habis': return 'bg-error text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Normalize store fields to prevent mismatch
    const productToAdd = {
      ...product,
      store_id: product.store_id || product.storeId,
      storeName: product.storeName || product.store?.name || 'Toko Kelontong'
    };

    const cartStore = useCartStore.getState();
    const result = cartStore.addItem(productToAdd);

    if (result.error === 'different_store') {
      const confirmClear = window.confirm(
        `Keranjang Anda sudah berisi barang dari "${result.existingStoreName}".\n\nApakah Anda ingin mengosongkan keranjang untuk berbelanja di "${productToAdd.storeName}"?`
      );
      if (confirmClear) {
        cartStore.clearCart();
        cartStore.addItem(productToAdd);
        toast.success(`Keranjang direset. ${product.name} berhasil ditambahkan!`);
      }
    } else if (result.success) {
      toast.success(`${product.name} dimasukkan ke keranjang.`);
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsDetailOpen(true)}
        className="card overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full p-0 cursor-pointer"
      >
        <div className="relative h-48 overflow-hidden">
          <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full shadow-sm ${getStatusColor(product.stock === 0 ? 'Habis' : (product.stock <= 5 ? 'Stok menipis' : 'Tersedia'))}`}>
            {product.stock === 0 ? 'Habis' : (product.stock <= 5 ? 'Stok menipis' : 'Tersedia')}
          </div>
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <div className="text-xs text-gray-500 mb-1">{product.category}</div>
          <h3 className="font-semibold text-text text-lg line-clamp-2">{product.name}</h3>
          <p className="text-primary font-bold text-xl my-2">{formatRupiah(product.price)}</p>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-2" />
              <span>Stok: {product.stock}</span>
            </div>
            {(product.storeName || product.store?.name) && (
              <Link 
                to={`/store/${product.store_id || product.storeId}`} 
                className="flex items-center hover:text-primary transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <MapPin className="w-4 h-4 mr-2" />
                <span className="truncate">{product.storeName || product.store?.name}</span>
              </Link>
            )}
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="mt-4 w-full bg-primary hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 text-xs disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {product.stock === 0 ? 'Stok Habis' : 'Tambah Ke Keranjang'}
          </button>
        </div>
      </div>

      <ProductDetailModal 
        product={product} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        onAddToCart={handleAddToCart} 
      />
    </>
  );
};

export default ProductCard;
