import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

const Register = () => {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Semua field wajib diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role: role.toUpperCase()
      });

      if (response.data.success) {
        setSuccess(true);
        const { token, user } = response.data.data;
        
        // Log in immediately
        await login(user, token);
        
        setTimeout(() => {
          if (user.role.toUpperCase() === 'OWNER') {
            navigate('/dashboard');
          } else {
            navigate('/');
          }
        }, 1500);
      } else {
        setError(response.data.message || 'Pendaftaran gagal');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registrasi gagal. Email mungkin sudah terdaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-border">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">WarungNear</h1>
          <p className="text-gray-500 mt-2">Daftar Akun Baru WarungNear</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 border border-green-200 p-3 rounded-lg text-sm mb-6 font-medium text-center">
            Pendaftaran berhasil! Mengalihkan...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text mb-1">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-1">Email Address</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-1">Password</label>
            <input
              type="password"
              placeholder="Min. 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-1">Daftar Sebagai</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all bg-white"
            >
              <option value="CUSTOMER">Customer (Membeli barang)</option>
              <option value="OWNER">Owner (Pemilik warung / POS)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className={`w-full py-3 rounded-lg font-bold text-white transition-colors text-sm shadow-sm mt-2 ${
              loading || success ? 'bg-green-300 cursor-not-allowed' : 'bg-primary hover:bg-green-700'
            }`}
          >
            {loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
