import { create } from 'zustand';
import { api } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'manager' | 'resident';
  points?: number;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (phone: string, password: string, role: string) => Promise<void>;
  register: (phone: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

interface LoginResponse {
  token: string;
  user: User;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,

  login: async (phone, password, role) => {
    set({ loading: true });
    try {
      const res = await api.post<LoginResponse>('/auth/login', {
        phone,
        password,
        role,
      });
      localStorage.setItem('token', res.token);
      set({ user: res.user, token: res.token, isAuthenticated: true });
    } finally {
      set({ loading: false });
    }
  },

  register: async (phone, name, password) => {
    set({ loading: true });
    try {
      const res = await api.post<LoginResponse>('/auth/register', {
        phone,
        name,
        password,
      });
      localStorage.setItem('token', res.token);
      set({ user: res.user, token: res.token, isAuthenticated: true });
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const user = await api.get<User>('/auth/me');
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
