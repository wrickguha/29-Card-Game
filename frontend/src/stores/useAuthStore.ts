import { create } from 'zustand';
import { api } from '../services/api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  rank: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'CHAMPION';
  level: number;
  xp: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  totalPointsEarned: number;
  achievements: string[];
  badges: string[];
}

interface AuthStoreState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, avatar: string) => Promise<boolean>;
  updateAvatar: (avatar: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  token: localStorage.getItem('auth_token'),
  user: localStorage.getItem('auth_user') 
    ? JSON.parse(localStorage.getItem('auth_user') as string)
    : null,
  isAuthenticated: !!localStorage.getItem('auth_token'),

  login: async (email, password) => {
    try {
      const response = await api.auth.login(email, password);
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ token, user, isAuthenticated: true });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error', err);
      return false;
    }
  },

  register: async (username, email, password, avatar) => {
    try {
      const response = await api.auth.register(username, email, password, avatar);
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ token, user, isAuthenticated: true });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Registration error', err);
      return false;
    }
  },

  updateAvatar: async (avatar) => {
    try {
      const response = await api.auth.updateAvatar(avatar);
      if (response.success && response.data) {
        const user = response.data;
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ user });
      }
    } catch (err) {
      console.error('Update avatar error', err);
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error('Logout API call failed', err);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  fetchMe: async () => {
    try {
      const response = await api.auth.me();
      if (response.success && response.data) {
        const user = response.data;
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ user });
      }
    } catch (err) {
      console.error('Fetch me error', err);
    }
  }
}));
