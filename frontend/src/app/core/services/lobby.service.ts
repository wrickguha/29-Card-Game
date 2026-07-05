import { Injectable, signal, computed, effect, untracked } from '@angular/core';
import { Player, ChatMessage, PlayerPosition } from '../models/game.model';
import { GameRoom } from '../models/lobby.model';
import { AuthService } from './auth.service';
import { SoundService } from './sound.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LobbyService {
  private roomSignal = signal<GameRoom | null>(null);
  
  // Public selectors
  room = computed(() => this.roomSignal());
  players = computed(() => this.roomSignal()?.players || []);
  chatMessages = computed(() => this.roomSignal()?.chatMessages || []);
  latency = computed(() => this.roomSignal()?.latency || 25);
  connectionState = computed(() => this.roomSignal()?.connectionState || 'disconnected');
  
  private chatTimer: any;
  private latencyInterval: any;

  constructor(
    private authService: AuthService,
    private soundService: SoundService,
    private router: Router
  ) {
    // Keep user updated if AuthService changes
    effect(() => {
      const user = this.authService.currentUser();
      const currentRoom = untracked(() => this.roomSignal());
      if (user && currentRoom) {
        // Update user in the bottom slot
        const updatedPlayers = currentRoom.players.map((p: Player) => 
          p.isCurrentUser ? { ...p, name: user.username, avatarId: user.avatarId } : p
        );
        this.roomSignal.set({
          ...currentRoom,
          players: updatedPlayers
        });
      }
    }, { allowSignalWrites: true });
  }

  createRoom() {
    this.soundService.playClick();
    const roomCode = 'ROYAL-' + Math.floor(1000 + Math.random() * 9000);
    const user = this.authService.currentUser();

    const host: Player = {
      id: user?.id || 'user_1',
      name: user?.username || 'Player',
      avatarId: user?.avatarId || 'avatar_default_1',
      position: 'bottom',
      cards: [],
      isDealer: false,
      isReady: false,
      isConnected: true,
      currentBid: 0,
      isMyTurn: false,
      isCurrentUser: true
    };

    const newRoom: GameRoom = {
      code: roomCode,
      players: [host],
      isLocked: false,
      maxPlayers: 4,
      hostId: host.id,
      chatMessages: [
        {
          id: 'sys_1',
          senderName: 'System',
          senderPosition: 'bottom',
          text: `Room ${roomCode} created. Waiting for players...`,
          timestamp: new Date(),
          isSystem: true
        }
      ],
      latency: 18,
      connectionState: 'connecting'
    };

    this.roomSignal.set(newRoom);
    this.startLatencySimulation();

    // Simulate other players joining one-by-one
    setTimeout(() => this.simulatePlayerJoin('top', 'ZeusAI', 'avatar_zeus'), 1000);
    setTimeout(() => this.simulatePlayerJoin('left', 'ThorAI', 'avatar_thor'), 2200);
    setTimeout(() => this.simulatePlayerJoin('right', 'HeraAI', 'avatar_hera'), 3500);
  }

  joinRoom(code: string) {
    this.soundService.playClick();
    const cleanCode = code.toUpperCase().trim();
    const user = this.authService.currentUser();

    const host: Player = {
      id: user?.id || 'user_1',
      name: user?.username || 'Player',
      avatarId: user?.avatarId || 'avatar_default_1',
      position: 'bottom',
      cards: [],
      isDealer: false,
      isReady: false,
      isConnected: true,
      currentBid: 0,
      isMyTurn: false,
      isCurrentUser: true
    };

    const newRoom: GameRoom = {
      code: cleanCode,
      players: [host],
      isLocked: false,
      maxPlayers: 4,
      hostId: 'host_id', // Someone else is host
      chatMessages: [
        {
          id: 'sys_1',
          senderName: 'System',
          senderPosition: 'bottom',
          text: `Joined Room ${cleanCode}. Connecting...`,
          timestamp: new Date(),
          isSystem: true
        }
      ],
      latency: 42,
      connectionState: 'connecting'
    };

    this.roomSignal.set(newRoom);
    this.startLatencySimulation();

    // Fast join simulator
    setTimeout(() => this.simulatePlayerJoin('top', 'ZeusAI', 'avatar_zeus', true), 500);
    setTimeout(() => this.simulatePlayerJoin('left', 'ThorAI', 'avatar_thor', true), 1000);
    setTimeout(() => this.simulatePlayerJoin('right', 'HeraAI', 'avatar_hera', true), 1500);
  }

  private simulatePlayerJoin(position: PlayerPosition, name: string, avatarId: string, isFast = false) {
    const currentRoom = this.roomSignal();
    if (!currentRoom) return;

    const newPlayer: Player = {
      id: 'bot_' + position,
      name,
      avatarId,
      position,
      cards: [],
      isDealer: position === 'left', // Assign left player as dealer
      isReady: isFast, // Bots are ready immediately in fast join
      isConnected: true,
      currentBid: 0,
      isMyTurn: false,
      isCurrentUser: false
    };

    const updatedPlayers = [...currentRoom.players, newPlayer];
    const systemMessage: ChatMessage = {
      id: 'sys_' + Math.random().toString(36).substr(2, 5),
      senderName: 'System',
      senderPosition: position,
      text: `${name} has joined the room.`,
      timestamp: new Date(),
      isSystem: true
    };

    this.roomSignal.set({
      ...currentRoom,
      players: updatedPlayers,
      connectionState: 'connected',
      chatMessages: [...currentRoom.chatMessages, systemMessage]
    });

    this.soundService.playPlayerJoin();

    // Trigger AI message after join
    setTimeout(() => {
      const messages = {
        top: 'Hey partner! Let\'s secure this 29 victory!',
        left: 'Good luck to both teams!',
        right: 'Ready for some high-stakes play!'
      };
      this.sendChatMessage(name, position, messages[position as keyof typeof messages]);
      
      // Auto-ready for non-fast join
      if (!isFast) {
        setTimeout(() => {
          this.setPlayerReady(newPlayer.id, true);
        }, 1000);
      }
    }, 800);
  }

  private setPlayerReady(playerId: string, isReady: boolean) {
    const currentRoom = this.roomSignal();
    if (!currentRoom) return;

    const updatedPlayers = currentRoom.players.map(p => 
      p.id === playerId ? { ...p, isReady } : p
    );

    this.roomSignal.set({
      ...currentRoom,
      players: updatedPlayers
    });

    this.soundService.playChipClick();
    this.checkAllReadyAndProceed();
  }

  toggleCurrentUserReady() {
    const currentRoom = this.roomSignal();
    if (!currentRoom) return;

    const user = currentRoom.players.find(p => p.isCurrentUser);
    if (!user) return;

    const targetReady = !user.isReady;
    this.soundService.playClick();
    
    const updatedPlayers = currentRoom.players.map(p => 
      p.isCurrentUser ? { ...p, isReady: targetReady } : p
    );

    this.roomSignal.set({
      ...currentRoom,
      players: updatedPlayers
    });

    this.checkAllReadyAndProceed();
  }

  sendChatMessage(senderName: string, position: PlayerPosition, text: string, isSystem = false) {
    const currentRoom = this.roomSignal();
    if (!currentRoom) return;

    const newMessage: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 5),
      senderName,
      senderPosition: position,
      text,
      timestamp: new Date(),
      isSystem
    };

    this.roomSignal.set({
      ...currentRoom,
      chatMessages: [...currentRoom.chatMessages, newMessage]
    });

    this.soundService.playNotification();
  }

  sendUserMessage(text: string) {
    const user = this.authService.currentUser();
    if (user && text.trim().length > 0) {
      this.sendChatMessage(user.username, 'bottom', text.trim());
      
      // Setup some automatic responses from AI players based on keywords
      const lowerText = text.toLowerCase();
      if (lowerText.includes('hi') || lowerText.includes('hello')) {
        setTimeout(() => this.sendChatMessage('ZeusAI', 'top', 'Hello partner! Ready to bid?'), 1200);
      } else if (lowerText.includes('strat') || lowerText.includes('trump')) {
        setTimeout(() => this.sendChatMessage('ThorAI', 'left', 'Let\'s keep trumps hidden for as long as possible.'), 1500);
      }
    }
  }

  private checkAllReadyAndProceed() {
    const currentRoom = this.roomSignal();
    if (!currentRoom || currentRoom.players.length < 4) return;

    const allReady = currentRoom.players.every(p => p.isReady);
    if (allReady) {
      this.sendChatMessage('System', 'bottom', 'All players are ready! Match starting in 3 seconds...', true);
      
      // Stop latency check
      clearInterval(this.latencyInterval);

      setTimeout(() => {
        // Route to game table screen
        this.router.navigate(['/game']);
      }, 3000);
    }
  }

  leaveRoom() {
    this.soundService.playClick();
    this.roomSignal.set(null);
    clearInterval(this.latencyInterval);
    this.router.navigate(['/home']);
  }

  private startLatencySimulation() {
    clearInterval(this.latencyInterval);
    this.latencyInterval = setInterval(() => {
      const currentRoom = this.roomSignal();
      if (currentRoom) {
        // Add random slight fluctuation to latency for gaming feel
        const baseLatency = currentRoom.code.includes('MOCK') ? 45 : 20;
        const jitter = Math.floor(Math.random() * 8) - 4;
        this.roomSignal.set({
          ...currentRoom,
          latency: Math.max(12, baseLatency + jitter)
        });
      }
    }, 3000);
  }
}
