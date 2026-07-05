export type Suit = 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
export type CardRank = 'J' | '9' | 'A' | '10' | 'K' | 'Q' | '8' | '7';

export interface Card {
  id: string; // e.g. "H_J"
  suit: Suit;
  rank: CardRank;
  points: number;
  faceUp: boolean;
}

export type GamePhase =
  | 'splash'
  | 'login'
  | 'register'
  | 'home'
  | 'lobby'
  | 'bidding'
  | 'double_declaration'
  | 'trump_selection'
  | 'single_hand_decision'
  | 'playing'
  | 'round_end'
  | 'match_end';

export type PlayerPosition = 'bottom' | 'left' | 'top' | 'right';

export interface Player {
  id: string;
  name: string;
  avatarId: string;
  position: PlayerPosition;
  cards: Card[];
  isDealer: boolean;
  isReady: boolean;
  isConnected: boolean;
  currentBid: number; // 0 if passed or not bidding
  isMyTurn: boolean;
  isCurrentUser: boolean;
}

export interface PlayedCard {
  playerId: string;
  position: PlayerPosition;
  card: Card;
}

export interface Score {
  teamRed: number;  // Team 1: bottom (User) & top (Partner)
  teamBlack: number; // Team 2: left & right (Opponents)
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  dealerId: string;
  leadPlayerId: string; // Player who led the current trick
  currentTurnId: string;
  highestBid: number; // Starts at 0, min bid 16, max 28
  bidderId: string; // Player who won the bidding
  trumpSuit: Suit | null;
  isTrumpRevealed: boolean;
  trumpRevealedInTrick: number; // Trick index where trump was revealed
  currentTrick: PlayedCard[];
  tricksPlayed: number; // 0 to 8
  roundPoints: Score; // Point totals in the current round (from Jacks, 9s, etc. out of 28/29)
  matchScores: Score; // Game points (red/black card indicators, normally -6 to +6)
  timerCount: number; // Timer remaining in seconds
  lastTrickWinnerId: string | null;
  capturedCardsRed: Card[];
  capturedCardsBlack: Card[];
  doubleState: 'none' | 'double' | 'redouble';
  doubleDeclayerId: string | null;
  singleHandResponses: Record<string, 'yes' | 'no' | 'waiting'>;
  isSingleHandActive: boolean;
  singleHandPlayerId: string | null;
  pairDeclaredBy: string | null; // 'red' | 'black' | null
  setOutcome: 'normal_win' | 'normal_loss' | 'set' | 'double_set' | 'redouble_set' | null;
  timeline: TimelineEvent[];
  remainingRounds: number;
}

export interface TimelineEvent {
  id: string;
  type: 'trump_selected' | 'trump_revealed' | 'single_hand' | 'double' | 'redouble' | 'pair' | 'round_winner' | 'set_outcome';
  text: string;
  timestamp: Date;
  playerName?: string;
  playerAvatar?: string;
  position?: PlayerPosition;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderPosition: PlayerPosition;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
}
