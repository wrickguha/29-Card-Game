import { create } from 'zustand';
import type { GameState, Suit } from '../types/game';
import { api } from '../services/api';
import { useUIStore } from './useUIStore';

interface GameStoreState {
  gameState: GameState | null;
  statusText: string;
  isYourTurn: boolean;
  timerCount: number;
  timerIntervalId: any | null;
  pollIntervalId: any | null;

  // Actions
  joinGame: (gameId: string) => void;
  placeBid: (bidValue: number) => Promise<void>;
  passBid: () => Promise<void>;
  selectTrump: (suit: Suit) => Promise<void>;
  revealTrump: () => Promise<void>;
  playCard: (cardId: string) => Promise<void>;
  respondSingleHand: (play: boolean) => Promise<void>;
  declarePair: () => Promise<void>;
  declareDouble: () => Promise<void>;
  declareRedouble: () => Promise<void>;
  startTimer: (duration: number, onTimeout: () => void) => void;
  stopTimer: () => void;
  startPollingGame: (gameId: string) => void;
  stopPollingGame: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => {
  return {
    gameState: null,
    statusText: 'Waiting to start game...',
    isYourTurn: false,
    timerCount: 15,
    timerIntervalId: null,
    pollIntervalId: null,

    joinGame: (gameId) => {
      get().startPollingGame(gameId);
    },

    placeBid: async (bidValue) => {
      const state = get().gameState;
      if (!state) return;

      try {
        const response = await api.games.placeBid(state.roomId, bidValue, false);
        if (response.success) {
          // Immediately fetch state to update UI
          const stateRes = await api.games.getState(state.roomId);
          if (stateRes.success) {
            const updated = stateRes.data;
            set({
              gameState: updated,
              isYourTurn: updated.turnPosition === 'SOUTH',
              statusText: `You placed a bid of ${bidValue}`,
            });
          }
        }
      } catch (err: any) {
        console.error('Place bid error', err);
      }
    },

    passBid: async () => {
      const state = get().gameState;
      if (!state) return;

      try {
        const response = await api.games.placeBid(state.roomId, 0, true);
        if (response.success) {
          const stateRes = await api.games.getState(state.roomId);
          if (stateRes.success) {
            const updated = stateRes.data;
            set({
              gameState: updated,
              isYourTurn: updated.turnPosition === 'SOUTH',
              statusText: 'You passed your bid',
            });
          }
        }
      } catch (err: any) {
        console.error('Pass bid error', err);
      }
    },

    selectTrump: async (suit) => {
      const state = get().gameState;
      if (!state) return;

      try {
        const response = await api.games.selectTrump(state.roomId, suit);
        if (response.success) {
          const stateRes = await api.games.getState(state.roomId);
          if (stateRes.success) {
            const updated = stateRes.data;
            set({
              gameState: updated,
              isYourTurn: updated.turnPosition === 'SOUTH',
              statusText: `You selected ${suit} as the Trump suit`,
            });
          }
        }
      } catch (err: any) {
        console.error('Select trump error', err);
      }
    },

    revealTrump: async () => {
      const state = get().gameState;
      if (!state) return;

      try {
        const response = await api.games.revealTrump(state.roomId);
        if (response.success) {
          const stateRes = await api.games.getState(state.roomId);
          if (stateRes.success) {
            const updated = stateRes.data;
            set({
              gameState: updated,
              isYourTurn: updated.turnPosition === 'SOUTH',
              statusText: 'Trump suit has been revealed!',
            });
          }
        }
      } catch (err: any) {
        console.error('Reveal trump error', err);
      }
    },

    playCard: async (cardId) => {
      const state = get().gameState;
      if (!state) return;

      try {
        const response = await api.games.playCard(state.roomId, cardId);
        if (response.success) {
          const stateRes = await api.games.getState(state.roomId);
          if (stateRes.success) {
            const updated = stateRes.data;
            set({
              gameState: updated,
              isYourTurn: updated.turnPosition === 'SOUTH',
              statusText: 'You played a card.',
            });
          }
        }
      } catch (err: any) {
        console.error('Play card error', err);
        // Alert error message (e.g. must follow suit)
        alert(err.message || 'Invalid card play.');
      }
    },

    respondSingleHand: async (play) => {
      const state = get().gameState;
      if (!state) return;

      try {
        const response = await api.games.declareSingleHand(state.roomId, play);
        if (response.success) {
          useUIStore.getState().closeModal();
          const stateRes = await api.games.getState(state.roomId);
          if (stateRes.success) {
            const updated = stateRes.data;
            set({
              gameState: updated,
              isYourTurn: updated.turnPosition === 'SOUTH',
              statusText: play ? 'You declared SINGLE HAND!' : 'Match starts.',
            });
          }
        }
      } catch (err: any) {
        console.error('Single hand error', err);
      }
    },

    declarePair: async () => {
      const state = get().gameState;
      if (!state) return;

      try {
        const response = await api.games.declarePair(state.roomId);
        if (response.success) {
          const stateRes = await api.games.getState(state.roomId);
          if (stateRes.success) {
            const updated = stateRes.data;
            set({
              gameState: updated,
              statusText: 'You declared a Pair of Trump!',
            });
          }
        }
      } catch (err: any) {
        console.error('Declare pair error', err);
      }
    },

    declareDouble: async () => {
      const state = get().gameState;
      if (!state) return;

      try {
        const response = await api.games.declareDouble(state.roomId);
        if (response.success) {
          const stateRes = await api.games.getState(state.roomId);
          if (stateRes.success) {
            const updated = stateRes.data;
            set({
              gameState: updated,
              statusText: 'You declared DOUBLE!',
            });
          }
        }
      } catch (err: any) {
        console.error('Declare double error', err);
      }
    },

    declareRedouble: async () => {
      const state = get().gameState;
      if (!state) return;

      try {
        const response = await api.games.declareRedouble(state.roomId);
        if (response.success) {
          const stateRes = await api.games.getState(state.roomId);
          if (stateRes.success) {
            const updated = stateRes.data;
            set({
              gameState: updated,
              statusText: 'You declared REDOUBLE!',
            });
          }
        }
      } catch (err: any) {
        console.error('Declare redouble error', err);
      }
    },

    startTimer: (duration, onTimeout) => {
      get().stopTimer();
      set({ timerCount: duration });
      const id = setInterval(() => {
        set((s) => {
          if (s.timerCount <= 1) {
            clearInterval(s.timerIntervalId);
            onTimeout();
            return { timerCount: 0, timerIntervalId: null };
          }
          return { timerCount: s.timerCount - 1 };
        });
      }, 1000);
      set({ timerIntervalId: id });
    },

    stopTimer: () => {
      const id = get().timerIntervalId;
      if (id) {
        clearInterval(id);
        set({ timerIntervalId: null, timerCount: 15 });
      }
    },

    startPollingGame: (gameId) => {
      get().stopPollingGame();

      const fetchGameState = async () => {
        try {
          const response = await api.games.getState(gameId);
          if (response.success && response.data) {
            const updated = response.data;
            
            // Check if we need to show the Single Hand prompt modal
            if (updated.phase === 'SINGLE_HAND_PROMPT' && updated.turnPosition === 'SOUTH') {
              const currentModal = useUIStore.getState().activeModal;
              if (currentModal !== 'SINGLE_HAND') {
                useUIStore.getState().openModal('SINGLE_HAND');
              }
            } else if (updated.phase === 'TRUMP_SELECT' && updated.turnPosition === 'SOUTH') {
              const currentModal = useUIStore.getState().activeModal;
              if (currentModal !== 'TRUMP_SELECT') {
                useUIStore.getState().openModal('TRUMP_SELECT');
              }
            }

            // Check if round is over to show results
            if (updated.phase === 'ROUND_OVER' || updated.roundResult) {
              const currentModal = useUIStore.getState().activeModal;
              if (currentModal !== 'RESULTS') {
                useUIStore.getState().openModal('RESULTS');
              }
            }

            // Map turn status text description
            let desc = '';
            if (updated.phase === 'BIDDING') {
              desc = `Bidding phase active. Current highest bid: ${updated.highestBid} by ${updated.highestBidder || 'None'}.`;
              if (updated.turnPosition === 'SOUTH') {
                desc += ' Your turn to bid or pass.';
              } else {
                desc += ` Waiting for ${updated.turnPosition} to bid.`;
              }
            } else if (updated.phase === 'TRUMP_SELECT') {
              desc = `Selecting Trump suit. Highest bidder: ${updated.highestBidder}.`;
              if (updated.turnPosition === 'SOUTH') {
                desc += ' Select the trump suit now.';
              }
            } else if (updated.phase === 'SINGLE_HAND_PROMPT') {
              desc = 'Would you like to play Single Hand?';
            } else if (updated.phase === 'PLAYING') {
              desc = `Playing cards. Trump revealed: ${updated.isTrumpRevealed ? updated.trumpSuit : 'No'}.`;
              if (updated.turnPosition === 'SOUTH') {
                desc += ' Your turn to play a card.';
              } else {
                desc += ` Waiting for ${updated.turnPosition} to play.`;
              }
            } else if (updated.phase === 'ROUND_OVER') {
              desc = 'Round has finished!';
            } else if (updated.phase === 'MATCH_OVER') {
              desc = `Match completed! Winner: ${updated.roundResult?.winner || 'None'}`;
            }

            set({
              gameState: updated,
              isYourTurn: updated.turnPosition === 'SOUTH' && ['BIDDING', 'TRUMP_SELECT', 'PLAYING', 'SINGLE_HAND_PROMPT'].includes(updated.phase),
              statusText: desc,
            });
          }
        } catch (err) {
          console.error('Error polling game state', err);
        }
      };

      fetchGameState();
      const intervalId = setInterval(fetchGameState, 1500);
      set({ pollIntervalId: intervalId });
    },

    stopPollingGame: () => {
      const intervalId = get().pollIntervalId;
      if (intervalId) {
        clearInterval(intervalId);
        set({ pollIntervalId: null });
      }
    },

    resetGame: () => {
      get().stopTimer();
      get().stopPollingGame();
      set({ gameState: null, statusText: 'Waiting to start game...', isYourTurn: false });
    },
  };
});
