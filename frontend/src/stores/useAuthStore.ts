import { create } from 'zustand';

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
  winRate: number; // Percentage
  totalPointsEarned: number;
  achievements: string[];
  badges: string[];
}

interface AuthStoreState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  updateAvatar: (avatar: string) => void;
  logout: () => void;
}

const DEFAULT_USER: UserProfile = {
  id: 'usr_1',
  username: 'RoyalCardPro',
  email: 'pro.player@royalclub.com',
  avatar: 'royal_gold',
  rank: 'GOLD',
  level: 12,
  xp: 4850,
  gamesPlayed: 142,
  gamesWon: 88,
  winRate: 62.0,
  totalPointsEarned: 2450,
  achievements: ['first_win', 'bid_28', 'single_hand_victory', 'clean_sweep'],
  badges: ['Alpha Bidder', 'Tactician', 'Royal Club Gold'],
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  token: localStorage.getItem('auth_token'),
  user: localStorage.getItem('auth_user') 
    ? JSON.parse(localStorage.getItem('auth_user') as string)
    : null,
  isAuthenticated: !!localStorage.getItem('auth_token'),

  login: async (email, password) => {
    // Simulating authentication process
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (email && password) {
      const mockToken = 'mock-jwt-token-12345';
      const mockUser = {
        ...DEFAULT_USER,
        email,
        username: email.split('@')[0],
      };
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      set({ token: mockToken, user: mockUser, isAuthenticated: true });
      return true;
    }
    return false;
  },

  register: async (username, email, password) => {
    // Simulating registration process
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (username && email && password) {
      const mockToken = 'mock-jwt-token-67890';
      const mockUser: UserProfile = {
        ...DEFAULT_USER,
        username,
        email,
      };
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      set({ token: mockToken, user: mockUser, isAuthenticated: true });
      return true;
    }
    return false;
  },

  updateAvatar: (avatar) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, avatar };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
