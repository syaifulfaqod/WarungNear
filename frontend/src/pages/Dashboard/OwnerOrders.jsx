import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, RefreshCw, CheckCircle, PackageOpen, Hourglass, ArrowRight, User } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../../services/api';
import useNotificationStore from '../../store/useNotificationStore';

const OwnerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.getOrders();
      if (response.success) {
        setOrders(response.data);
      } else {
        setError(response.message || 'Gagal memuat pesanan masuk');
      }
    } catch (err) {
      console.error(err);
      setError('Koneksi terputus. Pastikan server backend Anda berjalan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    useNotificationStore.getState().resetOrderBadge();
  }, []);

  // Listen to real-time new orders
  useEffect(() => {
    const handleNewOrder = (e) => {
      const newOrder = e.detail;
      // Prepend to orders list
      setOrders((prevOrders) => {
        // Prevent duplicate order insertion if they hit refresh at same time
        if (prevOrders.some(o => o.id === newOrder.id)) {
          return prevOrders;
        }
        return [newOrder, ...prevOrders];
      });
    };

    window.addEventListener('order:new', handleNewOrder);
    return () => {
      window.removeEventListener('order:new', handleNewOrder);
    };
  }, []);

  // Listen to real-time status updates (e.g. customer cancelling order)
  useEffect(() => {
    const handleOrderUpdate = (e) => {
      const updatedOrder = e.detail;
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === updatedOrder.id ? { ...order, status: updatedOrder.status } : order
        )
      );
    };

    window.addEventListener('order:update', handleOrderUpdate);
    return () => {
      window.removeEventListener('order:update', handleOrderUpdate);
    };
  }, []);

  const handleChatCustomer = (order) => {
    navigate(`/dashboard/chat?customerId=${order.customer_id}&orderId=${order.id}`);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
      return;
    }

    try {
      const response = await orderService.cancelOrderByOwner(orderId);
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

  const handleUpdateStatus = async (orderId, currentStatus) => {
    const statusSequence = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'READY',
      READY: 'COMPLETED'
    };

    const nextStatus = statusSequence[currentStatus];
    if (!nextStatus) return;

    setUpdatingId(orderId);
    try {
      const response = await orderService.updateOrderStatus(orderId, nextStatus);
      if (response.success) {
        toast.success(`Status pesanan #${orderId} berhasil diubah menjadi ${nextStatus}`);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: nextStatus } : order
          )
        );
      } else {
        toast.error(response.message || 'Gagal memperbarui status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghubungi server.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: { label: 'Menunggu Konfirmasi', color: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { label: 'Diproses/Dikonfirmasi', color: 'bg-purple-100 text-purple-800' },
      READY: { label: 'Siap Diambil', color: 'bg-blue-100 text-blue-800' },
      COMPLETED: { label: 'Selesai', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
    };
    return labels[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getActionButton = (order) => {
    if (updatingId === order.id) {
      return (
        <button disabled className="bg-gray-100 text-gray-400 font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Memproses...
        </button>
      );
    }

    switch (order.status) {
      case 'PENDING':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'PENDING')}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1"
          >
            Terima Order
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'CONFIRMED':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1"
          >
            Siapkan Barang
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'READY':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'READY')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1"
          >
            Selesai Diambil
            <CheckCircle className="w-3.5 h-3.5" />
          </button>
        );
      case 'CANCELLED':
        return (
          <span className="text-red-500 text-xs font-semibold flex items-center justify-center gap-1">
            ❌ Pesanan Dibatalkan
          </span>
        );
      case 'COMPLETED':
      default:
        return (
          <span className="text-gray-400 text-xs font-semibold flex items-center justify-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Pesanan Selesai
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Memuat pesanan masuk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-md mx-auto text-center mt-10">
        <p className="font-bold mb-2">Terjadi Kesalahan</p>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl transition-all"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Pesanan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola transaksi pesanan digital masuk ke warung Anda</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
          title="Segarkan data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="font-bold text-lg text-gray-800 mb-1">Belum Ada Pesanan</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Pesanan digital dari pelanggan akan tampil di sini secara real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col"
            >
              {/* Order Header bar */}
              <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-600">
                  <span className="font-extrabold text-gray-800 text-base">#ORD-{order.id}</span>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    {order.customer?.name} ({order.customer?.email})
                  </span>
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusLabel(order.status).color}`}>
                    {getStatusLabel(order.status).label}
                  </span>
                </div>
              </div>

              {/* Order details body */}
              <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                {/* Items details */}
                <div className="flex-1 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Item Pesanan</h4>
                  <div className="divide-y divide-gray-150">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.product?.image ? (
                              <img
                                src={getImageUrl(item.product.image)}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://placehold.co/40x40?text=Barang';
                                }}
                              />
                            ) : (
                              <ShoppingBag className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-gray-800">{item.product?.name || 'Produk'}</span>
                            <p className="text-xs text-gray-400">
                              {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-700">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status action bar & pricing */}
                <div className="w-full md:w-72 bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-xs text-gray-400 font-semibold block mb-1">Total Pembayaran</span>
                    <span className="text-2xl font-extrabold text-primary">
                      Rp {order.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-4 space-y-2">
                    <span className="text-xs text-gray-400 font-semibold block mb-2">Aksi Status Pesanan</span>
                    {getActionButton(order)}
                    
                    {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                      >
                        ❌ Batalkan Pesanan
                      </button>
                    )}

                    <button
                      onClick={() => handleChatCustomer(order)}
                      className="w-full bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border border-[#A5D6A7]"
                    >
                      💬 Chat Customer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerOrders;
