import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Store } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import { getImageUrl } from '../services/api';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, storeName, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Keranjang Belanja Kosong</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          Anda belum menambahkan barang apapun ke dalam keranjang belanja.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center bg-primary hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg gap-2"
        >
          Cari Barang Sekarang
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Keranjang Belanja</h1>
          <div className="flex items-center text-sm text-gray-500 mt-2 gap-1.5">
            <Store className="w-4 h-4 text-primary" />
            <span>Memesan dari:</span>
            <span className="font-semibold text-gray-700">{storeName}</span>
          </div>
        </div>
        <button
          onClick={clearCart}
          className="text-red-500 hover:text-red-700 font-semibold text-sm transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Kosongkan Keranjang
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow gap-4"
            >
              {/* Product Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/100x100?text=Barang';
                      }}
                    />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 mb-1">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-gray-800 text-base truncate">{item.name}</h3>
                  <p className="text-primary font-bold text-sm mt-1">
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Quantity Controls & Delete */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary transition-colors hover:bg-white rounded-lg"
                    aria-label="Kurangi kuantitas"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-gray-700 text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary transition-colors hover:bg-white rounded-lg"
                    aria-label="Tambah kuantitas"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Hapus barang"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
            <h3 className="font-bold text-lg text-gray-800 mb-4 pb-4 border-b border-gray-100">
              Ringkasan Belanja
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total Barang</span>
                <span className="font-semibold text-gray-800">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)} item
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Metode Penyerahan</span>
                <span className="font-semibold text-primary">Ambil di Warung</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Biaya Layanan</span>
                <span className="font-semibold text-emerald-600">Gratis</span>
              </div>
              <div className="border-t border-dashed border-gray-150 pt-3 flex justify-between items-center">
                <span className="font-semibold text-gray-800">Total Harga</span>
                <span className="text-xl font-extrabold text-primary">
                  Rp {getTotal().toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base"
            >
              Lanjut ke Checkout
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
              Setelah checkout, pemilik warung akan memverifikasi pesanan Anda. Anda dapat mengambil pesanan setelah status berubah menjadi "Siap Diambil".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
