export type Suit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';

export type Rank = 'J' | '9' | 'A' | '10' | 'K' | 'Q' | '8' | '7';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  points: number;
  value: number; // For trick comparisons (J=8, 9=7, A=6, 10=5, K=4, Q=3, 8=2, 7=1)
  imageUrl?: string;
  isPlayed?: boolean;
}

export type PlayerPosition = 'SOUTH' | 'WEST' | 'NORTH' | 'EAST';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  position: PlayerPosition;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
  ping?: number;
}

export type RoomStatus = 'LOBBY' | 'BIDDING' | 'TRUMP_SELECTION' | 'PLAYING' | 'ROUND_OVER' | 'MATCH_OVER';

export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  status: RoomStatus;
  maxPlayers: number;
}

export interface Bid {
  playerId: string;
  value: number;
  isPass: boolean;
}

export interface TrickCard {
  playerId: string;
  card: Card;
}

export interface GameScore {
  redTeam: number;  // Players at SOUTH and NORTH
  blueTeam: number; // Players at EAST and WEST
}

export type DoubleStatus = 'NONE' | 'DOUBLE' | 'REDOUBLE';

export interface GameState {
  roomId: string;
  roomCode?: string;
  dealerPosition: PlayerPosition;
  turnPosition: PlayerPosition;
  biddingActive: boolean;
  highestBid: number;
  highestBidder?: PlayerPosition;
  biddingHistory: Bid[];
  trumpSuit?: Suit;
  isTrumpRevealed: boolean;
  trumpBidder?: PlayerPosition;
  hand: Card[]; // Current player's cards
  hands: Record<PlayerPosition, Card[]>; // All players' hands
  playedCards: Record<PlayerPosition, Card | null>; // Cards currently in the center trick
  tricksWon: Record<'RED' | 'BLUE', number>;
  roundScores: GameScore; // Current round points collected (cards won in tricks)
  matchScores: GameScore; // Overall game points (out of 28 / game rounds won red vs blue)
  doubleStatus: DoubleStatus;
  doubleDeclarer?: PlayerPosition;
  redoubleDeclarer?: PlayerPosition;
  singleHandActive: boolean;
  singleHandDeclarer?: PlayerPosition;
  pairDeclared?: {
    position: PlayerPosition;
    suit: Suit;
  };
  roundResult?: {
    winner: 'RED' | 'BLUE';
    scoreChange: number;
    reason: 'COMPLETED' | 'SINGLE_HAND' | 'DOUBLE' | 'REDOUBLE' | 'SET' | 'DOUBLE_SET' | 'REDOUBLE_SET';
  };
  isPairDeclarationAvailable?: boolean;
  isJokerTrump?: boolean;
  seventhCard?: Card;
}
