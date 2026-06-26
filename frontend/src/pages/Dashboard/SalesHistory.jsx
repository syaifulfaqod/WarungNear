import React, { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';
import { Search, Calendar, RefreshCw, CheckCircle2, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SalesHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await orderService.getStoreHistory();
      if (response.success) {
        setOrders(response.data);
      } else {
        toast.error(response.message || 'Gagal memuat riwayat transaksi');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan koneksi server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-50 text-yellow-750 border-yellow-200';
      case 'CONFIRMED': return 'bg-purple-50 text-purple-750 border-purple-200';
      case 'READY': return 'bg-blue-50 text-blue-750 border-blue-200';
      case 'COMPLETED': return 'bg-green-50 text-green-750 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    // 1. Search Query (Customer Name or any Item Product Name)
    const matchesSearch = 
      order.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery) ||
      (order.items || []).some(item => item.product.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Date Filter
    let matchesDate = true;
    if (filterDate) {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      matchesDate = orderDate === filterDate;
    }

    // 3. Status Filter
    let matchesStatus = true;
    if (filterStatus !== 'ALL') {
      matchesStatus = order.status === filterStatus;
    }

    return matchesSearch && matchesDate && matchesStatus;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar transaksi masuk dan riwayat laporan keuangan warung Anda</p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2 border border-gray-250 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-xs"
          title="Segarkan data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filters Box */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari ID, customer, atau produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
          />
        </div>

        {/* Date Filter */}
        <div className="relative w-full md:w-48">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm transition-all text-gray-700"
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-red-500 font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm bg-white font-semibold text-gray-700 transition-all"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="READY">READY</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-semibold">Memuat riwayat transaksi...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-gray-500 space-y-2">
            <span className="text-3xl block">📋</span>
            <p className="font-bold text-gray-750 text-sm">Tidak ada transaksi ditemukan</p>
            <p className="text-xs text-gray-400">Silakan sesuaikan kriteria pencarian atau filter Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold uppercase text-gray-400">
                  <th className="px-6 py-4 w-28">ID Transaksi</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4 text-center">Tipe</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Produk</th>
                  <th className="px-6 py-4 text-center">Jumlah</th>
                  <th className="px-6 py-4 text-right">Total Harga</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredOrders.map((order) => {
                  const prefix = order.type === 'ONLINE ORDER' ? '#ORD-' : '#POS-';
                  return (
                    <tr key={`${order.type}-${order.id}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">{prefix}{order.id}</td>
                      <td className="px-6 py-4 text-xs text-gray-550">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {order.type === 'ONLINE ORDER' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Online</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">POS</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{order.customer?.name}</td>
                      <td className="px-6 py-4">
                        <div className="max-w-[220px] space-y-1">
                          {(order.items || []).map((item, idx) => (
                            <p key={idx} className="truncate text-xs font-medium text-gray-650" title={item.product}>
                              • {item.product}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-xs text-gray-500">
                        {(order.items || []).reduce((acc, curr) => acc + curr.quantity, 0)} Pcs
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-primary">
                        {formatRupiah(order.total)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesHistory;
