
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

interface User { id: string; email: string; name: string; role: string; }
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, token } = res.data.data;
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          set({ isLoading: false });
          throw new Error(err.response?.data?.error || 'Login failed');
        }
      },
      register: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', { email, password, name });
          const { user, token } = res.data.data;
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          set({ isLoading: false });
          throw new Error(err.response?.data?.error || 'Registration failed');
        }
      },
      logout: () => { set({ user: null, token: null, isAuthenticated: false }); },
      fetchMe: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.data, isAuthenticated: true });
        } catch { set({ user: null, token: null, isAuthenticated: false }); }
      },
    }),
    { name: 'flowforge-auth', partialize: (state) => ({ token: state.token }) }
  )
);
