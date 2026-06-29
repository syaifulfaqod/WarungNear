import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, ShieldAlert, UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/users');
      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        setError(response.data.message || 'Gagal memuat daftar pengguna');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleSuspend = async (user) => {
    const isSuspended = user.status === 'SUSPENDED';
    const actionText = isSuspended ? 'mengaktifkan kembali' : 'menonaktifkan';
    
    let reason = '';
    if (!isSuspended) {
      reason = window.prompt("Masukkan alasan penonaktifan akun (optional):", "Melanggar ketentuan layanan.");
      if (reason === null) return; // User cancelled prompt
    } else {
      if (!window.confirm(`Apakah Anda yakin ingin mengaktifkan kembali akun ${user.name}?`)) {
        return;
      }
    }

    setUpdatingId(user.id);
    try {
      const endpoint = `/admin/users/${user.id}/${isSuspended ? 'unsuspend' : 'suspend'}`;
      const response = await api.put(endpoint, !isSuspended ? { reason } : {});
      if (response.data.success) {
        toast.success(`Akun ${user.name} berhasil ${isSuspended ? 'diaktifkan kembali' : 'dinonaktifkan'}`);
        setUsers(prev => prev.map(u => u.id === user.id ? { 
          ...u, 
          status: isSuspended ? 'ACTIVE' : 'SUSPENDED',
          is_active: isSuspended,
          suspend_reason: isSuspended ? null : reason
        } : u));
      } else {
        toast.error(response.data.message || 'Gagal mengubah status akun');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan pada server.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[calc(100vh-150px)]">
        <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Memuat daftar pengguna...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar lengkap seluruh akun terdaftar (Customer, Owner, Admin) di WarungNear</p>
        </div>
        <button
          onClick={fetchUsers}
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
            placeholder="Cari berdasarkan nama, email, atau role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-55/60 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-5">ID</th>
                <th className="p-5">Nama</th>
                <th className="p-5">Email</th>
                <th className="p-5">Role</th>
                <th className="p-5">Status Akun</th>
                <th className="p-5">Tanggal Daftar</th>
                <th className="p-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-400 font-semibold">
                    Tidak ada pengguna ditemukan
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isSuspended = user.status === 'SUSPENDED';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 font-bold text-gray-650">#USR-{user.id}</td>
                      <td className="p-5 font-semibold text-slate-800">{user.name}</td>
                      <td className="p-5 text-gray-500 font-medium">{user.email}</td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                          user.role === 'ADMIN' ? 'bg-red-50 text-red-650 border border-red-200' :
                          user.role === 'OWNER' ? 'bg-emerald-50 text-emerald-650 border border-emerald-200' :
                          'bg-blue-50 text-blue-650 border border-blue-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isSuspended ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-red-500' : 'bg-green-500'}`}></span>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                        {user.suspend_reason && (
                          <p className="text-[10px] text-red-400 font-medium mt-1 truncate max-w-[200px]" title={user.suspend_reason}>
                            Alasan: {user.suspend_reason}
                          </p>
                        )}
                      </td>
                      <td className="p-5 text-gray-400 font-medium">
                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-5 text-right">
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleSuspend(user)}
                            disabled={updatingId === user.id}
                            className={`inline-flex items-center gap-1 text-xs font-bold py-1.5 px-3 rounded-xl transition-all shadow-3xs cursor-pointer border ${
                              isSuspended 
                                ? 'bg-green-50 hover:bg-green-100 text-green-650 border-green-200' 
                                : 'bg-red-50 hover:bg-red-100 text-red-650 border-red-200'
                            }`}
                          >
                            {isSuspended ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                Aktifkan
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Suspend
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
