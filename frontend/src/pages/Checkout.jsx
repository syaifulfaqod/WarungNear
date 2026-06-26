import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ShieldCheck, Loader2, Store, MapPin, CheckCircle2 } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import { orderService } from '../services/orderService';
import { toast } from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, storeId, storeName, clearCart, getTotal } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Keranjang belanja Anda kosong.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await orderService.createOrder(storeId, cartItems);
      if (response.success) {
        toast.success('Pesanan berhasil dibuat! Menunggu konfirmasi toko.');
        setSuccessOrder(response.data);
        clearCart(); // Clear local shopping cart
      } else {
        setError(response.message || 'Gagal membuat pesanan');
        toast.error(response.message || 'Gagal membuat pesanan');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan koneksi server.');
      toast.error('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-primary animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Checkout Berhasil!</h2>
          <p className="text-gray-500 text-sm mt-1">Pesanan Anda telah diterima oleh toko dan sedang menunggu konfirmasi.</p>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-6 text-left space-y-4 shadow-sm">
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase">Nama Warung</span>
            <p className="text-gray-800 font-bold text-base flex items-center gap-1.5 mt-0.5">
              <Store className="w-4 h-4 text-primary" />
              {successOrder.store?.name}
            </p>
          </div>

          {successOrder.store?.address && (
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase">Alamat Warung</span>
              <p className="text-gray-650 text-sm mt-0.5">{successOrder.store.address}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase">Total Pembayaran</span>
            <p className="text-lg font-extrabold text-primary">
              Rp {successOrder.total?.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {successOrder.store?.latitude !== undefined && successOrder.store?.longitude !== undefined && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${successOrder.store.latitude},${successOrder.store.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <MapPin className="w-4 h-4 text-red-300 fill-red-300" />
            Buka Rute ke Toko (Google Maps)
          </a>
        )}

        <div className="flex gap-3 pt-2">
          <Link
            to="/orders"
            className="flex-1 border border-gray-250/80 hover:bg-gray-50 text-gray-600 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors text-center"
          >
            Lihat Pesanan Saya
          </Link>
          <Link
            to="/"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors text-center"
          >
            Kembali ke Home
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Checkout Tidak Tersedia</h2>
        <p className="text-gray-500 mb-6">Anda tidak memiliki barang apapun untuk di-checkout.</p>
        <Link to="/" className="bg-primary hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all">
          Kembali ke Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Keranjang
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout Pesanan</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm font-semibold">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Order details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Informasi Pengambil
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Nama</label>
                <p className="text-gray-700 font-bold mt-0.5">{user?.name || 'Tamu'}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Email</label>
                <p className="text-gray-700 font-bold mt-0.5">{user?.email || '-'}</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-xl text-xs text-primary font-medium">
              Metode: <strong>Ambil Sendiri (Self-Pickup)</strong> di warung setelah pesanan siap.
            </div>
          </div>

          {/* Store Info & Items */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Detail Warung
            </h3>
            <p className="text-gray-700 font-bold text-base mb-4">{storeName}</p>

            <h4 className="font-bold text-sm text-gray-500 mb-3 uppercase">Rincian Barang ({cartItems.length})</h4>
            <div className="divide-y divide-gray-100">
              {cartItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-bold text-gray-800 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <span className="font-bold text-gray-700 text-sm">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
            <h3 className="font-bold text-lg text-gray-800 mb-4 pb-4 border-b border-gray-100">
              Ringkasan Pembayaran
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800">Rp {getTotal().toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Biaya Admin</span>
                <span className="font-semibold text-emerald-600">Rp 0</span>
              </div>
              <div className="border-t border-dashed border-gray-150 pt-3 flex justify-between items-center">
                <span className="font-semibold text-gray-800">Total Tagihan</span>
                <span className="text-xl font-extrabold text-primary">
                  Rp {getTotal().toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Buat Pesanan Sekarang
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
              Dengan membuat pesanan, Anda berkomitmen untuk mengambil barang langsung ke lokasi warung setelah pesanan selesai diproses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
