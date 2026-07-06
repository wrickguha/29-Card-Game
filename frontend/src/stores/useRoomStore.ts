import { create } from 'zustand';
import type { Player, Room } from '../types/game';

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
  searchRooms: Room[];
  ping: number;
  
  createRoom: (hostName: string, hostAvatar: string) => Promise<string>;
  joinRoom: (roomCode: string, playerName: string, playerAvatar: string) => Promise<boolean>;
  leaveRoom: () => void;
  toggleReady: (playerId: string) => void;
  sendChatMessage: (senderId: string, message: string) => void;
  setPing: (ping: number) => void;
}

export const useRoomStore = create<RoomStoreState>((set) => ({
  currentRoom: null,
  lobbyChat: [],
  searchRooms: [],
  ping: 45,

  createRoom: async (hostName, hostAvatar) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hostPlayer: Player = {
      id: 'usr_1',
      name: hostName,
      avatar: hostAvatar,
      position: 'SOUTH',
      isHost: true,
      isReady: false,
      isOnline: true,
      ping: 42,
    };
    const newRoom: Room = {
      id: `room_${Date.now()}`,
      code: roomCode,
      hostId: hostPlayer.id,
      players: [hostPlayer],
      status: 'LOBBY',
      maxPlayers: 4,
    };
    
    set({
      currentRoom: newRoom,
      lobbyChat: [{
        id: 'msg_welcome',
        senderName: 'SYSTEM',
        senderPosition: 'NORTH',
        message: `Welcome to the Royal Club Lobby! Room code: ${roomCode}. Share it with friends to play.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }],
    });
    return roomCode;
  },

  joinRoom: async (roomCode, playerName, playerAvatar) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Simulate finding room and joining
    const hostPlayer: Player = {
      id: 'usr_host',
      name: 'GrandMaster29',
      avatar: 'emerald_knight',
      position: 'NORTH',
      isHost: true,
      isReady: true,
      isOnline: true,
      ping: 58,
    };
    const playerSelf: Player = {
      id: 'usr_1',
      name: playerName,
      avatar: playerAvatar,
      position: 'SOUTH',
      isHost: false,
      isReady: false,
      isOnline: true,
      ping: 42,
    };
    const playerEast: Player = {
      id: 'usr_east',
      name: 'SilentBluff',
      avatar: 'ruby_queen',
      position: 'EAST',
      isHost: false,
      isReady: false,
      isOnline: true,
      ping: 72,
    };
    
    const joinedRoom: Room = {
      id: 'room_mock_123',
      code: roomCode,
      hostId: hostPlayer.id,
      players: [hostPlayer, playerSelf, playerEast],
      status: 'LOBBY',
      maxPlayers: 4,
    };

    set({
      currentRoom: joinedRoom,
      lobbyChat: [
        {
          id: 'msg_system_init',
          senderName: 'SYSTEM',
          senderPosition: 'NORTH',
          message: 'Connected to game server. Waiting for players to join...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: 'msg_1',
          senderName: 'GrandMaster29',
          senderPosition: 'NORTH',
          message: 'Welcome guys! Let\'s declare a double if we get jack of trumps.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: 'msg_system_joined',
          senderName: 'SYSTEM',
          senderPosition: 'NORTH',
          message: `${playerName} has joined the room.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ],
    });
    return true;
  },

  leaveRoom: () => {
    set({ currentRoom: null, lobbyChat: [] });
  },

  toggleReady: (playerId) => {
    set((state) => {
      if (!state.currentRoom) return state;
      const updatedPlayers = state.currentRoom.players.map((p) => {
        if (p.id === playerId) {
          return { ...p, isReady: !p.isReady };
        }
        return p;
      });
      return {
        currentRoom: {
          ...state.currentRoom,
          players: updatedPlayers,
        },
      };
    });
  },

  sendChatMessage: (senderId, message) => {
    set((state) => {
      if (!state.currentRoom) return state;
      const sender = state.currentRoom.players.find((p) => p.id === senderId);
      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        senderName: sender ? sender.name : 'You',
        senderPosition: sender ? sender.position : 'SOUTH',
        message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return {
        lobbyChat: [...state.lobbyChat, newMsg],
      };
    });
  },

  setPing: (ping) => set({ ping }),
}));
