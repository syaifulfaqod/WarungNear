import React, { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, ShoppingBag, Store, Users, CreditCard, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const AdminReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/reports');
      if (response.data.success) {
        setReports(response.data.data);
      } else {
        setError(response.data.message || 'Gagal memuat laporan admin');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[calc(100vh-150px)]">
        <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Memuat laporan dan performa platform...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-750 p-6 rounded-3xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-bold">Terjadi Kesalahan</p>
            <p className="text-sm">{error}</p>
            <button onClick={fetchReports} className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-colors">
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan & Analisis Finansial</h1>
          <p className="text-sm text-gray-500 mt-1">Laporan analitik finansial, langganan aktif, dan rekaman penjualan WarungNear</p>
        </div>
        <button
          onClick={fetchReports}
          className="p-2 border border-gray-250 rounded-xl hover:bg-gray-50 text-gray-650 transition-colors self-end sm:self-auto"
          title="Segarkan data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Rev */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-3xs">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pendapatan Bersih POS</span>
              <h3 className="text-xl font-black text-slate-800">
                Rp {(reports?.totalCompletedRevenue || 0).toLocaleString('id-ID')}
              </h3>
              <span className="text-[10px] text-green-500 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                Live database
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Sub Rev */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-3xs">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pendapatan Langganan</span>
              <h3 className="text-xl font-black text-slate-800">
                Rp {(reports?.totalSubscriptionRevenue || 0).toLocaleString('id-ID')}
              </h3>
              <span className="text-[10px] text-purple-500 font-semibold block">Sistem Pembayaran POS</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-3xs">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Jumlah Transaksi</span>
              <h3 className="text-xl font-black text-slate-800">{reports?.totalTransactions || 0}</h3>
              <span className="text-[10px] text-blue-500 font-semibold block">Seluruh order tercatat</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Active/Suspended Owner Distribution */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-3xs">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Rasio Status Owner</span>
              <h3 className="text-base font-black text-slate-850">
                {reports?.activeOwners || 0} Aktif / {reports?.suspendedOwners || 0} Suspended
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold block">Akun terdaftar</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Live Transaction Logs */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-extrabold text-slate-800 text-base">Riwayat Transaksi Sukses Terbaru (Maks 10)</h2>
          <p className="text-xs text-gray-400 mt-0.5">Daftar transaksi order online terkirim/selesai langsung dari customer</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-55/30 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-5">ID Order</th>
                <th className="p-5">Customer</th>
                <th className="p-5">Toko</th>
                <th className="p-5">Tanggal Pembelian</th>
                <th className="p-5 text-right">Nilai Belanja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {!reports?.recentOrders || reports.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-400 font-semibold">
                    Belum ada transaksi sukses yang tercatat.
                  </td>
                </tr>
              ) : (
                reports.recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-bold text-gray-650">#ORD-{order.id}</td>
                    <td className="p-5">
                      <p className="font-semibold text-slate-800">{order.customer?.name}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">{order.customer?.email}</p>
                    </td>
                    <td className="p-5 font-semibold text-slate-800">{order.store?.name}</td>
                    <td className="p-5 text-gray-500 font-medium">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-5 text-right font-black text-primary">
                      Rp {(order.total || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
