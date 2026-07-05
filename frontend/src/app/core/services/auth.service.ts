import { Injectable, signal, computed } from '@angular/core';
import { User, UserStats } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Use Angular Signals to represent authentication state and current user
  private currentUserSignal = signal<User | null>(null);

  // Read-only public signals for clean consumption
  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  private readonly STORAGE_KEY = 'royal_club_user_session';

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.currentUserSignal.set(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem(this.STORAGE_KEY);
        this.setMockUser();
      }
    } else {
      this.setMockUser();
    }
  }

  private setMockUser() {
    // Generate a default mock profile if no login is found
    const defaultStats: UserStats = {
      gamesPlayed: 142,
      gamesWon: 89,
      winRate: 62.6,
      currentRank: 'Grandmaster II',
      rankPoints: 2450,
      badges: ['First Blood', 'Trump Master', 'Perfect 29', 'Streak King'],
      favoritePartner: 'ZeusAI',
      highestScore: 28
    };

    const defaultUser: User = {
      id: 'usr_mock_123',
      username: 'RoyalPlayer',
      avatarId: 'avatar_gold_tiger',
      coinCount: 15400,
      stats: defaultStats
    };

    this.currentUserSignal.set(defaultUser);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultUser));
  }

  login(username: string, passwordHash: string): boolean {
    // Basic verification - for mock gaming purposes, any user with length > 3 passes
    if (username && username.trim().length >= 3) {
      const stats: UserStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        winRate: 0,
        currentRank: 'Bronze I',
        rankPoints: 100,
        badges: [],
        favoritePartner: 'None',
        highestScore: 0
      };

      const user: User = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        username: username.trim(),
        avatarId: 'avatar_default_' + (Math.floor(Math.random() * 4) + 1),
        coinCount: 500, // Starting bonus
        stats
      };

      this.currentUserSignal.set(user);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      return true;
    }
    return false;
  }

  register(username: string, passwordHash: string, avatarId: string): boolean {
    if (username && username.trim().length >= 3) {
      const stats: UserStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        winRate: 0,
        currentRank: 'Bronze I',
        rankPoints: 100,
        badges: [],
        favoritePartner: 'None',
        highestScore: 0
      };

      const user: User = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        username: username.trim(),
        avatarId: avatarId || 'avatar_default_1',
        coinCount: 1000, // Register bonus
        stats
      };

      this.currentUserSignal.set(user);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout() {
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    // Reload mock user for demo playability
    setTimeout(() => this.setMockUser(), 100);
  }

  addCoins(amount: number) {
    const user = this.currentUserSignal();
    if (user) {
      const updated = {
        ...user,
        coinCount: user.coinCount + amount
      };
      this.currentUserSignal.set(updated);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    }
  }

  updateStats(won: boolean, score: number) {
    const user = this.currentUserSignal();
    if (user) {
      const stats = user.stats;
      const gamesPlayed = stats.gamesPlayed + 1;
      const gamesWon = stats.gamesWon + (won ? 1 : 0);
      const winRate = parseFloat(((gamesWon / gamesPlayed) * 100).toFixed(1));
      const rankPoints = stats.rankPoints + (won ? 25 : -15);
      
      // Determine Rank title based on points
      let currentRank = 'Bronze I';
      if (rankPoints > 2000) currentRank = 'Grandmaster II';
      else if (rankPoints > 1500) currentRank = 'Platinum IV';
      else if (rankPoints > 1000) currentRank = 'Gold III';
      else if (rankPoints > 500) currentRank = 'Silver II';

      const highestScore = Math.max(stats.highestScore, score);

      const updated = {
        ...user,
        stats: {
          ...stats,
          gamesPlayed,
          gamesWon,
          winRate,
          rankPoints,
          currentRank,
          highestScore
        }
      };
      this.currentUserSignal.set(updated);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    }
  }
}
