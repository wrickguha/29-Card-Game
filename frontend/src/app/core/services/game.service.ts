import { Injectable, signal, computed } from '@angular/core';
import { Card, Suit, CardRank, Player, PlayedCard, Score, GamePhase, GameState, PlayerPosition, TimelineEvent } from '../models/game.model';
import { AuthService } from './auth.service';
import { SoundService } from './sound.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private stateSignal = signal<GameState>({
    phase: 'splash',
    players: [],
    dealerId: '',
    leadPlayerId: '',
    currentTurnId: '',
    highestBid: 0,
    bidderId: '',
    trumpSuit: null,
    isTrumpRevealed: false,
    trumpRevealedInTrick: -1,
    currentTrick: [],
    tricksPlayed: 0,
    roundPoints: { teamRed: 0, teamBlack: 0 },
    matchScores: { teamRed: 0, teamBlack: 0 },
    timerCount: 15,
    lastTrickWinnerId: null,
    capturedCardsRed: [],
    capturedCardsBlack: [],
    doubleState: 'none',
    doubleDeclayerId: null,
    singleHandResponses: {},
    isSingleHandActive: false,
    singleHandPlayerId: null,
    pairDeclaredBy: null,
    setOutcome: null,
    timeline: [],
    remainingRounds: 6
  });

  // Public Selectors
  state = computed(() => this.stateSignal());
  phase = computed(() => this.stateSignal().phase);
  players = computed(() => this.stateSignal().players);
  currentTrick = computed(() => this.stateSignal().currentTrick);
  highestBid = computed(() => this.stateSignal().highestBid);
  currentTurnId = computed(() => this.stateSignal().currentTurnId);
  isTrumpRevealed = computed(() => this.stateSignal().isTrumpRevealed);
  trumpSuit = computed(() => this.stateSignal().trumpSuit);
  matchScores = computed(() => this.stateSignal().matchScores);
  roundPoints = computed(() => this.stateSignal().roundPoints);
  timerCount = computed(() => this.stateSignal().timerCount);

  // Private game loop state
  private fullDeck: Card[] = [];
  private timerInterval: any;
  private botThinkingTimeout: any;

  // Rank priority in 29: J > 9 > A > 10 > K > Q > 8 > 7
  private readonly rankPriority: Record<CardRank, number> = {
    'J': 8, '9': 7, 'A': 6, '10': 5, 'K': 4, 'Q': 3, '8': 2, '7': 1
  };

  private readonly cardPoints: Record<CardRank, number> = {
    'J': 3, '9': 2, 'A': 1, '10': 1, 'K': 0, 'Q': 0, '8': 0, '7': 0
  };

  constructor(
    private authService: AuthService,
    private soundService: SoundService
  ) {}

  // Initialize a new match from the Lobby
  startNewGame() {
    this.soundService.playClick();
    this.clearAllTimers();

    const user = this.authService.currentUser();
    const players: Player[] = [
      {
        id: user?.id || 'user_1',
        name: user?.username || 'Player',
        avatarId: user?.avatarId || 'avatar_default_1',
        position: 'bottom',
        cards: [],
        isDealer: false,
        isReady: true,
        isConnected: true,
        currentBid: 0,
        isMyTurn: false,
        isCurrentUser: true
      },
      {
        id: 'bot_left',
        name: 'ThorAI',
        avatarId: 'avatar_thor',
        position: 'left',
        cards: [],
        isDealer: true, // Let left start as dealer
        isReady: true,
        isConnected: true,
        currentBid: 0,
        isMyTurn: false,
        isCurrentUser: false
      },
      {
        id: 'bot_top',
        name: 'ZeusAI',
        avatarId: 'avatar_zeus',
        position: 'top',
        cards: [],
        isDealer: false,
        isReady: true,
        isConnected: true,
        currentBid: 0,
        isMyTurn: false,
        isCurrentUser: false
      },
      {
        id: 'bot_right',
        name: 'HeraAI',
        avatarId: 'avatar_hera',
        position: 'right',
        cards: [],
        isDealer: false,
        isReady: true,
        isConnected: true,
        currentBid: 0,
        isMyTurn: false,
        isCurrentUser: false
      }
    ];

    const dealer = players.find(p => p.isDealer) || players[1];
    
    // Player to the left of the dealer bids first
    const firstBidder = this.getPlayerToLeft(dealer.id, players);

    const currentRounds = this.stateSignal().remainingRounds;
    const nextRounds = currentRounds <= 1 ? 6 : currentRounds - 1;
    const prevTimeline = currentRounds <= 1 ? [] : this.stateSignal().timeline;
    const roundNumber = 7 - nextRounds;
    const newTimeline = [
      ...prevTimeline,
      {
        id: 'evt_round_start_' + Date.now(),
        type: 'round_winner' as const,
        text: `Round ${roundNumber} started.`,
        timestamp: new Date()
      }
    ];

    this.stateSignal.set({
      phase: 'bidding',
      players: players,
      dealerId: dealer.id,
      leadPlayerId: '',
      currentTurnId: firstBidder.id,
      highestBid: 0,
      bidderId: '',
      trumpSuit: null,
      isTrumpRevealed: false,
      trumpRevealedInTrick: -1,
      currentTrick: [],
      tricksPlayed: 0,
      roundPoints: { teamRed: 0, teamBlack: 0 },
      matchScores: this.stateSignal().matchScores, // retain score
      timerCount: 15,
      lastTrickWinnerId: null,
      capturedCardsRed: [],
      capturedCardsBlack: [],
      doubleState: 'none',
      doubleDeclayerId: null,
      singleHandResponses: {},
      isSingleHandActive: false,
      singleHandPlayerId: null,
      pairDeclaredBy: null,
      setOutcome: null,
      timeline: newTimeline,
      remainingRounds: nextRounds
    });

    this.initializeDeck();
    this.dealFirstRound();
    this.startTurnTimer();
    this.checkTriggerBotBid();
  }

  // Generate 32 cards for 29 game
  private initializeDeck() {
    const suits: Suit[] = ['H', 'D', 'C', 'S'];
    const ranks: CardRank[] = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'];
    this.fullDeck = [];

    suits.forEach(suit => {
      ranks.forEach(rank => {
        this.fullDeck.push({
          id: `${suit}_${rank}`,
          suit,
          rank,
          points: this.cardPoints[rank],
          faceUp: false
        });
      });
    });

    // Shuffle deck
    for (let i = this.fullDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.fullDeck[i], this.fullDeck[j]] = [this.fullDeck[j], this.fullDeck[i]];
    }
  }

  private sortHand(cards: Card[]): Card[] {
    const suitOrder: Record<Suit, number> = { 'S': 4, 'H': 3, 'D': 2, 'C': 1 };
    return [...cards].sort((a, b) => {
      if (a.suit !== b.suit) {
        return suitOrder[b.suit] - suitOrder[a.suit];
      }
      return this.rankPriority[b.rank] - this.rankPriority[a.rank];
    });
  }

  private dealFirstRound() {
    const updatedPlayers = this.stateSignal().players.map(player => {
      const cards = this.fullDeck.splice(0, 4);
      // The user sees their cards face up; bots keep cards face down
      cards.forEach(c => {
        if (player.isCurrentUser) c.faceUp = true;
      });
      const sortedCards = player.isCurrentUser ? this.sortHand(cards) : cards;
      return {
        ...player,
        cards: sortedCards
      };
    });

    this.stateSignal.update(s => ({ ...s, players: updatedPlayers }));
    
    // Play multiple quick deal sounds
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.soundService.playCardDeal(), i * 150);
    }
  }

  private dealSecondRound() {
    const updatedPlayers = this.stateSignal().players.map(player => {
      const cards = this.fullDeck.splice(0, 4);
      cards.forEach(c => {
        if (player.isCurrentUser) c.faceUp = true;
      });
      const combinedCards = [...player.cards, ...cards];
      const sortedCards = player.isCurrentUser ? this.sortHand(combinedCards) : combinedCards;
      return {
        ...player,
        cards: sortedCards
      };
    });

    this.stateSignal.update(s => ({ ...s, players: updatedPlayers }));
    
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.soundService.playCardDeal(), i * 150);
    }
  }

  // Bidding Actions
  submitBid(amount: number) {
    const s = this.stateSignal();
    if (s.phase !== 'bidding') return;
    
    this.soundService.playChipClick();
    this.clearAllTimers();

    const currentTurn = s.currentTurnId;
    const updatedPlayers = s.players.map(p => {
      if (p.id === currentTurn) {
        return { ...p, currentBid: amount };
      }
      return p;
    });

    const nextBidder = this.getPlayerToLeft(currentTurn, s.players);

    this.stateSignal.update(state => ({
      ...state,
      players: updatedPlayers,
      highestBid: amount,
      bidderId: currentTurn,
      currentTurnId: nextBidder.id,
      timerCount: 15
    }));

    this.checkBiddingResolution();
  }

  passBid() {
    const s = this.stateSignal();
    if (s.phase !== 'bidding') return;

    this.soundService.playClick();
    this.clearAllTimers();

    const currentTurn = s.currentTurnId;
    const updatedPlayers = s.players.map(p => {
      if (p.id === currentTurn) {
        return { ...p, currentBid: -1 }; // -1 represents passed
      }
      return p;
    });

    const nextBidder = this.getPlayerToLeft(currentTurn, s.players);

    this.stateSignal.update(state => ({
      ...state,
      players: updatedPlayers,
      currentTurnId: nextBidder.id,
      timerCount: 15
    }));

    this.checkBiddingResolution();
  }

  private checkBiddingResolution() {
    const s = this.stateSignal();
    const activeBidders = s.players.filter(p => p.currentBid !== -1);
    
    // Bidding ends when 3 players have passed
    if (activeBidders.length === 1) {
      const winner = activeBidders[0];
      const finalBid = s.highestBid >= 16 ? s.highestBid : 16; // default minimum bid
      
      this.stateSignal.update(state => ({
        ...state,
        highestBid: finalBid,
        bidderId: winner.id,
        phase: 'double_declaration',
        timerCount: 15
      }));

      this.addToTimeline('trump_selected', `Bidding completed at ${finalBid} by ${winner.name}.`, winner.id);
      // Play alert chime
      setTimeout(() => this.soundService.playNotification(), 500);
      
      // Determine who gets to make the Double decision (opposing team)
      const isWinnerRed = winner.position === 'bottom' || winner.position === 'top';
      if (isWinnerRed) {
        // Opponents are Black Team (left/right bots). Let's simulate bot double decision!
        this.simulateBotDouble();
      } else {
        // Winner is Black Team. Opponents are Red Team (user/partner).
        // User gets to make the decision!
        this.stateSignal.update(state => ({
          ...state,
          currentTurnId: s.players.find(p => p.isCurrentUser)!.id
        }));
        this.startTurnTimer();
      }
    } else {
      // Find next active bidder (skip passed players)
      let nextId = s.currentTurnId;
      let nextPlayer = s.players.find(p => p.id === nextId)!;
      while (nextPlayer.currentBid === -1) {
        nextId = this.getPlayerToLeft(nextId, s.players).id;
        nextPlayer = s.players.find(p => p.id === nextId)!;
      }

      this.stateSignal.update(state => ({
        ...state,
        currentTurnId: nextId
      }));

      this.startTurnTimer();
      this.checkTriggerBotBid();
    }
  }

  // Trump Suit Selection
  selectTrump(suit: Suit) {
    this.soundService.playClick();
    this.clearAllTimers();

    const s = this.stateSignal();
    this.addToTimeline('trump_selected', 'Hidden trump selected.', s.bidderId);

    const initialResponses: Record<string, 'yes' | 'no' | 'waiting'> = {};
    s.players.forEach(p => {
      initialResponses[p.id] = 'waiting';
    });

    this.stateSignal.update(state => ({
      ...state,
      trumpSuit: suit,
      isTrumpRevealed: false,
      phase: 'single_hand_decision',
      singleHandResponses: initialResponses,
      timerCount: 15
    }));

    // Deal remaining cards
    this.dealSecondRound();

    this.triggerBotSingleHandDecisions();
    this.startTurnTimer();
  }

  // Reveal Trump Suit (during card play)
  revealTrump(revealerId: string) {
    const s = this.stateSignal();
    if (s.isTrumpRevealed || !s.trumpSuit) return;

    this.soundService.playVictory(); // reveal trump with fanfare!

    this.stateSignal.update(state => ({
      ...state,
      isTrumpRevealed: true,
      trumpRevealedInTrick: state.tricksPlayed
    }));
  }

  // Card Play Actions
  playCard(playerId: string, cardId: string) {
    const s = this.stateSignal();
    if (s.phase !== 'playing' || s.currentTurnId !== playerId) return;

    const player = s.players.find(p => p.id === playerId)!;
    const card = player.cards.find(c => c.id === cardId)!;

    // Check if card play is valid (following suit)
    if (playerId === s.currentTurnId && player.isCurrentUser) {
      if (!this.isValidCardPlay(card, player.cards, s.currentTrick)) {
        // Play invalid click sound
        this.soundService.playClick();
        return; 
      }
    }

    this.soundService.playCardThrow();
    this.clearAllTimers();

    // Play card animation state update
    const updatedCards = player.cards.filter(c => c.id !== cardId);
    const updatedPlayers = s.players.map(p => {
      if (p.id === playerId) {
        return { ...p, cards: updatedCards };
      }
      return p;
    });

    const played: PlayedCard = {
      playerId,
      position: player.position,
      card: { ...card, faceUp: true }
    };

    const updatedTrick = [...s.currentTrick, played];

    this.stateSignal.update(state => ({
      ...state,
      players: updatedPlayers,
      currentTrick: updatedTrick
    }));

    // Check if trick is complete (4 cards played)
    if (updatedTrick.length === 4) {
      setTimeout(() => this.resolveTrick(), 1000);
    } else {
      const nextPlayer = this.getPlayerToLeft(playerId, s.players);
      this.stateSignal.update(state => ({
        ...state,
        currentTurnId: nextPlayer.id,
        timerCount: 15
      }));

      this.startTurnTimer();
      this.checkTriggerBotPlay();
    }
  }

  private resolveTrick() {
    const s = this.stateSignal();
    const trick = s.currentTrick;
    if (trick.length < 4) return;

    // Find the lead card
    const leadCard = trick[0].card;
    const leadSuit = leadCard.suit;

    // Determine winner based on suit and rank rules
    let winningCardIndex = 0;
    let winningCard = trick[0].card;

    for (let i = 1; i < trick.length; i++) {
      const candidate = trick[i].card;
      
      const isWinnerOption = this.compareCards(candidate, winningCard, leadSuit, s.trumpSuit, s.isTrumpRevealed);
      if (isWinnerOption) {
        winningCard = candidate;
        winningCardIndex = i;
      }
    }

    const winnerId = trick[winningCardIndex].playerId;
    const winner = s.players.find(p => p.id === winnerId)!;

    // Calculate points in the trick
    const pointsCollected = trick.reduce((sum, play) => sum + play.card.points, 0);
    
    // Add point for last trick
    const isLastTrick = s.tricksPlayed === 7;
    const finalPoints = pointsCollected + (isLastTrick ? 1 : 0);

    const isTeamRed = winner.position === 'bottom' || winner.position === 'top';
    const updatedRoundPoints = { ...s.roundPoints };
    
    const trickCards = trick.map(t => t.card);
    const updatedCapturedRed = [...s.capturedCardsRed];
    const updatedCapturedBlack = [...s.capturedCardsBlack];

    if (isTeamRed) {
      updatedRoundPoints.teamRed += finalPoints;
      updatedCapturedRed.push(...trickCards);
    } else {
      updatedRoundPoints.teamBlack += finalPoints;
      updatedCapturedBlack.push(...trickCards);
    }

    // Winner collects cards
    this.soundService.playCardDeal();

    this.stateSignal.update(state => ({
      ...state,
      currentTrick: [],
      tricksPlayed: state.tricksPlayed + 1,
      roundPoints: updatedRoundPoints,
      lastTrickWinnerId: winnerId,
      currentTurnId: winnerId, // Trick winner plays first next
      leadPlayerId: winnerId,
      timerCount: 15,
      capturedCardsRed: updatedCapturedRed,
      capturedCardsBlack: updatedCapturedBlack
    }));

    if (this.stateSignal().tricksPlayed === 8) {
      // Round is finished
      setTimeout(() => this.resolveRound(), 1200);
    } else {
      this.startTurnTimer();
      this.checkTriggerBotPlay();
    }
  }

  private resolveRound() {
    const s = this.stateSignal();
    const bidderId = s.bidderId;
    const bidder = s.players.find(p => p.id === bidderId)!;
    const bidTarget = s.highestBid;
    
    const isBidderTeamRed = bidder.position === 'bottom' || bidder.position === 'top';
    const bidderPointsCollected = isBidderTeamRed ? s.roundPoints.teamRed : s.roundPoints.teamBlack;

    let bidderWon = false;
    let baseOutcome: 'normal_win' | 'normal_loss' | 'set' | 'double_set' | 'redouble_set' = 'normal_win';
    
    if (s.isSingleHandActive) {
      // Single Hand: Must win all 8 tricks
      const opponentTricksCollected = isBidderTeamRed ? s.roundPoints.teamBlack : s.roundPoints.teamRed;
      bidderWon = opponentTricksCollected === 0;
      baseOutcome = bidderWon ? 'normal_win' : 'set';
    } else {
      bidderWon = bidderPointsCollected >= bidTarget;
      baseOutcome = bidderWon ? 'normal_win' : 'set';
    }

    // Determine stakes/multiplier based on Double and Redouble
    let scoreChange = 1;
    if (s.isSingleHandActive) scoreChange = 2; // Single Hand base is 2
    if (s.doubleState === 'double') scoreChange *= 2;
    if (s.doubleState === 'redouble') scoreChange *= 4;

    const updatedMatchScores = { ...s.matchScores };
    let outcomeLabel: GameState['setOutcome'] = 'normal_win';

    if (isBidderTeamRed) {
      if (bidderWon) {
        updatedMatchScores.teamRed += scoreChange;
        outcomeLabel = s.doubleState === 'redouble' ? 'redouble_set' : (s.doubleState === 'double' ? 'double_set' : 'normal_win');
        this.soundService.playVictory();
      } else {
        updatedMatchScores.teamRed -= scoreChange;
        outcomeLabel = s.doubleState === 'redouble' ? 'redouble_set' : (s.doubleState === 'double' ? 'double_set' : (baseOutcome === 'set' ? 'set' : 'normal_loss'));
        this.soundService.playDefeat();
      }
    } else {
      if (bidderWon) {
        updatedMatchScores.teamBlack += scoreChange;
        outcomeLabel = s.doubleState === 'redouble' ? 'redouble_set' : (s.doubleState === 'double' ? 'double_set' : 'normal_win');
        this.soundService.playVictory();
      } else {
        updatedMatchScores.teamBlack -= scoreChange;
        outcomeLabel = s.doubleState === 'redouble' ? 'redouble_set' : (s.doubleState === 'double' ? 'double_set' : (baseOutcome === 'set' ? 'set' : 'normal_loss'));
        this.soundService.playDefeat();
      }
    }

    // Add round summary to timeline
    const winnerTeamLabel = (isBidderTeamRed === bidderWon) ? 'Red Team (You)' : 'Black Team (Opponents)';
    const textOutcome = bidderWon 
      ? `${winnerTeamLabel} won the round with ${bidderPointsCollected} points!`
      : `${winnerTeamLabel} set the contract! Opponents failed their bid of ${bidTarget}.`;
    
    this.addToTimeline('round_winner', textOutcome);

    // Save statistics in Auth
    const userWon = isBidderTeamRed === bidderWon; 
    this.authService.updateStats(userWon, bidderPointsCollected);
    
    if (userWon) {
      this.authService.addCoins(200); // coin reward
    }

    // Check if match is finished (target score 6 or -6)
    const isMatchEnded = Math.abs(updatedMatchScores.teamRed) >= 6 || Math.abs(updatedMatchScores.teamBlack) >= 6;
    if (isMatchEnded) {
      const matchWinnerLabel = updatedMatchScores.teamRed >= 6 ? 'Red Team' : 'Black Team';
      this.addToTimeline('set_outcome', `MATCH FINISHED! ${matchWinnerLabel} won the match! 🏆`);
    }

    this.stateSignal.update(state => ({
      ...state,
      phase: isMatchEnded ? 'match_end' : 'round_end',
      matchScores: updatedMatchScores,
      setOutcome: outcomeLabel
    }));
  }

  // Card comparison helper: returns true if candidate beats current winner
  private compareCards(candidate: Card, currentWinner: Card, leadSuit: Suit, trumpSuit: Suit | null, trumpRevealed: boolean): boolean {
    // If trump revealed, trump suit beats any other suit
    if (trumpRevealed && trumpSuit) {
      if (candidate.suit === trumpSuit && currentWinner.suit !== trumpSuit) {
        return true;
      }
      if (currentWinner.suit === trumpSuit && candidate.suit !== trumpSuit) {
        return false;
      }
      if (candidate.suit === trumpSuit && currentWinner.suit === trumpSuit) {
        return this.rankPriority[candidate.rank] > this.rankPriority[currentWinner.rank];
      }
    }

    // If no trumps (or trump not revealed), evaluate based on lead suit
    if (candidate.suit === leadSuit && currentWinner.suit !== leadSuit) {
      return true;
    }
    if (currentWinner.suit === leadSuit && candidate.suit !== leadSuit) {
      return false;
    }
    if (candidate.suit === leadSuit && currentWinner.suit === leadSuit) {
      return this.rankPriority[candidate.rank] > this.rankPriority[currentWinner.rank];
    }

    // Candidate has off-suit card and doesn't trump
    return false;
  }

  // Validate if card play is correct (user must follow suit if they hold it)
  isValidCardPlay(card: Card, hand: Card[], trick: PlayedCard[]): boolean {
    if (trick.length === 0) return true; // Lead card can be anything
    
    const leadSuit = trick[0].card.suit;
    const hasLeadSuit = hand.some(c => c.suit === leadSuit);

    if (hasLeadSuit) {
      return card.suit === leadSuit;
    }
    // If doesn't have lead suit, they can play anything (or reveal trump)
    return true;
  }

  // Timer helpers
  private startTurnTimer() {
    this.clearAllTimers();
    this.stateSignal.update(s => ({ ...s, timerCount: 15 }));
    
    this.timerInterval = setInterval(() => {
      const s = this.stateSignal();
      if (s.timerCount <= 1) {
        this.clearAllTimers();
        this.handleTimeOut();
      } else {
        this.stateSignal.update(state => ({ ...state, timerCount: state.timerCount - 1 }));
        
        // Tick warning sound on low time
        if (this.stateSignal().timerCount <= 4 && s.currentTurnId === this.authService.currentUser()?.id) {
          this.soundService.playNotification();
        }
      }
    }, 1000);
  }

  private handleTimeOut() {
    const s = this.stateSignal();
    const activeTurn = s.currentTurnId;
    
    if (s.phase === 'bidding') {
      // Auto-pass on bidding timeout
      this.passBid();
    } else if (s.phase === 'trump_selection') {
      // Auto select first suit
      this.selectTrump('H');
    } else if (s.phase === 'playing') {
      // Auto play first valid card
      const player = s.players.find(p => p.id === activeTurn)!;
      const validCards = player.cards.filter(c => 
        this.isValidCardPlay(c, player.cards, s.currentTrick)
      );
      const cardToPlay = validCards[0] || player.cards[0];
      if (cardToPlay) {
        this.playCard(activeTurn, cardToPlay.id);
      }
    }
  }

  private clearAllTimers() {
    clearInterval(this.timerInterval);
    clearTimeout(this.botThinkingTimeout);
  }

  // AI Opponents Behavior Simulation
  private checkTriggerBotBid() {
    const s = this.stateSignal();
    if (s.phase !== 'bidding') return;

    const currentTurn = s.players.find(p => p.id === s.currentTurnId)!;
    if (currentTurn.isCurrentUser) return; // User turn

    // Calculate dynamic AI bid decision
    const delay = 1000 + Math.random() * 1500;
    this.botThinkingTimeout = setTimeout(() => {
      const highestBid = this.stateSignal().highestBid;
      
      // AI bids if it has high value cards (Jacks, 9s, Aces)
      const pointsInHand = currentTurn.cards.reduce((sum, c) => sum + c.points, 0);
      const hasJacks = currentTurn.cards.some(c => c.rank === 'J');

      // AI Bids evaluation
      let targetBid = highestBid > 0 ? highestBid + 1 : 16;
      
      if (pointsInHand >= 6 && hasJacks && targetBid <= 20) {
        this.submitBid(targetBid);
      } else if (pointsInHand >= 4 && targetBid <= 17) {
        this.submitBid(targetBid);
      } else {
        this.passBid();
      }
    }, delay);
  }

  private triggerBotTrumpSelection(botId: string) {
    const s = this.stateSignal();
    const bot = s.players.find(p => p.id === botId)!;
    
    // Choose strongest suit among 4 cards
    const delay = 1500 + Math.random() * 1000;
    this.botThinkingTimeout = setTimeout(() => {
      const suitsCount: Record<Suit, number> = { 'H': 0, 'D': 0, 'C': 0, 'S': 0 };
      bot.cards.forEach(c => suitsCount[c.suit]++);
      
      let bestSuit: Suit = 'H';
      let maxCount = -1;
      
      (Object.keys(suitsCount) as Suit[]).forEach(suit => {
        if (suitsCount[suit] > maxCount) {
          maxCount = suitsCount[suit];
          bestSuit = suit;
        }
      });
      
      this.selectTrump(bestSuit);
    }, delay);
  }

  private checkTriggerBotPlay() {
    const s = this.stateSignal();
    if (s.phase !== 'playing') return;

    const currentTurn = s.players.find(p => p.id === s.currentTurnId)!;
    if (currentTurn.isCurrentUser) return;

    const delay = 1000 + Math.random() * 1200;
    this.botThinkingTimeout = setTimeout(() => {
      const sState = this.stateSignal();
      const trick = sState.currentTrick;
      
      // Filter valid cards to follow suit
      const validCards = currentTurn.cards.filter(c => 
        this.isValidCardPlay(c, currentTurn.cards, trick)
      );

      // AI plays:
      // 1. If it cannot follow suit, check if it should reveal trump
      if (trick.length > 0) {
        const leadSuit = trick[0].card.suit;
        const canFollow = currentTurn.cards.some(c => c.suit === leadSuit);
        
        if (!canFollow && !sState.isTrumpRevealed && sState.trumpSuit) {
          // If we hold trump cards, reveal trump!
          const hasTrump = currentTurn.cards.some(c => c.suit === sState.trumpSuit);
          if (hasTrump && Math.random() > 0.3) {
            this.revealTrump(currentTurn.id);
            // Play a card now that trump is revealed (re-filter valid cards just in case)
            setTimeout(() => {
              const postRevealValid = currentTurn.cards.filter(c => 
                this.isValidCardPlay(c, currentTurn.cards, this.stateSignal().currentTrick)
              );
              const card = postRevealValid[0] || currentTurn.cards[0];
              this.playCard(currentTurn.id, card.id);
            }, 600);
            return;
          }
        }
      }

      // Standard play card selection
      let selectedCard = validCards[0] || currentTurn.cards[0];
      
      // Simple smart AI preference: try to win the trick with Jacks/9s or discard 7s/8s
      if (validCards.length > 1) {
        // Sort from lowest point to highest to discard, or choose Jack to win
        const sorted = [...validCards].sort((a, b) => this.rankPriority[a.rank] - this.rankPriority[b.rank]);
        selectedCard = sorted[0]; // fallback low card
        
        // If partner played winning card, throw points
        const partnerPlayed = trick.find(p => p.playerId === 'bot_top');
        if (partnerPlayed) {
          // Play highest point card we have since partner wins
          const pointSorted = [...validCards].sort((a, b) => b.points - a.points);
          selectedCard = pointSorted[0];
        }
      }

      if (selectedCard) {
        this.playCard(currentTurn.id, selectedCard.id);
      }
    }, delay);
  }

  // Positioning helpers
  private getPlayerToLeft(playerId: string, players: Player[]): Player {
    const order: PlayerPosition[] = ['bottom', 'left', 'top', 'right'];
    const player = players.find(p => p.id === playerId)!;
    const currentIndex = order.indexOf(player.position);
    const nextIndex = (currentIndex + 1) % 4;
    const nextPosition = order[nextIndex];
    return players.find(p => p.position === nextPosition)!;
  }

  returnToHome() {
    this.soundService.playClick();
    this.clearAllTimers();
    this.stateSignal.update(s => ({
      ...s,
      phase: 'home'
    }));
  }

  addToTimeline(type: TimelineEvent['type'], text: string, playerId?: string | null) {
    const s = this.stateSignal();
    const player = playerId ? s.players.find(p => p.id === playerId) : undefined;
    const event: TimelineEvent = {
      id: 'evt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type,
      text,
      timestamp: new Date(),
      playerName: player?.name,
      playerAvatar: player?.avatarId,
      position: player?.position
    };
    this.stateSignal.update(state => ({
      ...state,
      timeline: [...state.timeline, event]
    }));
  }

  private getSuitSymbolForTimeline(suit: Suit): string {
    const symbols: Record<Suit, string> = {
      'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠'
    };
    return symbols[suit];
  }

  declareDouble(playerId: string, isDouble: boolean) {
    const s = this.stateSignal();
    if (s.phase !== 'double_declaration') return;

    this.clearAllTimers();
    const player = s.players.find(p => p.id === playerId)!;

    if (isDouble) {
      this.soundService.playTrumpReveal();
      this.addToTimeline('double', `${player.name} DECLARED DOUBLE! ⚔️`, playerId);
      
      this.stateSignal.update(state => ({
        ...state,
        doubleState: 'double',
        doubleDeclayerId: playerId,
        timerCount: 15
      }));

      // Now bidder team gets a chance to Redouble
      const bidder = s.players.find(p => p.id === s.bidderId)!;
      if (bidder.isCurrentUser) {
        this.startTurnTimer();
      } else {
        this.simulateBotRedouble();
      }
    } else {
      this.addToTimeline('double', `${player.name} passed Double.`, playerId);
      this.transitionToTrumpSelection();
    }
  }

  declareRedouble(playerId: string, isRedouble: boolean) {
    const s = this.stateSignal();
    this.clearAllTimers();
    const player = s.players.find(p => p.id === playerId)!;

    if (isRedouble) {
      this.soundService.playTrumpReveal();
      this.addToTimeline('redouble', `${player.name} DECLARED REDOUBLE! 🔥`, playerId);
      
      this.stateSignal.update(state => ({
        ...state,
        doubleState: 'redouble',
        timerCount: 15
      }));
    } else {
      this.addToTimeline('redouble', `${player.name} passed Redouble.`, playerId);
    }

    this.transitionToTrumpSelection();
  }

  transitionToTrumpSelection() {
    const s = this.stateSignal();
    const bidder = s.players.find(p => p.id === s.bidderId)!;

    this.stateSignal.update(state => ({
      ...state,
      phase: 'trump_selection',
      currentTurnId: bidder.id,
      timerCount: 15
    }));

    this.startTurnTimer();

    if (!bidder.isCurrentUser) {
      this.triggerBotTrumpSelection(bidder.id);
    }
  }

  submitSingleHandResponse(playerId: string, response: 'yes' | 'no') {
    const s = this.stateSignal();
    if (s.phase !== 'single_hand_decision') return;

    const updatedResponses = { ...s.singleHandResponses, [playerId]: response };
    const player = s.players.find(p => p.id === playerId)!;
    
    this.addToTimeline(
      'single_hand', 
      `${player.name} voted ${response === 'yes' ? 'SINGLE HAND 👑' : 'NORMAL PLAY 🤝'}`, 
      playerId
    );

    this.stateSignal.update(state => ({
      ...state,
      singleHandResponses: updatedResponses
    }));

    // Check if all players responded
    const allResponded = s.players.every(p => updatedResponses[p.id] && updatedResponses[p.id] !== 'waiting');
    if (allResponded) {
      this.clearAllTimers();
      
      const singleHandVoter = s.players.find(p => updatedResponses[p.id] === 'yes');
      const isSingleActive = !!singleHandVoter;
      const singlePlayerId = singleHandVoter ? singleHandVoter.id : null;

      this.stateSignal.update(state => ({
        ...state,
        isSingleHandActive: isSingleActive,
        singleHandPlayerId: singlePlayerId,
        phase: 'playing',
        currentTurnId: this.getPlayerToLeft(state.dealerId, state.players).id, // first trick starts
        timerCount: 15
      }));

      this.addToTimeline(
        'single_hand', 
        isSingleActive 
          ? `Single Hand Active: ${singleHandVoter?.name} will play ALONE!` 
          : 'All players agreed to standard play.', 
        singlePlayerId
      );

      this.startTurnTimer();
      this.checkTriggerBotPlay();
    }
  }

  triggerBotSingleHandDecisions() {
    const s = this.stateSignal();
    s.players.forEach(p => {
      if (p.isCurrentUser) return;
      
      const delay = 800 + Math.random() * 1500;
      setTimeout(() => {
        if (this.stateSignal().phase === 'single_hand_decision') {
          const handPoints = p.cards.reduce((sum, c) => sum + c.points, 0);
          const vote = (handPoints >= 7 && Math.random() > 0.9) ? 'yes' : 'no';
          this.submitSingleHandResponse(p.id, vote);
        }
      }, delay);
    });
  }

  simulateBotDouble() {
    const s = this.stateSignal();
    const opponent = s.players.find(p => !p.isCurrentUser && (p.position === 'left' || p.position === 'right'))!;
    
    const delay = 1200 + Math.random() * 1000;
    setTimeout(() => {
      if (this.stateSignal().phase === 'double_declaration') {
        const handPoints = opponent.cards.reduce((sum, c) => sum + c.points, 0);
        const shouldDouble = (s.highestBid >= 20 && handPoints >= 6 && Math.random() > 0.5);
        this.declareDouble(opponent.id, shouldDouble);
      }
    }, delay);
  }

  simulateBotRedouble() {
    const s = this.stateSignal();
    const delay = 1200 + Math.random() * 1000;
    setTimeout(() => {
      const bidder = s.players.find(p => p.id === s.bidderId)!;
      const handPoints = bidder.cards.reduce((sum, c) => sum + c.points, 0);
      const shouldRedouble = (handPoints >= 8 && Math.random() > 0.4);
      this.declareRedouble(bidder.id, shouldRedouble);
    }, delay);
  }

  canDeclarePair(playerId: string): boolean {
    const s = this.stateSignal();
    if (!s.isTrumpRevealed || !s.trumpSuit) return false;
    const player = s.players.find(p => p.id === playerId);
    if (!player) return false;
    
    const hasKing = player.cards.some(c => c.suit === s.trumpSuit && c.rank === 'K');
    const hasQueen = player.cards.some(c => c.suit === s.trumpSuit && c.rank === 'Q');
    
    return hasKing && hasQueen && !s.pairDeclaredBy;
  }

  declarePair(playerId: string) {
    const s = this.stateSignal();
    const player = s.players.find(p => p.id === playerId)!;
    const isRedTeam = player.position === 'bottom' || player.position === 'top';
    const teamLabel = isRedTeam ? 'red' : 'black';

    this.soundService.playVictory();
    this.addToTimeline('pair', `${player.name} declared Trump Pair (K & Q)! 👑`, playerId);
    
    this.stateSignal.update(state => ({
      ...state,
      pairDeclaredBy: teamLabel
    }));
  }

  resetMatchScore() {
    this.stateSignal.update(s => ({
      ...s,
      matchScores: { teamRed: 0, teamBlack: 0 },
      remainingRounds: 6,
      timeline: []
    }));
  }
}
