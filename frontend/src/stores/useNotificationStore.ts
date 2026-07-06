import { create } from 'zustand';

export interface InGameNotification {
  id: string;
  type: 'INVITE' | 'FRIEND_REQUEST' | 'SYSTEM';
  title: string;
  message: string;
  senderName?: string;
  senderAvatar?: string;
  roomId?: string;
  read: boolean;
  timestamp: string;
}

interface NotificationStoreState {
  notifications: InGameNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<InGameNotification, 'id' | 'read' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  acceptInvite: (id: string) => void;
  declineInvite: (id: string) => void;
}

const MOCK_NOTIFICATIONS: InGameNotification[] = [
  {
    id: 'notif_1',
    type: 'INVITE',
    title: 'Game Invitation',
    message: 'GrandMaster29 invited you to join Room #X7Y8ZA.',
    senderName: 'GrandMaster29',
    senderAvatar: 'emerald_knight',
    roomId: 'room_mock_123',
    read: false,
    timestamp: '2 mins ago',
  },
  {
    id: 'notif_2',
    type: 'FRIEND_REQUEST',
    title: 'Friend Request',
    message: 'SilentBluff sent you a friend request.',
    senderName: 'SilentBluff',
    senderAvatar: 'ruby_queen',
    read: false,
    timestamp: '1 hour ago',
  },
  {
    id: 'notif_3',
    type: 'SYSTEM',
    title: 'Season Reward',
    message: 'Congratulations! You reached Gold Rank. Claim your Golden Avatar Border.',
    read: true,
    timestamp: '1 day ago',
  },
];

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  notifications: MOCK_NOTIFICATIONS,
  unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,

  addNotification: (notification) => {
    const newNotif: InGameNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      read: false,
      timestamp: 'Just now',
    };
    set((state) => {
      const updated = [newNotif, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      return {
        notifications: updated,
        unreadCount: 0,
      };
    });
  },

  removeNotification: (id) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  acceptInvite: (id) => {
    // Logic will be handled in room join trigger
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  declineInvite: (id) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },
}));
