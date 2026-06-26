import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

const Login = () => {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan Password harus diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        await login(user, token);
        
        if (user.role.toUpperCase() === 'OWNER') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(response.data.message || 'Login gagal');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Email atau Password salah');
    } finally {
      setLoading(false);
    }
  };

  // Keep a helper for quick test testing
  const handleQuickLogin = async (role) => {
    setEmail(role === 'owner' ? 'budi@warungnear.com' : 'admin@warungnear.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-border">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">WarungNear</h1>
          <p className="text-gray-500 mt-2">Masuk ke akun WarungNear Anda</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text mb-1">Email Address</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-colors text-sm shadow-sm ${
              loading ? 'bg-green-300 cursor-not-allowed' : 'bg-primary hover:bg-green-700'
            }`}
          >
            {loading ? 'Memproses Masuk...' : 'Masuk Sekarang'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Belum punya akun?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Daftar di sini
          </Link>
        </div>

        {/* Quick Helper for Developers */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-gray-400 text-center font-medium mb-3">Bantuan Uji Cepat (Isi Form Otomatis):</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleQuickLogin('owner')}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded transition-colors"
            >
              Isi Owner
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded transition-colors"
            >
              Isi Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
