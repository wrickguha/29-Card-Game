import { create } from 'zustand';
import type { GameState, Card, Suit, PlayerPosition, Bid } from '../types/game';
import { CARD_POINTS, CARD_VALUES, NEXT_POSITION } from '../constants/game';
import { useUIStore } from './useUIStore';

interface GameStoreState {
  gameState: GameState | null;
  statusText: string;
  isYourTurn: boolean;
  timerCount: number;
  timerIntervalId: any | null;

  // Actions
  initGame: (roomId: string) => void;
  startBidding: () => void;
  placeBid: (bidValue: number) => void;
  passBid: () => void;
  selectTrump: (suit: Suit) => void;
  revealTrump: () => void;
  playCard: (cardId: string) => void;
  respondSingleHand: (play: boolean) => void;
  declarePair: () => void;
  declareDouble: () => void;
  declareRedouble: () => void;
  startTimer: (duration: number, onTimeout: () => void) => void;
  stopTimer: () => void;
  resetGame: () => void;
}

// Helpers to generate cards
const generateDeck = (): Card[] => {
  const suits: Suit[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
  const ranks: { rank: Rank; points: number; value: number }[] = [
    { rank: 'J', points: 3, value: 8 },
    { rank: '9', points: 2, value: 7 },
    { rank: 'A', points: 1, value: 6 },
    { rank: '10', points: 1, value: 5 },
    { rank: 'K', points: 0, value: 4 },
    { rank: 'Q', points: 0, value: 3 },
    { rank: '8', points: 0, value: 2 },
    { rank: '7', points: 0, value: 1 },
  ];

  type Rank = 'J' | '9' | 'A' | '10' | 'K' | 'Q' | '8' | '7';
  const deck: Card[] = [];
  suits.forEach((suit) => {
    ranks.forEach(({ rank, points, value }) => {
      deck.push({
        id: `${suit}_${rank}`,
        suit,
        rank,
        points,
        value,
      });
    });
  });
  return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const sortCards = (cards: Card[]): Card[] => {
  const SUIT_ORDER: Record<Suit, number> = {
    'SPADES': 0,
    'DIAMONDS': 1,
    'CLUBS': 2,
    'HEARTS': 3,
  };
  return [...cards].sort((a, b) => {
    if (a.suit !== b.suit) {
      return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    }
    return CARD_VALUES[b.rank] - CARD_VALUES[a.rank];
  });
};

export const useGameStore = create<GameStoreState>((set, get) => {
  // Bot Bidding behavior simulation
  const simulateBotBidding = () => {
    setTimeout(() => {
      const state = get().gameState;
      if (!state || !state.biddingActive) return;

      const activePos = state.turnPosition;
      if (activePos === 'SOUTH') return; // User turn, don't simulate

      // Simple AI logic: bid if they have high cards, else pass
      const randomChance = Math.random();
      const currentHighest = state.highestBid;

      if (currentHighest < 20 && randomChance > 0.45) {
        const nextBid = currentHighest === 0 ? 16 : currentHighest + 1;
        get().placeBid(nextBid);
      } else {
        get().passBid();
      }
    }, 1500);
  };

  // Bot card playing behavior simulation
  const simulateBotPlay = () => {
    setTimeout(() => {
      const state = get().gameState;
      if (!state || state.biddingActive || state.roundResult) return;

      const turn = state.turnPosition;
      if (turn === 'SOUTH') return; // User turn

      // Determine lead suit of the trick if cards have been played
      let leadSuit: Suit | null = null;
      const leadPosition = (['SOUTH', 'WEST', 'NORTH', 'EAST'] as PlayerPosition[]).find(
        (pos) => pos !== turn && state.playedCards[pos] !== null
      );
      if (leadPosition) {
        leadSuit = state.playedCards[leadPosition]!.suit;
      }

      // Generate a mock card for the bot that matches rules
      const suits: Suit[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
      const ranks: ('J' | '9' | 'A' | '10' | 'K' | 'Q' | '8' | '7')[] = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'];
      
      let botCardSuit = leadSuit || suits[Math.floor(Math.random() * 4)];
      // If following lead suit, 90% chance to follow, 10% chance to ruff/discard if they "don't have it"
      if (leadSuit && Math.random() < 0.15) {
        botCardSuit = suits.find((s) => s !== leadSuit) || 'HEARTS';
        // If they played a different suit, they might reveal trump if hidden
        if (!state.isTrumpRevealed && state.trumpSuit && Math.random() > 0.5) {
          get().revealTrump();
        }
      }

      const botCard: Card = {
        id: `bot_${turn}_${botCardSuit}_${Date.now()}`,
        suit: botCardSuit,
        rank: ranks[Math.floor(Math.random() * ranks.length)],
        points: 0, // Points and values will be computed on evaluation
        value: Math.floor(Math.random() * 8) + 1,
      };

      botCard.points = CARD_POINTS[botCard.rank as keyof typeof CARD_POINTS] || 0;
      botCard.value = CARD_VALUES[botCard.rank as keyof typeof CARD_VALUES] || 1;

      // Update state with bot card
      set((s) => {
        if (!s.gameState) return s;
        const newPlayed = { ...s.gameState.playedCards };
        newPlayed[turn] = botCard;

        const nextTurn = NEXT_POSITION[turn];
        return {
          statusText: `${turn} played ${botCard.rank} of ${botCard.suit}`,
          gameState: {
            ...s.gameState,
            playedCards: newPlayed,
            turnPosition: nextTurn,
          },
          isYourTurn: nextTurn === 'SOUTH',
        };
      });

      // Start timer for next player or evaluate trick
      const updatedState = get().gameState!;
      const trickFinished = Object.values(updatedState.playedCards).every((c) => c !== null);

      if (trickFinished) {
        get().startTimer(5, () => {});
        setTimeout(() => {
          evaluateTrick();
        }, 1500);
      } else {
        get().startTimer(15, () => {
          // Auto play on timeout
        });
        if (updatedState.turnPosition !== 'SOUTH') {
          simulateBotPlay();
        }
      }
    }, 1500);
  };

  // Evaluates which player won the trick
  const evaluateTrick = () => {
    const state = get().gameState;
    if (!state) return;

    const played = state.playedCards;
    // Determine the lead suit (played by dealer or first player)
    // For mock simplicity, we determine trick winner based on:
    // 1. Highest trump card played (if trump is revealed)
    // 2. Highest card of lead suit
    // But since turn position is updated to the next, we find the winner
    let leadSuit: Suit | null = null;
    
    // In our simplified bot simulation, South starts first or we track lead suit
    // Let's assume SOUTH or the first non-null card was lead
    const positionsOrder: PlayerPosition[] = ['SOUTH', 'WEST', 'NORTH', 'EAST'];
    // Find the card played first in this trick
    // Since we don't store order directly, let's find the card that matches lead suit or trump
    // Let's assume South leads for simplicity of evaluating lead suit if we don't have it
    leadSuit = played.SOUTH?.suit || played.WEST?.suit || played.NORTH?.suit || played.EAST?.suit || 'HEARTS';

    let winnerPos: PlayerPosition = 'SOUTH';
    let highestVal = -1;
    let trumpPlayed = false;

    positionsOrder.forEach((pos) => {
      const card = played[pos];
      if (!card) return;

      const isTrump = state.isTrumpRevealed && card.suit === state.trumpSuit;
      
      if (isTrump) {
        if (!trumpPlayed) {
          trumpPlayed = true;
          highestVal = card.value;
          winnerPos = pos;
        } else if (card.value > highestVal) {
          highestVal = card.value;
          winnerPos = pos;
        }
      } else if (!trumpPlayed && card.suit === leadSuit) {
        if (card.value > highestVal) {
          highestVal = card.value;
          winnerPos = pos;
        }
      }
    });

    // Calculate points in this trick
    let trickPoints = 0;
    positionsOrder.forEach((pos) => {
      const card = played[pos];
      if (card) {
        trickPoints += CARD_POINTS[card.rank] || 0;
      }
    });

    // Last trick gets +1 point
    const currentTricksTotal = state.tricksWon.RED + state.tricksWon.BLUE;
    if (currentTricksTotal === 7) {
      trickPoints += 1;
    }

    const isRedWinner = winnerPos === 'SOUTH' || winnerPos === 'NORTH';
    const winningTeam = isRedWinner ? 'RED' : 'BLUE';

    set((s) => {
      if (!s.gameState) return s;
      
      const newTricksWon = { ...s.gameState.tricksWon };
      newTricksWon[winningTeam] += 1;

      const newRoundScores = { ...s.gameState.roundScores };
      if (winningTeam === 'RED') {
        newRoundScores.redTeam += trickPoints;
      } else {
        newRoundScores.blueTeam += trickPoints;
      }

      const totalTricks = newTricksWon.RED + newTricksWon.BLUE;
      const isRoundOver = totalTricks === 8;

      // Reset played cards for next trick
      const clearedPlayed: Record<PlayerPosition, Card | null> = {
        SOUTH: null,
        WEST: null,
        NORTH: null,
        EAST: null,
      };

      let roundResultState = s.gameState.roundResult;
      let matchScoresState = { ...s.gameState.matchScores };

      if (isRoundOver) {
        // Evaluate who won the round based on target bid
        const bidderPos = s.gameState.highestBidder || 'SOUTH';
        const bidderTeam = bidderPos === 'SOUTH' || bidderPos === 'NORTH' ? 'RED' : 'BLUE';
        const targetBid = s.gameState.highestBid;
        const bidPointsWon = bidderTeam === 'RED' ? newRoundScores.redTeam : newRoundScores.blueTeam;
        
        // Add Pair modifier if any
        let finalTarget = targetBid;
        if (s.gameState.pairDeclared) {
          const pairTeam = s.gameState.pairDeclared.position === 'SOUTH' || s.gameState.pairDeclared.position === 'NORTH' ? 'RED' : 'BLUE';
          if (pairTeam === bidderTeam) {
            finalTarget = Math.max(16, targetBid - 4);
          } else {
            finalTarget = Math.min(28, targetBid + 4);
          }
        }

        const isBidMet = bidPointsWon >= finalTarget;
        const roundWinnerTeam = isBidMet ? bidderTeam : (bidderTeam === 'RED' ? 'BLUE' : 'RED');
        
        let scoreChange = 1;
        if (s.gameState.doubleStatus === 'DOUBLE') scoreChange = 2;
        if (s.gameState.doubleStatus === 'REDOUBLE') scoreChange = 4;
        if (s.gameState.singleHandActive) scoreChange = 3; // custom rule or 3 game points

        if (roundWinnerTeam === 'RED') {
          matchScoresState.redTeam += scoreChange;
        } else {
          matchScoresState.blueTeam += scoreChange;
        }



        roundResultState = {
          winner: roundWinnerTeam,
          scoreChange,
          reason: s.gameState.singleHandActive ? 'SINGLE_HAND' : 
                  (s.gameState.doubleStatus === 'REDOUBLE' ? 'REDOUBLE_SET' : 
                  (s.gameState.doubleStatus === 'DOUBLE' ? 'DOUBLE_SET' : 'COMPLETED')),
        };


      }

      return {
        statusText: isRoundOver 
          ? `Round finished! ${winningTeam} team wins trick. ${roundResultState?.winner} team wins the round (+${roundResultState?.scoreChange})` 
          : `${winnerPos} wins the trick (+${trickPoints} pts) and leads next!`,
        isYourTurn: !isRoundOver && winnerPos === 'SOUTH',
        gameState: {
          ...s.gameState,
          playedCards: clearedPlayed,
          tricksWon: newTricksWon,
          roundScores: newRoundScores,
          matchScores: matchScoresState,
          turnPosition: winnerPos,
          roundResult: roundResultState,
        },
      };
    });

    const currentGameState = get().gameState!;
    if (currentGameState.roundResult) {
      get().stopTimer();
      useUIStore.getState().openModal('RESULTS');
    } else {
      get().startTimer(15, () => {});
      if (currentGameState.turnPosition !== 'SOUTH') {
        simulateBotPlay();
      }
    }
  };

  return {
    gameState: null,
    statusText: 'Waiting to start game...',
    isYourTurn: false,
    timerCount: 15,
    timerIntervalId: null,

    initGame: (roomId) => {
      const deck = shuffleDeck(generateDeck());
      // Deal 4 cards first
      const southHand = sortCards(deck.slice(0, 4));
      const playedCardsInit: Record<PlayerPosition, Card | null> = {
        SOUTH: null,
        WEST: null,
        NORTH: null,
        EAST: null,
      };

      const initialScores = { redTeam: 0, blueTeam: 0 };
      const initialMatchScores = { redTeam: 0, blueTeam: 0 };

      const initialState: GameState = {
        roomId,
        dealerPosition: 'EAST',
        turnPosition: 'SOUTH', // South starts bidding
        biddingActive: true,
        highestBid: 0,
        biddingHistory: [],
        isTrumpRevealed: false,
        hand: southHand,
        playedCards: playedCardsInit,
        tricksWon: { RED: 0, BLUE: 0 },
        roundScores: initialScores,
        matchScores: initialMatchScores,
        doubleStatus: 'NONE',
        singleHandActive: false,
      };

      set({
        gameState: initialState,
        statusText: 'Bidding phase started. Make your bid or pass.',
        isYourTurn: true,
        timerCount: 15,
      });

      get().startTimer(15, () => {
        get().passBid();
      });
    },

    startBidding: () => {
      set((s) => {
        if (!s.gameState) return s;
        return {
          gameState: {
            ...s.gameState,
            biddingActive: true,
            turnPosition: 'SOUTH',
          },
          statusText: 'Bidding has started. The dealer is EAST.',
          isYourTurn: true,
        };
      });
      get().startTimer(15, () => get().passBid());
    },

    placeBid: (bidValue) => {
      const state = get().gameState;
      if (!state || !state.biddingActive) return;

      const bidder = state.turnPosition;
      const newBid: Bid = {
        playerId: bidder,
        value: bidValue,
        isPass: false,
      };

      set((s) => {
        if (!s.gameState) return s;
        const history = [...s.gameState.biddingHistory, newBid];
        const nextPos = NEXT_POSITION[bidder];
        return {
          statusText: `${bidder} bids ${bidValue}`,
          gameState: {
            ...s.gameState,
            highestBid: bidValue,
            highestBidder: bidder,
            biddingHistory: history,
            turnPosition: nextPos,
          },
          isYourTurn: nextPos === 'SOUTH',
        };
      });

      // Reset timer
      get().startTimer(15, () => get().passBid());

      // If next is bot, trigger AI bidding
      const updatedState = get().gameState!;
      const activeBids = updatedState.biddingHistory;
      // Simple check: if last 3 turns are passes after at least one bid, bidding ends.
      // For mock: if 3 consecutive passes occur, end bidding
      const consecutivePassesCount = activeBids.slice(-3).filter(b => b.isPass).length;
      const passEnd = activeBids.length >= 4 && consecutivePassesCount === 3;
      const allPassed = activeBids.length === 4 && activeBids.filter(b => b.isPass).length === 4;

      if (passEnd || allPassed) {
        // Bidding Over!
        get().stopTimer();
        // Set default highest bidder as SOUTH if all pass, with 16
        set((s) => {
          if (!s.gameState) return s;
          const bidder = s.gameState.highestBidder || 'SOUTH';
          const bidVal = s.gameState.highestBid || 16;
          return {
            statusText: `Bidding finished! ${bidder} won with ${bidVal}. Selecting Trump...`,
            isYourTurn: bidder === 'SOUTH',
            gameState: {
              ...s.gameState,
              highestBidder: bidder,
              highestBid: bidVal,
              biddingActive: false,
              turnPosition: bidder,
            },
          };
        });

        // Trigger Trump Selection modal
        const winnerBidder = get().gameState!.highestBidder;
        if (winnerBidder === 'SOUTH') {
          useUIStore.getState().openModal('TRUMP_SELECT');
        } else {
          // Bot selects random suit after delay
          setTimeout(() => {
            const suits: Suit[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
            get().selectTrump(suits[Math.floor(Math.random() * 4)]);
          }, 1500);
        }
      } else {
        if (updatedState.turnPosition !== 'SOUTH') {
          simulateBotBidding();
        }
      }
    },

    passBid: () => {
      const state = get().gameState;
      if (!state || !state.biddingActive) return;

      const bidder = state.turnPosition;
      const newBid: Bid = {
        playerId: bidder,
        value: 0,
        isPass: true,
      };

      set((s) => {
        if (!s.gameState) return s;
        const history = [...s.gameState.biddingHistory, newBid];
        const nextPos = NEXT_POSITION[bidder];
        return {
          statusText: `${bidder} passes`,
          gameState: {
            ...s.gameState,
            biddingHistory: history,
            turnPosition: nextPos,
          },
          isYourTurn: nextPos === 'SOUTH',
        };
      });

      get().startTimer(15, () => get().passBid());

      const updatedState = get().gameState!;
      const activeBids = updatedState.biddingHistory;
      const consecutivePassesCount = activeBids.slice(-3).filter(b => b.isPass).length;
      
      const passEnd = activeBids.length >= 4 && consecutivePassesCount === 3;
      const allPassed = activeBids.length === 4 && activeBids.filter(b => b.isPass).length === 4;

      if (passEnd || allPassed) {
        get().stopTimer();
        set((s) => {
          if (!s.gameState) return s;
          const bidder = s.gameState.highestBidder || 'SOUTH';
          const bidVal = s.gameState.highestBid || 16;
          return {
            statusText: `Bidding finished! ${bidder} won with ${bidVal}. Selecting Trump...`,
            isYourTurn: bidder === 'SOUTH',
            gameState: {
              ...s.gameState,
              highestBidder: bidder,
              highestBid: bidVal,
              biddingActive: false,
              turnPosition: bidder,
            },
          };
        });

        const winnerBidder = get().gameState!.highestBidder;
        if (winnerBidder === 'SOUTH') {
          useUIStore.getState().openModal('TRUMP_SELECT');
        } else {
          setTimeout(() => {
            const suits: Suit[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
            get().selectTrump(suits[Math.floor(Math.random() * 4)]);
          }, 1500);
        }
      } else {
        if (updatedState.turnPosition !== 'SOUTH') {
          simulateBotBidding();
        }
      }
    },

    selectTrump: (suit) => {
      const state = get().gameState;
      if (!state) return;

      // Deal remaining 4 cards to complete hand (8 cards total)
      const deck = shuffleDeck(generateDeck());
      // Exclude cards already in hand
      const existingIds = state.hand.map(c => c.id);
      const remainingCards = deck.filter(c => !existingIds.includes(c.id));
      // Deal remaining 4 cards matching the same suit for card testing
      const newHand = sortCards([...state.hand, ...remainingCards.slice(0, 4)]);

      set((s) => {
        if (!s.gameState) return s;
        return {
          statusText: 'Trump suit selected. Second round of cards dealt. Before we start, would anyone like to play Single Hand?',
          activeModal: 'SINGLE_HAND', // Prompt Single Hand
          gameState: {
            ...s.gameState,
            trumpSuit: suit,
            trumpBidder: s.gameState.highestBidder,
            hand: newHand,
          },
        };
      });

      get().startTimer(10, () => {
        get().respondSingleHand(false);
      });
    },

    respondSingleHand: (play) => {
      useUIStore.getState().closeModal();
      get().stopTimer();

      set((s) => {
        if (!s.gameState) return s;
        const leader = NEXT_POSITION[s.gameState.dealerPosition]; // Player next to dealer leads
        return {
          statusText: play 
            ? `South declared SINGLE HAND! South will play alone.` 
            : `Game starts. Lead played by ${leader}.`,
          isYourTurn: leader === 'SOUTH',
          gameState: {
            ...s.gameState,
            singleHandActive: play,
            singleHandDeclarer: play ? 'SOUTH' : undefined,
            turnPosition: leader,
          },
        };
      });

      // Start gameplay loop
      get().startTimer(15, () => {});
      const updatedState = get().gameState!;
      if (updatedState.turnPosition !== 'SOUTH') {
        simulateBotPlay();
      }
    },

    revealTrump: () => {
      set((s) => {
        if (!s.gameState) return s;
        return {
          statusText: `Trump suit has been REVEALED: ${s.gameState.trumpSuit}!`,
          gameState: {
            ...s.gameState,
            isTrumpRevealed: true,
          },
        };
      });
    },

    playCard: (cardId) => {
      const state = get().gameState;
      if (!state || state.turnPosition !== 'SOUTH') return;

      const card = state.hand.find(c => c.id === cardId);
      if (!card) return;

      // Rules check (must follow suit if possible)
      // Check if lead suit is present in played cards
      let leadSuit: Suit | null = null;
      const positionsOrder: PlayerPosition[] = ['SOUTH', 'WEST', 'NORTH', 'EAST'];
      const leadPos = positionsOrder.find(pos => state.playedCards[pos] !== null);
      if (leadPos) {
        leadSuit = state.playedCards[leadPos]!.suit;
      }

      if (leadSuit && card.suit !== leadSuit) {
        // Player is not following suit. Check if they have lead suit in hand
        const hasLeadSuit = state.hand.some(c => c.suit === leadSuit);
        if (hasLeadSuit) {
          // Rule violation: must follow suit
          alert(`You must follow suit! Lead suit is ${leadSuit}.`);
          return;
        }
      }

      // Valid play
      const newHand = state.hand.filter(c => c.id !== cardId);
      const newPlayed = { ...state.playedCards };
      newPlayed.SOUTH = card;

      get().stopTimer();

      set((s) => {
        if (!s.gameState) return s;
        const nextPos = NEXT_POSITION['SOUTH'];
        return {
          statusText: `You played ${card.rank} of ${card.suit}`,
          isYourTurn: false,
          gameState: {
            ...s.gameState,
            hand: newHand,
            playedCards: newPlayed,
            turnPosition: nextPos,
          },
        };
      });

      // Check if trick finished
      const updatedState = get().gameState!;
      const trickFinished = Object.values(updatedState.playedCards).every((c) => c !== null);

      if (trickFinished) {
        // Wait 1.5 seconds to show trick cards before collecting
        get().startTimer(5, () => {});
        setTimeout(() => {
          evaluateTrick();
        }, 1500);
      } else {
        get().startTimer(15, () => {});
        if (updatedState.turnPosition !== 'SOUTH') {
          simulateBotPlay();
        }
      }
    },

    declarePair: () => {
      const state = get().gameState;
      if (!state || !state.isTrumpRevealed || !state.trumpSuit) return;

      // Check if player holds King and Queen of Trump suit
      const hasKing = state.hand.some(c => c.suit === state.trumpSuit && c.rank === 'K');
      const hasQueen = state.hand.some(c => c.suit === state.trumpSuit && c.rank === 'Q');

      if (!hasKing || !hasQueen) {
        alert("You must hold both the King and Queen of the trump suit to declare a Pair!");
        return;
      }

      set((s) => {
        if (!s.gameState) return s;
        return {
          statusText: 'South declared a Pair of Trump! Suit values modified.',
          gameState: {
            ...s.gameState,
            pairDeclared: {
              position: 'SOUTH',
              suit: s.gameState.trumpSuit!,
            },
          },
        };
      });
    },

    declareDouble: () => {
      set((s) => {
        if (!s.gameState) return s;
        return {
          statusText: 'South declared DOUBLE! Round stakes doubled.',
          gameState: {
            ...s.gameState,
            doubleStatus: 'DOUBLE',
            doubleDeclarer: 'SOUTH',
          },
        };
      });
    },

    declareRedouble: () => {
      set((s) => {
        if (!s.gameState) return s;
        return {
          statusText: 'South declared REDOUBLE! Round stakes quadrupled.',
          gameState: {
            ...s.gameState,
            doubleStatus: 'REDOUBLE',
            redoubleDeclarer: 'SOUTH',
          },
        };
      });
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

    resetGame: () => {
      get().stopTimer();
      set({ gameState: null, statusText: 'Waiting to start game...', isYourTurn: false });
    },
  };
});
