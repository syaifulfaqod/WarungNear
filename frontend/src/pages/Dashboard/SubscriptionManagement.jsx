import React, { useEffect, useState } from 'react';
import { CreditCard, Eye, Check, X, RefreshCw, Calendar, Search, Filter, HelpCircle, FileText, Award } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { getImageUrl } from '../../services/api';
import { toast } from 'react-hot-toast';

const SubscriptionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PENDING', 'ACTIVE', 'TRIAL', 'EXPIRED'
  const [selectedSub, setSelectedSub] = useState(null); // Sub selected for image preview modal
  const [processingId, setProcessingId] = useState(null); // Loading state for approve/reject actions

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await subscriptionService.getAdminSubscriptions();
      if (res.success) {
        setSubscriptions(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar langganan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin MENYETUJUI pembayaran langganan ini?')) return;
    
    setProcessingId(id);
    try {
      const res = await subscriptionService.approveSubscription(id);
      if (res.success) {
        toast.success(res.message || 'Langganan berhasil diaktifkan.');
        await fetchSubscriptions();
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyetujui langganan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin MENOLAK pembayaran langganan ini? Status akan diubah ke EXPIRED.')) return;

    setProcessingId(id);
    try {
      const res = await subscriptionService.rejectSubscription(id);
      if (res.success) {
        toast.success(res.message || 'Langganan berhasil ditolak.');
        await fetchSubscriptions();
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menolak langganan.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter subscriptions based on search & status dropdown
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    let badgeClass = '';
    let label = '';
    
    switch (status) {
      case 'TRIAL':
        badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
        label = 'Trial';
        break;
      case 'ACTIVE':
        badgeClass = 'bg-green-100 text-green-800 border-green-200';
        label = 'Aktif';
        break;
      case 'PENDING':
        badgeClass = 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse';
        label = 'Pending';
        break;
      case 'EXPIRED':
        badgeClass = 'bg-red-100 text-red-800 border-red-200';
        label = 'Expired';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800 border-gray-250';
        label = status;
    }

    return (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${badgeClass}`}>
        {label}
      </span>
    );
  };

  const getPlanBadgeStyle = (durationType) => {
    if (durationType === 'PERMANENT') {
      return 'bg-amber-100 text-amber-900 border-amber-250 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-0.5 w-fit';
    } else if (durationType === 'YEARLY') {
      return 'bg-blue-100 text-blue-900 border-blue-250 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border w-fit';
    }
    return 'bg-green-100 text-green-950 border-green-200 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border w-fit';
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  // Summary counts
  const pendingCount = subscriptions.filter(s => s.status === 'PENDING').length;
  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const permanentCount = subscriptions.filter(s => s.status === 'ACTIVE' && s.planDurationType === 'PERMANENT').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Verification</h1>
          <p className="text-sm text-gray-550 mt-1">Verifikasi pembayaran paket langganan bulanan, tahunan, atau permanen warung kelontong</p>
        </div>
        <button 
          onClick={fetchSubscriptions} 
          disabled={loading}
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs flex items-center gap-1.5 font-semibold text-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center">
          <div className="bg-blue-50 p-4 rounded-xl text-blue-600 mr-4">
            <RefreshCw className={`w-6 h-6 ${pendingCount > 0 ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Butuh Verifikasi</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{pendingCount} Pengajuan</p>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center">
          <div className="bg-green-50 p-4 rounded-xl text-green-600 mr-4">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Langganan Aktif</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{activeCount} Toko</p>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center">
          <div className="bg-amber-50 p-4 rounded-xl text-amber-600 mr-4">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Akses Permanen (Lifetime)</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{permanentCount} Toko</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-3xl border border-gray-150 p-4 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama owner, toko, atau paket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 bg-white outline-none focus:ring-2 focus:ring-primary w-full md:w-48 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu Verifikasi</option>
            <option value="ACTIVE">Aktif</option>
            <option value="TRIAL">Trial</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-gray-500 font-semibold">Memproses data...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <span className="text-4xl">📭</span>
            <p className="text-gray-500 font-bold">Belum ada pengajuan pembayaran langganan</p>
            <p className="text-gray-400 text-xs">Semua data transaksi / status akan terangkum di tabel ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-xs font-black text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Pemilik &amp; Toko</th>
                  <th className="px-6 py-4">Paket</th>
                  <th className="px-6 py-4">Biaya</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tanggal Pembayaran</th>
                  <th className="px-6 py-4">Bukti transfer</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-extrabold text-gray-800">{sub.ownerName}</p>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">{sub.storeName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-800 text-xs">{sub.planName}</p>
                        {sub.planDurationType !== '-' && (
                          <div className={getPlanBadgeStyle(sub.planDurationType)}>
                            {sub.planDurationType === 'PERMANENT' ? 'Lifetime' : sub.planDurationType}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800 text-xs">
                      {sub.planPrice > 0 ? formatRupiah(sub.planPrice) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-550">
                      {sub.paymentDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(sub.paymentDate).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sub.paymentProofImage ? (
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-lg text-xs font-bold text-gray-600 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Bukti
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs font-semibold">Tidak Ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sub.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(sub.id)}
                            disabled={processingId === sub.id}
                            className="p-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg hover:shadow-xs transition-all cursor-pointer"
                            title="Setujui Langganan"
                          >
                            {processingId === sub.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(sub.id)}
                            disabled={processingId === sub.id}
                            className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg hover:shadow-xs transition-all cursor-pointer"
                            title="Tolak Langganan"
                          >
                            {processingId === sub.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-semibold">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Proof Modal Preview */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col justify-between max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-extrabold text-gray-900">Bukti Pembayaran</h3>
                <p className="text-xs text-gray-550 font-semibold">{selectedSub.ownerName} ({selectedSub.storeName})</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Image preview) */}
            <div className="p-6 bg-gray-100 flex items-center justify-center overflow-auto max-h-[60vh]">
              <img
                src={getImageUrl(selectedSub.paymentProofImage)}
                alt={`Bukti Transfer dari ${selectedSub.ownerName}`}
                className="max-w-full h-auto rounded-xl object-contain border border-gray-200 shadow-sm"
              />
            </div>

            {/* Modal Footer (Actions) */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Paket &amp; Nominal</span>
                <span className="text-xs font-bold text-primary bg-green-50 border border-green-100 px-3 py-1 rounded-xl mt-0.5">
                  {selectedSub.planName} - {formatRupiah(selectedSub.planPrice)}
                </span>
              </div>

              {selectedSub.status === 'PENDING' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const id = selectedSub.id;
                      setSelectedSub(null);
                      handleReject(id);
                    }}
                    className="px-4 py-2 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 text-red-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Tolak
                  </button>
                  <button
                    onClick={() => {
                      const id = selectedSub.id;
                      setSelectedSub(null);
                      handleApprove(id);
                    }}
                    className="px-4 py-2 bg-primary hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Setujui
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
