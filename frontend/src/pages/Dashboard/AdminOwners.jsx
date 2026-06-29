import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, ShieldAlert, UserCheck, AlertCircle, Phone, Store, CreditCard, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const AdminOwners = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOwners = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/owners');
      if (response.data.success) {
        setOwners(response.data.data);
      } else {
        setError(response.data.message || 'Gagal memuat manajemen owner');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleToggleSuspend = async (owner) => {
    const isSuspended = owner.status === 'SUSPENDED';
    let reason = '';
    
    if (!isSuspended) {
      reason = window.prompt("Masukkan alasan penonaktifan akun owner (optional):", "Melanggar ketentuan layanan.");
      if (reason === null) return;
    } else {
      if (!window.confirm(`Apakah Anda yakin ingin mengaktifkan kembali akun owner ${owner.name}?`)) {
        return;
      }
    }

    setUpdatingId(owner.id);
    try {
      const endpoint = `/admin/users/${owner.id}/${isSuspended ? 'unsuspend' : 'suspend'}`;
      const response = await api.put(endpoint, !isSuspended ? { reason } : {});
      if (response.data.success) {
        toast.success(`Akun owner ${owner.name} berhasil ${isSuspended ? 'diaktifkan kembali' : 'dinonaktifkan'}`);
        setOwners(prev => prev.map(o => o.id === owner.id ? {
          ...o,
          status: isSuspended ? 'ACTIVE' : 'SUSPENDED',
          is_active: isSuspended,
          suspend_reason: isSuspended ? null : reason
        } : o));
      } else {
        toast.error(response.data.message || 'Gagal mengubah status akun owner');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan pada server.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOwners = owners.filter(owner => 
    owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (owner.stores?.[0]?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[calc(100vh-150px)]">
        <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Memuat manajemen pemilik toko...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Owner Toko</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar pemilik toko kelontong aktif, detail status langganan POS, dan kontrol suspend akun</p>
        </div>
        <button
          onClick={fetchOwners}
          className="p-2 border border-gray-250 rounded-xl hover:bg-gray-50 text-gray-650 transition-colors self-end sm:self-auto"
          title="Segarkan data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-750 px-4 py-3 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari berdasarkan nama owner, email, atau nama toko..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Card Grid View for Owner Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOwners.length === 0 ? (
          <div className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-450 font-bold">
            Tidak ada data owner ditemukan.
          </div>
        ) : (
          filteredOwners.map(owner => {
            const isSuspended = owner.status === 'SUSPENDED';
            const store = owner.stores?.[0];
            const sub = owner.subscription;
            
            return (
              <div key={owner.id} className="bg-white border border-gray-100 rounded-3xl shadow-3xs p-6 flex flex-col justify-between hover:shadow-sm transition-all gap-5">
                <div className="space-y-4">
                  {/* Header Profile */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800">{owner.name}</h3>
                      <p className="text-xs text-gray-450 font-semibold">{owner.email}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isSuspended ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Details */}
                  <div className="space-y-3.5 text-sm">
                    {/* Store Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Store className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Warung / Toko Kelontong</span>
                        {store ? (
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <span className="truncate">{store.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${store.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {store.isActive ? 'Buka/Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Belum mendaftarkan toko</span>
                        )}
                      </div>
                    </div>

                    {/* Subscription Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Status Langganan POS</span>
                        {sub ? (
                          <p className="font-semibold text-slate-800">
                            {sub.plan?.name || 'Trial Pack'} - <span className={`capitalize font-bold ${
                              sub.status === 'ACTIVE' ? 'text-green-600' : sub.status === 'TRIAL' ? 'text-amber-500' : 'text-red-500'
                            }`}>{sub.status}</span>
                          </p>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Tidak ada paket</span>
                        )}
                      </div>
                    </div>

                    {/* Join Date */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Bergabung Pada</span>
                        <p className="font-semibold text-slate-850">
                          {new Date(owner.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suspension reason block if suspended */}
                {owner.suspend_reason && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-xs text-red-700">
                    <p className="font-bold flex items-center gap-1">⚠ Catatan Penonaktifan:</p>
                    <p className="mt-0.5 leading-relaxed font-semibold">{owner.suspend_reason}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleToggleSuspend(owner)}
                    disabled={updatingId === owner.id}
                    className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-3xs cursor-pointer border flex justify-center items-center gap-1.5 ${
                      isSuspended
                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                        : 'bg-red-50 hover:bg-red-100 text-red-650 border-red-200'
                    }`}
                  >
                    {isSuspended ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Aktifkan Kembali Akun
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        Suspend Akun Owner
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminOwners;
