import { Player, ChatMessage } from './game.model';

export interface GameRoom {
  code: string;
  players: Player[];
  isLocked: boolean;
  maxPlayers: number;
  hostId: string;
  chatMessages: ChatMessage[];
  latency: number;
  connectionState: 'connected' | 'connecting' | 'disconnected';
}
