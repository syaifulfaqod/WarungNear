import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('warungnear_token') || null,
  isAuthenticated: !!localStorage.getItem('warungnear_token'),
  role: localStorage.getItem('warungnear_role') || null,
  loading: true, // Start loading as true to let checkAuth execute first

  login: async (userData, token) => {
    localStorage.setItem('warungnear_token', token);
    localStorage.setItem('warungnear_role', userData.role);
    set({
      user: userData,
      token: token,
      isAuthenticated: true,
      role: userData.role,
    });
  },
  
  logout: () => {
    localStorage.removeItem('warungnear_token');
    localStorage.removeItem('warungnear_role');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      role: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('warungnear_token');
    if (!token) {
      set({ isAuthenticated: false, user: null, role: null, loading: false });
      return;
    }
    
    set({ loading: true });
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const user = response.data.data;
        localStorage.setItem('warungnear_role', user.role);
        set({
          user: user,
          isAuthenticated: true,
          role: user.role,
          loading: false
        });
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('checkAuth failed, logging out:', error);
      localStorage.removeItem('warungnear_token');
      localStorage.removeItem('warungnear_role');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        role: null,
        loading: false
      });
    }
  }
}));

export default useAuthStore;
