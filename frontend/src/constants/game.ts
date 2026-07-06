import type { Suit, Rank, PlayerPosition } from '../types/game';

export const CARD_POINTS: Record<Rank, number> = {
  'J': 3,
  '9': 2,
  'A': 1,
  '10': 1,
  'K': 0,
  'Q': 0,
  '8': 0,
  '7': 0,
};

export const CARD_VALUES: Record<Rank, number> = {
  'J': 8,
  '9': 7,
  'A': 6,
  '10': 5,
  'K': 4,
  'Q': 3,
  '8': 2,
  '7': 1,
};

export const MIN_BID = 16;
export const MAX_BID = 28;

export const TEAM_RED_POSITIONS: PlayerPosition[] = ['SOUTH', 'NORTH'];
export const TEAM_BLUE_POSITIONS: PlayerPosition[] = ['EAST', 'WEST'];

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  'SOUTH': 'You',
  'WEST': 'West',
  'NORTH': 'North',
  'EAST': 'East',
};

export const NEXT_POSITION: Record<PlayerPosition, PlayerPosition> = {
  'SOUTH': 'WEST',
  'WEST': 'NORTH',
  'NORTH': 'EAST',
  'EAST': 'SOUTH',
};

export const SUIT_INFO: Record<Suit, { name: string; symbol: string; color: string }> = {
  'HEARTS': { name: 'Hearts', symbol: '♥', color: 'text-suit-red' },
  'DIAMONDS': { name: 'Diamonds', symbol: '♦', color: 'text-suit-red' },
  'CLUBS': { name: 'Clubs', symbol: '♣', color: 'text-suit-black' },
  'SPADES': { name: 'Spades', symbol: '♠', color: 'text-suit-black' },
};
