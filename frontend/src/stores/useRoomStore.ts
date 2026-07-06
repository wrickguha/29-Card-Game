import { create } from 'zustand';
import { api } from '../services/api';
import type { Room } from '../types/game';

interface ChatMessage {
  id: string;
  senderName: string;
  senderPosition: string;
  message: string;
  timestamp: string;
}

interface RoomStoreState {
  currentRoom: Room | null;
  lobbyChat: ChatMessage[];
  ping: number;
  pollIntervalId: any | null;
  
  createRoom: (isPrivate?: boolean, trumpMode?: 'SEVENTH_CARD' | 'JOKER') => Promise<string>;
  joinRoom: (roomCode: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  toggleReady: () => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  setPing: (ping: number) => void;
  startPollingRoom: (code: string, onGameStarted: (gameId: string) => void) => void;
  stopPollingRoom: () => void;
}

export const useRoomStore = create<RoomStoreState>((set, get) => {
  return {
    currentRoom: null,
    lobbyChat: [],
    ping: 45,
    pollIntervalId: null,

    createRoom: async (isPrivate = true, trumpMode = 'SEVENTH_CARD') => {
      const response = await api.rooms.create({ is_private: isPrivate, trump_mode: trumpMode });
      if (response.success && response.data) {
        const roomData = response.data;
        
        // Map backend Room player models to frontend Player type
        const players = (roomData.players || []).map((p: any) => ({
          id: p.user.id.toString(),
          name: p.user.username,
          avatar: p.user.avatar,
          position: p.position,
          isHost: p.user.id.toString() === roomData.host_id.toString(),
          isReady: !!p.is_ready,
          isOnline: !!p.is_connected,
        }));

        const newRoom: Room = {
          id: roomData.id.toString(),
          code: roomData.code,
          hostId: roomData.host_id.toString(),
          players,
          status: roomData.status,
          maxPlayers: roomData.max_players,
        };

        set({
          currentRoom: newRoom,
          lobbyChat: roomData.chats || [],
        });
        return roomData.code;
      }
      throw new Error(response.message || 'Could not create room');
    },

    joinRoom: async (roomCode) => {
      try {
        const response = await api.rooms.join(roomCode);
        if (response.success && response.data) {
          const roomData = response.data;
          const players = (roomData.players || []).map((p: any) => ({
            id: p.user.id.toString(),
            name: p.user.username,
            avatar: p.user.avatar,
            position: p.position,
            isHost: p.user.id.toString() === roomData.host_id.toString(),
            isReady: !!p.is_ready,
            isOnline: !!p.is_connected,
          }));

          const joinedRoom: Room = {
            id: roomData.id.toString(),
            code: roomData.code,
            hostId: roomData.host_id.toString(),
            players,
            status: roomData.status,
            maxPlayers: roomData.max_players,
          };

          set({
            currentRoom: joinedRoom,
            lobbyChat: roomData.chats || [],
          });
          return true;
        }
        return false;
      } catch (err) {
        console.error('Join room error', err);
        return false;
      }
    },

    leaveRoom: async () => {
      const room = get().currentRoom;
      if (room) {
        try {
          await api.rooms.leave(room.code);
        } catch (err) {
          console.error('Leave room error', err);
        }
      }
      get().stopPollingRoom();
      set({ currentRoom: null, lobbyChat: [] });
    },

    toggleReady: async () => {
      const room = get().currentRoom;
      if (!room) return;

      try {
        const response = await api.rooms.toggleReady(room.code);
        if (response.success && response.data) {
          const roomData = response.data;
          const players = (roomData.players || []).map((p: any) => ({
            id: p.user.id.toString(),
            name: p.user.username,
            avatar: p.user.avatar,
            position: p.position,
            isHost: p.user.id.toString() === roomData.host_id.toString(),
            isReady: !!p.is_ready,
            isOnline: !!p.is_connected,
          }));

          set({
            currentRoom: {
              ...room,
              players,
            },
          });
        }
      } catch (err) {
        console.error('Toggle ready error', err);
      }
    },

    sendChatMessage: async (message) => {
      const room = get().currentRoom;
      if (!room) return;

      try {
        const response = await api.rooms.sendChat(room.code, message);
        if (response.success && response.data) {
          const newMsg = response.data;
          set((state) => ({
            lobbyChat: [...state.lobbyChat, newMsg],
          }));
        }
      } catch (err) {
        console.error('Send chat message error', err);
      }
    },

    setPing: (ping) => set({ ping }),

    startPollingRoom: (code, onGameStarted) => {
      get().stopPollingRoom();

      const fetchRoomState = async () => {
        try {
          const response = await api.rooms.get(code);
          if (response.success && response.data) {
            const roomData = response.data;
            const players = (roomData.players || []).map((p: any) => ({
              id: p.user.id.toString(),
              name: p.user.username,
              avatar: p.user.avatar,
              position: p.position,
              isHost: p.user.id.toString() === roomData.host_id.toString(),
              isReady: !!p.is_ready,
              isOnline: !!p.is_connected,
            }));

            const polledRoom: Room = {
              id: roomData.id.toString(),
              code: roomData.code,
              hostId: roomData.host_id.toString(),
              players,
              status: roomData.status,
              maxPlayers: roomData.max_players,
            };

            set({
              currentRoom: polledRoom,
              lobbyChat: roomData.chats || [],
            });

            // If game is started and we have a game relationship loaded
            if (roomData.status === 'PLAYING' && roomData.game) {
              get().stopPollingRoom();
              onGameStarted(roomData.game.id.toString());
            }
          }
        } catch (err) {
          console.error('Error polling room state', err);
        }
      };

      // Poll immediately and then every 1.5 seconds
      fetchRoomState();
      const intervalId = setInterval(fetchRoomState, 1500);
      set({ pollIntervalId: intervalId });
    },

    stopPollingRoom: () => {
      const intervalId = get().pollIntervalId;
      if (intervalId) {
        clearInterval(intervalId);
        set({ pollIntervalId: null });
      }
    },
  };
});
