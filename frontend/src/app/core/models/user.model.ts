export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  currentRank: string;
  rankPoints: number;
  badges: string[];
  favoritePartner: string;
  highestScore: number;
}

export interface User {
  id: string;
  username: string;
  avatarId: string;
  coinCount: number;
  stats: UserStats;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number; // 0 to 100
}
