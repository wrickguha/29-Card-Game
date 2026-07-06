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
  toggleTrumpMode: () => void;
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

      // Get bot's hand
      const botHand = state.hands[turn];
      if (!botHand || botHand.length === 0) return; // No cards to play!

      // Determine lead suit of the trick if cards have been played
      let leadSuit: Suit | null = null;
      const leadPosition = (['SOUTH', 'WEST', 'NORTH', 'EAST'] as PlayerPosition[]).find(
        (pos) => pos !== turn && state.playedCards[pos] !== null
      );
      if (leadPosition) {
        leadSuit = state.playedCards[leadPosition]!.suit;
      }

      // Pick card according to 29 rules
      let cardToPlay: Card | undefined;

      if (leadSuit) {
        // Must follow suit if possible
        const matchingCards = botHand.filter((c) => c.suit === leadSuit);
        if (matchingCards.length > 0) {
          // Play the highest value card of the lead suit to try and win, or lowest to discard
          // Simple bot AI: 70% chance to play highest value matching card, 30% chance to play lowest
          matchingCards.sort((a, b) => CARD_VALUES[b.rank] - CARD_VALUES[a.rank]);
          cardToPlay = Math.random() < 0.7 ? matchingCards[0] : matchingCards[matchingCards.length - 1];
        } else {
          // Cannot follow suit!
          // They can either:
          // 1. Ask to reveal the trump if it's hidden and they want to ruff it
          // 2. Play a trump card (if revealed and they have it)
          // 3. Play any other card (discard)
          if (!state.isTrumpRevealed && state.trumpSuit && Math.random() < 0.4) {
            // Ask to reveal trump!
            get().revealTrump();
            // Re-read state after reveal
            const updatedState = get().gameState!;
            const trumpCards = botHand.filter((c) => c.suit === updatedState.trumpSuit);
            if (trumpCards.length > 0) {
              trumpCards.sort((a, b) => CARD_VALUES[b.rank] - CARD_VALUES[a.rank]);
              cardToPlay = trumpCards[0]; // Play highest trump card (ruff)
            }
          } else if (state.isTrumpRevealed && state.trumpSuit) {
            // Trump is already revealed. Check if bot has trumps
            const trumpCards = botHand.filter((c) => c.suit === state.trumpSuit);
            if (trumpCards.length > 0 && Math.random() < 0.8) {
              trumpCards.sort((a, b) => CARD_VALUES[b.rank] - CARD_VALUES[a.rank]);
              cardToPlay = trumpCards[0]; // Play highest trump card
            }
          }
          
          // If they still haven't chosen a card (no trumps or didn't ruff), discard any card
          if (!cardToPlay) {
            // Discard lowest value card from their hand (excluding high points if possible)
            const sortedHand = [...botHand].sort((a, b) => CARD_VALUES[a.rank] - CARD_VALUES[b.rank]);
            cardToPlay = sortedHand[0];
          }
        }
      } else {
        // Bot is leading the trick! Play any card
        // Simple AI: 40% chance to play highest value card to lead
        const sortedHand = [...botHand].sort((a, b) => CARD_VALUES[b.rank] - CARD_VALUES[a.rank]);
        cardToPlay = sortedHand[0]; // Play highest value card to lead
      }

      if (!cardToPlay) {
        // Fallback
        cardToPlay = botHand[0];
      }

      // Play the card!
      const finalCard = cardToPlay;
      
      // Update bot hand and played cards
      const newBotHand = botHand.filter((c) => c.id !== finalCard.id);
      const newHands = { ...state.hands };
      newHands[turn] = newBotHand;

      const newPlayed = { ...state.playedCards };
      newPlayed[turn] = finalCard;

      set((s) => {
        if (!s.gameState) return s;
        const nextTurn = NEXT_POSITION[turn];
        return {
          statusText: `${turn} played ${finalCard.rank} of ${finalCard.suit}`,
          gameState: {
            ...s.gameState,
            hands: newHands,
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
        get().startTimer(15, () => {});
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
      // Deal 8 cards to each player right away
      const southFull = sortCards(deck.slice(0, 8));
      const westFull = sortCards(deck.slice(8, 16));
      const northFull = sortCards(deck.slice(16, 24));
      const eastFull = sortCards(deck.slice(24, 32));

      // Initially only 4 cards in South's hand are shown during the bidding phase
      const southHand = southFull.slice(0, 4);

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
        hands: {
          SOUTH: southFull,
          WEST: westFull,
          NORTH: northFull,
          EAST: eastFull,
        },
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

      const newHand = state.hands.SOUTH; // Already has all 8 sorted cards!

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
            isPairDeclarationAvailable: true, // Make pair declaring available!
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
      const newHands = { ...state.hands };
      newHands.SOUTH = newHands.SOUTH.filter(c => c.id !== cardId);
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
            hands: newHands,
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
      if (!state || !state.isPairDeclarationAvailable) return;

      set((s) => {
        if (!s.gameState) return s;
        return {
          statusText: 'South declared a Pair of Trump! Suit values modified.',
          gameState: {
            ...s.gameState,
            isPairDeclarationAvailable: false, // Turn off once declared
            pairDeclared: {
              position: 'SOUTH',
              suit: s.gameState.trumpSuit || 'HEARTS',
            },
          },
        };
      });
    },

    toggleTrumpMode: () => {
      set((s) => {
        if (!s.gameState) return s;
        return {
          gameState: {
            ...s.gameState,
            isJokerTrump: !s.gameState.isJokerTrump,
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
