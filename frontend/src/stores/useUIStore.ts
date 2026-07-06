import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

interface UIStoreState {
  // Sound Settings
  soundMuted: boolean;
  soundVolume: number; // 0 to 1
  ambientMusicVolume: number; // 0 to 1
  toggleSound: () => void;
  setSoundVolume: (vol: number) => void;
  setAmbientMusicVolume: (vol: number) => void;

  // Active Modals
  activeModal: 'BID' | 'TRUMP_SELECT' | 'SINGLE_HAND' | 'DECLARE_PAIR' | 'RESULTS' | 'SETTINGS' | null;
  openModal: (modal: UIStoreState['activeModal']) => void;
  closeModal: () => void;

  // Global Loader
  isGlobalLoading: boolean;
  loadingMessage: string;
  setLoadingState: (loading: boolean, message?: string) => void;

  // Toast System
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  soundMuted: false,
  soundVolume: 0.8,
  ambientMusicVolume: 0.5,
  toggleSound: () => set((state) => ({ soundMuted: !state.soundMuted })),
  setSoundVolume: (vol) => set({ soundVolume: Math.max(0, Math.min(1, vol)) }),
  setAmbientMusicVolume: (vol) => set({ ambientMusicVolume: Math.max(0, Math.min(1, vol)) }),

  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  isGlobalLoading: false,
  loadingMessage: '',
  setLoadingState: (loading, message = '') => set({ isGlobalLoading: loading, loadingMessage: message }),

  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration || 4000);
    }
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));
