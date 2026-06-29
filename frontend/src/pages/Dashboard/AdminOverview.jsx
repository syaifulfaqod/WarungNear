import React, { useEffect, useState } from 'react';
import { Users, Store, ShoppingBag, DollarSign, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError(response.data.message || 'Gagal memuat statistik dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Koneksi ke server terputus.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[calc(100vh-150px)]">
        <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Memuat statistik dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-bold">Terjadi Kesalahan</p>
            <p className="text-sm">{error}</p>
            <button onClick={fetchStats} className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-colors">
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Pelanggan',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'from-blue-500 to-indigo-500',
      description: 'Customer terdaftar'
    },
    {
      title: 'Total Pemilik Toko',
      value: stats?.totalOwners || 0,
      icon: Users,
      color: 'from-emerald-500 to-teal-500',
      description: 'Owner terdaftar'
    },
    {
      title: 'Toko Kelontong Aktif',
      value: stats?.totalStores || 0,
      icon: Store,
      color: 'from-amber-500 to-orange-500',
      description: 'Store aktif di maps'
    },
    {
      title: 'Total Transaksi Order',
      value: stats?.totalTransactions || 0,
      icon: ShoppingBag,
      color: 'from-purple-500 to-pink-500',
      description: 'Semua pesanan online'
    },
    {
      title: 'Pendapatan Transaksi',
      value: `Rp ${(stats?.totalRevenue || 0).toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'from-cyan-500 to-blue-500',
      description: 'Total transaksi sukses'
    },
    {
      title: 'Pendapatan Langganan',
      value: `Rp ${(stats?.totalSubscriptionRevenue || 0).toLocaleString('id-ID')}`,
      icon: CreditCard,
      color: 'from-rose-500 to-red-500',
      description: 'Sistem langganan POS'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Ringkasan Admin</h1>
        <p className="text-slate-500 text-sm mt-1">Status dan statistik live platform WarungNear langsung dari database</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">{card.title}</span>
                  <h3 className="text-2xl font-black text-slate-800">{card.value}</h3>
                  <span className="text-xs text-gray-400 font-medium block">{card.description}</span>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminOverview;
