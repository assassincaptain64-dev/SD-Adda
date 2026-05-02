import { create } from 'zustand';
import axios from 'axios';

axios.defaults.withCredentials = true;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      set({ user: res.data.user, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  },

  register: async (username, email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
      set({ user: res.data.user, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  },

  logout: async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout failed');
    }
  }
}));
