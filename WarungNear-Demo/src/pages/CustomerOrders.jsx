import React, { useEffect, useState } from 'react';
import { ShoppingBag, Calendar, Store, ArrowRight, RefreshCw, CheckCircle2, MapPin } from 'lucide-react';
import { orderService } from '../services/orderService';
import { Link, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../services/api';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../store/useNotificationStore';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    useNotificationStore.getState().resetCustomerOrderBadge();
  }, []);

  const handleChatToko = (order) => {
    const storeId = order.store_id || order.store?.id;
    if (storeId) {
      navigate(`/chat?storeId=${storeId}`);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
      return;
    }

    try {
      const response = await orderService.cancelOrderByCustomer(orderId);
      if (response.success) {
        toast.success("Pesanan berhasil dibatalkan");
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
      } else {
        toast.error(response.message || "Gagal membatalkan pesanan");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat membatalkan pesanan");
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.getOrders();
      console.log("CustomerOrders received response:", response);
      if (response.success) {
        setOrders(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.message || 'Gagal memuat riwayat pesanan');
      }
    } catch (err) {
      console.error("fetchOrders error caught:", err);
      setError('Koneksi terputus. Pastikan server backend Anda berjalan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Realtime update order status
  useEffect(() => {
    const handleOrderUpdate = (e) => {
      const updatedOrder = e.detail;
      console.log("Realtime order update event:", updatedOrder);
      setOrders((prevOrders) => {
        const safeOrders = Array.isArray(prevOrders) ? prevOrders : [];
        return safeOrders.map((order) =>
          order?.id === updatedOrder?.id ? { ...order, status: updatedOrder?.status } : order
        );
      });
    };

    window.addEventListener('order:update', handleOrderUpdate);
    return () => {
      window.removeEventListener('order:update', handleOrderUpdate);
    };
  }, []);

  const getStatusBadge = (status) => {
    const config = {
      PENDING: { bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'Menunggu Konfirmasi' },
      CONFIRMED: { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'Diproses' },
      READY: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Siap Diambil' },
      COMPLETED: { bg: 'bg-green-50 text-green-700 border-green-200', text: 'Selesai' },
      CANCELLED: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'Dibatalkan' },
    };

    const item = config[status] || { bg: 'bg-gray-50 text-gray-700 border-gray-200', text: status || '-' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.bg}`}>
        {item.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">Memuat riwayat pesanan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-md mx-auto shadow-sm">
          <p className="font-bold mb-2">Terjadi Kesalahan</p>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl transition-all"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const safeOrders = Array.isArray(orders) ? orders : [];

  if (safeOrders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">📦 Belum Ada Pesanan</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
          Anda belum pernah melakukan pembelian.<br />
          Silakan cari produk dan lakukan checkout terlebih dahulu.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center bg-primary hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all gap-2 shadow-sm text-sm"
        >
          Mulai Belanja
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pesanan Saya</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar riwayat pembelian Anda di WarungNear</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
          title="Segarkan data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {safeOrders.map((order) => {
          if (!order) return null;
          return (
            <div
              key={order.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Header info */}
              <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 gap-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                  <span className="font-bold text-gray-800">#ORD-{order.id}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-gray-700">
                    <Store className="w-4 h-4 text-primary" />
                    {order.store?.name || 'Toko'}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Store Address & Google Maps Navigation */}
              {order.store && (
                <div className="bg-emerald-50/50 px-6 py-3 border-b border-gray-150/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-gray-600">
                    <span className="font-bold text-gray-700 block">Alamat Toko:</span>
                    <span>{order.store.address || 'Alamat tidak tersedia'}</span>
                  </div>
                  {order.store.latitude !== undefined && order.store.longitude !== undefined && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${order.store.latitude},${order.store.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-55/60 border border-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm w-fit"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      Petunjuk Arah (Google Maps)
                    </a>
                  )}
                </div>
              )}

              {/* Items details */}
              <div className="px-6 py-4">
                <div className="divide-y divide-gray-100">
                  {(order.items || []).map((item) => {
                    if (!item) return null;
                    return (
                      <div key={item.id} className="py-3 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                            {item.product?.image ? (
                              <img
                                src={getImageUrl(item.product.image)}
                                alt={item.product?.name || 'Produk'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://placehold.co/50x50?text=Barang';
                                }}
                              />
                            ) : (
                              <ShoppingBag className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{item.product?.name || 'Produk'}</p>
                            <p className="text-xs text-gray-400">
                              {item.quantity || 0} x Rp {(item.price || 0).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-700 text-sm">
                          Rp {((item.price || 0) * (item.quantity || 0)).toLocaleString('id-ID')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer pricing */}
                <div className="border-t border-gray-100 pt-4 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-xs text-gray-400">
                    {order.status === 'READY' && (
                      <span className="flex items-center gap-1 text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        Silakan ambil pesanan Anda ke toko.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-end">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        ❌ Batalkan Pesanan
                      </button>
                    )}
                    <button
                      onClick={() => handleChatToko(order)}
                      className="inline-flex items-center gap-1.5 bg-primary hover:bg-green-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      💬 Chat Toko
                    </button>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-gray-500 font-medium">Total Pembayaran:</span>
                      <p className="text-lg font-extrabold text-primary">
                        Rp {(order.total || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerOrders;
