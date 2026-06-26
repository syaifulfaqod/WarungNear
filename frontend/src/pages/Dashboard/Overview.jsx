import React, { useEffect, useState } from 'react';
import { Package, Archive, ReceiptText, TrendingUp, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import useProductStore from '../../store/useProductStore';
import { productOwnerService } from '../../services/productOwnerService';
import { dashboardService } from '../../services/dashboardService';
import ErrorAlert from '../../components/ErrorAlert';
import { getImageUrl } from '../../services/api';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';

const Overview = () => {
  const { products, setProducts } = useProductStore();
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');
  const role = useAuthStore((state) => state.role);
  const user = useAuthStore((state) => state.user);

  // Sales analytics state
  const [period, setPeriod] = useState('weekly'); // 'today', 'weekly', 'monthly', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProductsSold: 0,
    chartData: []
  });

  // Load products list (for total products & inventory counters)
  const loadProducts = async () => {
    try {
      const res = await productOwnerService.getProducts();
      if (res.success) {
        setProducts(res.data);
      } else {
        setError(res.message || 'Gagal memuat data produk');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat produk. Hubungi server backend.');
    }
  };

  // Load sales statistics
  const fetchSalesData = async (currentPeriod, start, end) => {
    setLoadingAnalytics(true);
    try {
      const filters = { period: currentPeriod };
      if (currentPeriod === 'custom') {
        if (!start || !end) {
          setLoadingAnalytics(false);
          return;
        }
        filters.startDate = start;
        filters.endDate = end;
      }
      
      const res = await dashboardService.getSalesAnalytics(filters);
      if (res.success) {
        setAnalytics(res.data);
      } else {
        toast.error(res.message || 'Gagal memuat data grafik penjualan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data analitik penjualan.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Initial load
  const loadData = async () => {
    if (role === 'ADMIN') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loadProducts();
      await fetchSalesData(period, startDate, endDate);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  // Fetch sales when filter or dates change
  useEffect(() => {
    if (!loading && role !== 'ADMIN') {
      fetchSalesData(period, startDate, endDate);
    }
  }, [period, startDate, endDate]);

  const totalProducts = products.length;
  const totalStock = products.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  const lowStockCount = products.filter(p => p.stock <= 5).length;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const formatDateLabel = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Memuat dashboard...</p>
      </div>
    );
  }

  if (role === 'ADMIN') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm text-center md:text-left md:flex md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-gray-900">Selamat Datang, Admin!</h1>
            <p className="text-gray-500 text-sm max-w-lg">
              Melalui dashboard administrator ini, Anda dapat memantau pendaftaran warung, meninjau kiriman bukti transfer langganan POS premium, dan mengelola database WarungNear.
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex flex-wrap gap-3 justify-center md:justify-start">
            <Link to="/dashboard/admin/subscriptions" className="px-5 py-3 bg-primary text-white font-bold rounded-2xl shadow-sm hover:bg-green-700 transition-all text-sm flex items-center gap-2 cursor-pointer">
              Verifikasi Pembayaran
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-3xl">👥</span>
              <h3 className="font-bold text-gray-800 text-lg mt-3">Pengguna &amp; Owner</h3>
              <p className="text-gray-400 text-xs mt-1">Kelola data pelanggan dan pemilik toko (Owner).</p>
            </div>
            <Link to="/dashboard/users" className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer">
              Lihat Selengkapnya &rarr;
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-3xl">🏪</span>
              <h3 className="font-bold text-gray-800 text-lg mt-3">Toko Terdaftar</h3>
              <p className="text-gray-400 text-xs mt-1">Verifikasi lokasi maps dan operasional warung.</p>
            </div>
            <Link to="/dashboard/stores" className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer">
              Lihat Selengkapnya &rarr;
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-3xl">💳</span>
              <h3 className="font-bold text-gray-800 text-lg mt-3">Pembayaran Langganan</h3>
              <p className="text-gray-400 text-xs mt-1">Verifikasi pembayaran aktif Rp30.000 / bulan.</p>
            </div>
            <Link to="/dashboard/admin/subscriptions" className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer">
              Kelola Pembayaran &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <ErrorAlert message={error} onRetry={loadData} />;

  const hasSales = analytics.totalRevenue > 0 || analytics.chartData.some(d => d.revenue > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Pantau performa penjualan dan stok warung Anda secara real-time</p>
        </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Pendapatan */}
        <div className="card flex items-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="bg-green-50 p-4 rounded-xl mr-4 text-green-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Total Pendapatan</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{formatRupiah(analytics.totalRevenue)}</p>
          </div>
        </div>

        {/* Total Pesanan */}
        <div className="card flex items-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="bg-blue-50 p-4 rounded-xl mr-4 text-blue-600">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Total Pesanan</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{analytics.totalOrders} Transaksi</p>
          </div>
        </div>

        {/* Produk Terjual */}
        <div className="card flex items-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="bg-purple-50 p-4 rounded-xl mr-4 text-purple-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Produk Terjual</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{analytics.totalProductsSold} Item</p>
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="card flex items-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm border-l-4 border-l-orange-500">
          <div className="bg-orange-50 p-4 rounded-xl mr-4 text-orange-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Stok Menipis</p>
            <p className="text-xl font-black text-orange-600 mt-0.5">{lowStockCount} Item</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Widget */}
        <div className="card lg:col-span-2 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
              Grafik Penjualan
              {loadingAnalytics && <RefreshCw className="w-4 h-4 text-primary animate-spin" />}
            </h2>
            
            {/* Period Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="today">Hari Ini</option>
                <option value="weekly">Mingguan (7 Hari Terakhir)</option>
                <option value="monthly">Bulanan (30 Hari Terakhir)</option>
                <option value="custom">Kustom Tanggal</option>
              </select>

              {period === 'custom' && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 sm:mt-0">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 border border-gray-250 rounded-xl outline-none"
                  />
                  <span>s/d</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 border border-gray-250 rounded-xl outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {!hasSales ? (
              <div className="text-center space-y-2 py-12">
                <span className="text-4xl">📊</span>
                <p className="text-gray-500 font-semibold text-sm">Belum ada penjualan pada periode ini</p>
                <p className="text-xs text-gray-400">Transaksi selesai (COMPLETED) akan terangkum di sini.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.chartData} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={formatDateLabel}
                    tick={{fontSize: 10, fill: '#64748b'}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(value) => value === 0 ? '0' : `Rp${value/1000}k`}
                    tick={{fontSize: 10, fill: '#64748b'}} 
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip 
                    labelFormatter={(label) => {
                      try {
                        return new Date(label).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                      } catch (e) {
                        return label;
                      }
                    }}
                    formatter={(value) => [formatRupiah(value), 'Pendapatan']} 
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sidebar Product Stock Alerts */}
        <div className="card p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-1.5">
            <Archive className="w-5 h-5 text-amber-500" />
            Produk Stok Menipis
          </h2>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {products.filter(p => p.stock <= 5).map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100/50 hover:bg-red-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <img src={getImageUrl(product.image)} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                  <div>
                    <h3 className="font-bold text-xs text-gray-800 line-clamp-1">{product.name}</h3>
                    <p className="text-[10px] text-gray-500">{product.category}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-750 text-[10px] font-bold rounded-lg whitespace-nowrap">
                  Sisa {product.stock}
                </span>
              </div>
            ))}
            {lowStockCount === 0 && (
              <div className="text-center py-12 text-gray-400 text-xs">
                🌱 Semua stok produk aman.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
