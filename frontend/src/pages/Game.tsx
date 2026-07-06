import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/useGameStore';
import { useUIStore } from '../stores/useUIStore';
import { useRoomStore } from '../stores/useRoomStore';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import { 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Timer, 
  Eye,
  Award,
  Sparkles
} from 'lucide-react';
import { SUIT_INFO } from '../constants/game';
import type { Suit } from '../types/game';
import { motion, AnimatePresence } from 'framer-motion';

export const Game: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const { 
    gameState, 
    statusText, 
    isYourTurn, 
    timerCount,
    joinGame,
    placeBid,
    passBid,
    selectTrump,
    revealTrump,
    playCard,
    respondSingleHand,
    declarePair,
    declareDouble,
    declareRedouble,
    resetGame
  } = useGameStore();

  const { activeModal, closeModal, soundMuted, toggleSound } = useUIStore();
  const { leaveRoom } = useRoomStore();

  const [showPairConfirm, setShowPairConfirm] = useState(false);
  const [pairAnimationActive, setPairAnimationActive] = useState(false);

  useEffect(() => {
    if (roomId) {
      joinGame(roomId);
    }
    return () => {
      resetGame();
    };
  }, [roomId, joinGame, resetGame]);

  const handleExit = () => {
    if (confirm("Are you sure you want to exit the current card table?")) {
      resetGame();
      leaveRoom();
      navigate('/');
    }
  };

  if (!gameState) {
    return (
      <div className="py-24 text-center space-y-4">
        <Timer className="mx-auto text-gold-500 animate-spin" size={32} />
        <h2 className="font-display text-xl font-bold text-slate-400">Loading Game Table...</h2>
        <Button variant="glass" onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  // Helper to draw suit emoji/symbol
  const renderSuitIcon = (suit: string) => {
    switch (suit) {
      case 'HEARTS': return <span className="text-red-500 font-bold">♥</span>;
      case 'DIAMONDS': return <span className="text-red-500 font-bold">♦</span>;
      case 'CLUBS': return <span className="text-slate-400 font-bold">♣</span>;
      case 'SPADES': return <span className="text-slate-400 font-bold">♠</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-4">
      {/* Header bar controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-premium-black/40 backdrop-blur-md p-4 rounded-2xl border border-gold-500/10">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExit}
            className="p-2.5 rounded-xl bg-premium-gray/60 border border-gold-500/10 hover:border-gold-500 hover:text-gold-400 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Room Session</span>
            <span className="text-sm font-black text-gold-400">Table #{roomId}</span>
          </div>
        </div>

        {/* Status log label */}
        <div className="flex-1 max-w-md mx-4 px-4 py-2 rounded-xl bg-premium-black/60 border border-gold-500/5 text-center text-xs font-bold text-gold-400/90 truncate">
          {statusText}
        </div>

        {/* Scores, game mode toggle & audio toggles */}
        <div className="flex items-center space-x-4">
          <div 
            className="px-3 py-1.5 rounded-xl bg-premium-gray/60 border border-gold-500/10 text-xs font-black text-gold-500/80 uppercase tracking-wider"
          >
            Mode: {gameState.isJokerTrump ? 'Joker' : '7th Card'}
          </div>

          <div className="flex items-center space-x-2 bg-premium-gray/60 border border-gold-500/10 px-3 py-1.5 rounded-xl text-xs font-bold">
            <span className="text-red-400">RED: {gameState.matchScores.redTeam}</span>
            <span className="text-slate-600">|</span>
            <span className="text-blue-400">BLUE: {gameState.matchScores.blueTeam}</span>
          </div>
          
          <button 
            onClick={toggleSound}
            className="p-2.5 rounded-xl bg-premium-gray/60 border border-gold-500/10 text-gold-400 cursor-pointer"
          >
            {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Playing felt */}
      <div className="flex-1 min-h-[420px] relative rounded-3xl bg-[radial-gradient(circle_at_center,var(--color-poker-800)_0%,var(--color-poker-900)_50%,var(--color-premium-black)_100%)] border-2 border-gold-500/25 shadow-2xl p-6 overflow-hidden flex flex-col justify-between">
        
        {/* Table Felt Lighting glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />

        {/* Dedicated Trump Card Slot on the Table Felt */}
        <div className="absolute top-6 left-6 z-20 flex flex-col items-center">
          <span className="text-[9px] font-black uppercase text-gold-500/60 tracking-wider mb-1.5">
            {gameState.isJokerTrump ? 'Joker Trump' : '7th Card Trump'}
          </span>
          
          {!gameState.trumpSuit ? (
            <div className="w-12 h-18 rounded-lg border border-dashed border-gold-500/20 flex flex-col items-center justify-center text-[9px] font-black text-slate-700 bg-premium-black/20">
              <span>Empty</span>
            </div>
          ) : !gameState.isTrumpRevealed ? (
            /* Selected but hidden state */
            <button
              onClick={() => {
                if (gameState.highestBidder === 'SOUTH') {
                  revealTrump();
                } else {
                  alert("Only the bidder can reveal the trump card privately, or it will be revealed automatically when a player cannot follow suit!");
                }
              }}
              className={`w-12 h-18 rounded-lg border shadow-lg hover:scale-105 active:scale-95 transition-all group relative cursor-pointer ${
                gameState.isJokerTrump 
                  ? 'bg-gradient-to-b from-indigo-900 to-purple-950 border-purple-500/50 shadow-purple-500/10' 
                  : 'bg-gradient-to-b from-amber-800 to-amber-950 border-gold-500/40 shadow-gold-500/10'
              }`}
            >
              {/* Premium card back pattern */}
              <div className="absolute inset-0.5 rounded-[5px] border border-gold-500/10 bg-premium-black/60 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute w-8 h-8 rounded-full border border-gold-500/5 bg-gold-500/2 animate-spin-slow pointer-events-none" />
                
                <span className="text-[10px] font-black text-gold-500 z-10">
                  {gameState.isJokerTrump ? '🃟' : '29'}
                </span>
                <span className="text-[6px] uppercase font-black tracking-widest text-gold-500/60 mt-0.5 z-10">
                  {gameState.isJokerTrump ? 'JOKER' : '7TH CARD'}
                </span>
              </div>
              
              {/* Bidder private indicator */}
              {gameState.highestBidder === 'SOUTH' ? (
                <div className="absolute -bottom-1 -right-1 bg-premium-light border border-gold-400 rounded px-0.5 text-[8px] font-black text-slate-200 shadow z-20 flex items-center space-x-0.5">
                  <span className="text-[6px] text-slate-400 font-bold uppercase">Secret:</span>
                  <span>{renderSuitIcon(gameState.trumpSuit)}</span>
                </div>
              ) : null}

              {/* Hover peek tooltip */}
              {gameState.highestBidder === 'SOUTH' && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-premium-black/95 border border-gold-500 px-2 py-1 rounded text-[10px] font-black text-gold-400 whitespace-nowrap z-30 shadow-xl">
                  Click to Reveal Trump Suit!
                </div>
              )}
            </button>
          ) : (
            /* Revealed state (cinematic flip animation container) */
            <div className="animate-flip-in-y">
              {gameState.isJokerTrump ? (
                /* Premium Revealed Joker Card */
                <div className="w-12 h-18 rounded-lg bg-gradient-to-br from-indigo-950 via-purple-900 to-amber-950 border-2 border-gold-500 flex flex-col items-center justify-between p-1.5 shadow-lg shadow-purple-500/20 animate-neon-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.1)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
                  
                  <div className="w-full flex justify-between text-[8px] font-black text-gold-400">
                    <span>Joker</span>
                    {renderSuitIcon(gameState.trumpSuit)}
                  </div>

                  <div className="flex flex-col items-center text-gold-400">
                    <Sparkles size={12} className="animate-pulse" />
                    <span className="text-[6px] font-black tracking-widest uppercase text-gold-300">Joker</span>
                  </div>

                  <div className="w-full flex justify-between text-[8px] font-black text-gold-400 rotate-180">
                    <span>Joker</span>
                    {renderSuitIcon(gameState.trumpSuit)}
                  </div>
                </div>
              ) : (
                /* Premium Revealed 7th Card */
                <div className="w-12 h-18 rounded-lg bg-premium-light border-2 border-gold-500 flex flex-col items-center justify-between p-1.5 shadow-lg shadow-gold-500/20 animate-neon-pulse relative overflow-hidden">
                  <div className="w-full flex justify-between text-[8px] font-black text-slate-300">
                    <span>{gameState.trumpSuit.slice(0, 1)}</span>
                    {renderSuitIcon(gameState.trumpSuit)}
                  </div>
                  <div className="text-lg leading-none font-bold text-center">
                    {renderSuitIcon(gameState.trumpSuit)}
                  </div>
                  <div className="w-full flex justify-between text-[8px] font-black text-slate-300 rotate-180">
                    <span>{gameState.trumpSuit.slice(0, 1)}</span>
                    {renderSuitIcon(gameState.trumpSuit)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6x6 Counter Board on Table Felt */}
        <div className="absolute top-6 right-6 z-20 flex flex-col items-center">
          <span className="text-[9px] font-black uppercase text-gold-500/60 tracking-wider mb-1.5">6 × 6 Board</span>
          
          <div className="p-2 rounded-xl bg-premium-black/60 border border-gold-500/10 flex flex-col space-y-1.5 w-28 sm:w-32">
            {/* Red Team Row */}
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-red-500 uppercase mr-1">RED</span>
              <div className="flex space-x-0.5 sm:space-x-1">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border transition-all duration-300 ${
                      idx < gameState.matchScores.redTeam 
                        ? 'bg-red-500 border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.7)]' 
                        : 'bg-premium-black border-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Blue Team Row */}
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-blue-500 uppercase mr-1">BLUE</span>
              <div className="flex space-x-0.5 sm:space-x-1">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border transition-all duration-300 ${
                      idx < gameState.matchScores.blueTeam 
                        ? 'bg-blue-500 border-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.7)]' 
                        : 'bg-premium-black border-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NORTH seat slot */}
        <div className="flex flex-col items-center mt-2">
          <div className="relative flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-gold-500/20 flex items-center justify-center font-display text-sm font-bold text-slate-300">
              N
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400 mt-1">North Partner</span>
            {gameState.turnPosition === 'NORTH' && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold-500 border-2 border-premium-black rounded-full animate-ping" />
            )}
          </div>
        </div>

        {/* Table middle section: West, center trick cards, East */}
        <div className="flex items-center justify-between my-4">
          
          {/* WEST seat */}
          <div className="flex flex-col items-center ml-2">
            <div className="relative flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-gold-500/20 flex items-center justify-center font-display text-sm font-bold text-slate-300">
                W
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 mt-1">West</span>
              {gameState.turnPosition === 'WEST' && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold-500 border-2 border-premium-black rounded-full animate-ping" />
              )}
            </div>
          </div>

          {/* TABLE CENTER: Trick slots */}
          <div className="flex-1 max-w-[300px] h-[180px] border border-gold-500/10 bg-premium-black/20 rounded-2xl relative flex items-center justify-center">
            {/* Compass labels */}
            <div className="absolute top-2 text-[9px] font-black text-slate-700 tracking-wider">NORTH</div>
            <div className="absolute bottom-2 text-[9px] font-black text-slate-700 tracking-wider">SOUTH</div>
            <div className="absolute left-2 text-[9px] font-black text-slate-700 tracking-wider">WEST</div>
            <div className="absolute right-2 text-[9px] font-black text-slate-700 tracking-wider">EAST</div>

            {/* Render center played cards */}
            <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full h-full p-4 relative">
              {/* North Card slot */}
              <div className="col-start-2 row-start-1 flex justify-center items-center">
                {gameState.playedCards.NORTH ? (
                  <div className="w-10 h-14 bg-premium-light border border-gold-500/30 rounded-lg flex flex-col items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
                    <span className="text-xs font-black">{gameState.playedCards.NORTH.rank}</span>
                    {renderSuitIcon(gameState.playedCards.NORTH.suit)}
                  </div>
                ) : (
                  <div className="w-10 h-14 border border-dashed border-slate-800/40 rounded-lg" />
                )}
              </div>

              {/* West Card slot */}
              <div className="col-start-1 row-start-2 flex justify-center items-center">
                {gameState.playedCards.WEST ? (
                  <div className="w-10 h-14 bg-premium-light border border-gold-500/30 rounded-lg flex flex-col items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
                    <span className="text-xs font-black">{gameState.playedCards.WEST.rank}</span>
                    {renderSuitIcon(gameState.playedCards.WEST.suit)}
                  </div>
                ) : (
                  <div className="w-10 h-14 border border-dashed border-slate-800/40 rounded-lg" />
                )}
              </div>

              {/* East Card slot */}
              <div className="col-start-3 row-start-2 flex justify-center items-center">
                {gameState.playedCards.EAST ? (
                  <div className="w-10 h-14 bg-premium-light border border-gold-500/30 rounded-lg flex flex-col items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
                    <span className="text-xs font-black">{gameState.playedCards.EAST.rank}</span>
                    {renderSuitIcon(gameState.playedCards.EAST.suit)}
                  </div>
                ) : (
                  <div className="w-10 h-14 border border-dashed border-slate-800/40 rounded-lg" />
                )}
              </div>

              {/* South Card slot */}
              <div className="col-start-2 row-start-3 flex justify-center items-center">
                {gameState.playedCards.SOUTH ? (
                  <div className="w-10 h-14 bg-premium-light border border-gold-500/50 rounded-lg flex flex-col items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
                    <span className="text-xs font-black">{gameState.playedCards.SOUTH.rank}</span>
                    {renderSuitIcon(gameState.playedCards.SOUTH.suit)}
                  </div>
                ) : (
                  <div className="w-10 h-14 border border-dashed border-slate-800/40 rounded-lg" />
                )}
              </div>
            </div>
          </div>

          {/* EAST seat */}
          <div className="flex flex-col items-center mr-2">
            <div className="relative flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-gold-500/20 flex items-center justify-center font-display text-sm font-bold text-slate-300">
                E
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 mt-1">East</span>
              {gameState.turnPosition === 'EAST' && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold-500 border-2 border-premium-black rounded-full animate-ping" />
              )}
            </div>
          </div>
        </div>

        {/* SOUTH seat: Hand cards list */}
        <div className="flex flex-col items-center mb-2 space-y-4">
          
          {/* Card display hand list */}
          <div className="flex justify-center -space-x-4 max-w-full overflow-x-auto py-2 px-6">
            {gameState.hand.map((card) => (
              <button
                key={card.id}
                onClick={() => playCard(card.id)}
                disabled={!isYourTurn || gameState.biddingActive}
                className={`
                  w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-gradient-to-b from-premium-light to-premium-gray border-2 
                  flex flex-col items-center justify-between p-2 shadow-lg cursor-pointer transform hover:-translate-y-4 transition-all duration-200
                  ${isYourTurn && !gameState.biddingActive ? 'border-gold-500/60 hover:border-gold-400' : 'border-slate-800'}
                  ${!isYourTurn ? 'opacity-90' : 'opacity-100'}
                `}
              >
                <div className="flex justify-between w-full text-xs font-black">
                  <span>{card.rank}</span>
                  {renderSuitIcon(card.suit)}
                </div>
                <div className="text-xl">{renderSuitIcon(card.suit)}</div>
                <div className="flex justify-between w-full text-[9px] font-black text-slate-500">
                  <span>{card.points > 0 ? `+${card.points} pts` : ''}</span>
                  <span className="uppercase">{card.suit.slice(0, 3)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* User badge */}
          <div className="relative flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center font-display text-lg font-black text-premium-black border border-gold-300">
              Y
            </div>
            <span className="text-xs font-black uppercase text-gold-400 mt-1">You (South)</span>
            
            {/* Timer circle badge */}
            {isYourTurn && (
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gold-500 border-2 border-premium-black flex items-center justify-center text-xs font-black text-premium-black shadow-lg">
                {timerCount}s
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side board panel showing details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active game info */}
        <GlassPanel className="p-4 border-gold-500/5 text-center flex flex-col justify-center space-y-1">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Highest Bid Target</span>
          <span className="text-xl font-black text-gold-400">{gameState.highestBid > 0 ? `${gameState.highestBid} by ${gameState.highestBidder}` : 'No Bid Yet'}</span>
        </GlassPanel>

        {/* Hidden trump status widget */}
        <GlassPanel className="p-4 border-gold-500/5 text-center flex items-center justify-between">
          <div className="text-left">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Trump Status</span>
            <span className="text-sm font-black text-slate-300 block mt-0.5">
              {gameState.isTrumpRevealed 
                ? `REVEALED: ${gameState.trumpSuit}` 
                : (gameState.trumpSuit ? 'Trump Selected' : 'Selecting Suit...')}
            </span>
          </div>
          {gameState.trumpSuit && !gameState.isTrumpRevealed && (
            <Button 
              size="sm" 
              variant="gold" 
              onClick={revealTrump}
              className="py-1 px-3 text-[10px] flex items-center space-x-1"
            >
              <Eye size={12} />
              <span>REVEAL</span>
            </Button>
          )}
        </GlassPanel>

        {/* Declare Stake buttons */}
        <GlassPanel className="p-4 border-gold-500/5 flex items-center justify-around space-x-2">
          {gameState.doubleStatus === 'NONE' ? (
            <Button size="sm" variant="glass" onClick={declareDouble} className="text-[10px] flex-1 py-2">
              Double (x2)
            </Button>
          ) : gameState.doubleStatus === 'DOUBLE' ? (
            <Button size="sm" variant="danger" onClick={declareRedouble} className="text-[10px] flex-1 py-2">
              Redouble (x4)
            </Button>
          ) : (
            <span className="text-xs font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">REDOUBLE ACTIVE</span>
          )}

          {gameState.isPairDeclarationAvailable && (
            <Button 
              size="sm" 
              variant="gold" 
              onClick={() => setShowPairConfirm(true)} 
              className="text-[10px] flex-1 py-2 animate-bounce"
              glow
            >
              Declare Pair
            </Button>
          )}
        </GlassPanel>
      </div>

      {/* Match Timeline / Event Logs */}
      <GlassPanel className="p-4 border-gold-500/5 bg-premium-black/40">
        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block mb-2 text-left">Match Timeline</span>
        <div className="flex flex-col space-y-1.5 text-left max-h-24 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center text-[10px] font-medium text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500/40 mr-2" />
            <span>Room session started. Cards dealt from standard 32-card deck.</span>
          </div>
          {gameState.highestBid > 0 && (
            <div className="flex items-center text-[10px] font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mr-2" />
              <span>Highest Bid: {gameState.highestBid} declared by {gameState.highestBidder}</span>
            </div>
          )}
          {gameState.trumpSuit && (
            <div className="flex items-center text-[10px] font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mr-2" />
              <span>Trump suit selected privately by bidder. Mode: {gameState.isJokerTrump ? 'Joker' : '7th Card'}</span>
            </div>
          )}
          {gameState.pairDeclared && (
            <div className="flex items-center text-[10px] font-black text-gold-400 bg-gold-500/5 py-0.5 px-2 rounded-lg border border-gold-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mr-2 animate-ping" />
              <span>PAIR DECLARED: {gameState.pairDeclared.position} declared Pair of {gameState.pairDeclared.suit}!</span>
            </div>
          )}
          {gameState.isTrumpRevealed && (
            <div className="flex items-center text-[10px] font-medium text-gold-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
              <span>Trump card revealed: {gameState.trumpSuit}</span>
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Game Modals */}

      {/* 1. Bidding Modal */}
      {gameState.biddingActive && isYourTurn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-premium-black/40" />
          <GlassPanel className="relative z-10 w-full max-w-sm border-gold-500/20 text-center space-y-6" glow>
            <h3 className="font-display text-xl font-extrabold text-gold-400">YOUR BIDDING TURN</h3>
            <p className="text-xs text-slate-400">Current highest bid: {gameState.highestBid > 0 ? `${gameState.highestBid} by ${gameState.highestBidder}` : 'None (Minimum is 16)'}</p>
            
            <div className="flex flex-wrap justify-center gap-2">
              {[16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28].map((bid) => (
                <button
                  key={bid}
                  disabled={bid <= gameState.highestBid}
                  onClick={() => placeBid(bid)}
                  className={`
                    w-11 h-11 rounded-full font-display font-black text-xs flex items-center justify-center cursor-pointer transition-all border
                    ${bid <= gameState.highestBid 
                      ? 'bg-slate-950/40 border-slate-900 text-slate-700 cursor-not-allowed' 
                      : 'bg-premium-black border-gold-500/25 text-gold-400 hover:border-gold-500 hover:text-gold-200 active:scale-95 shadow-sm'
                    }
                  `}
                >
                  {bid}
                </button>
              ))}
            </div>

            <div className="flex space-x-3 pt-2">
              <Button 
                variant="danger" 
                onClick={passBid}
                className="flex-1 py-3"
              >
                PASS
              </Button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* 2. Trump Selection Modal */}
      {activeModal === 'TRUMP_SELECT' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-premium-black/40" />
          <GlassPanel className="relative z-10 w-full max-w-md border-gold-500/20 text-center space-y-6 animate-in zoom-in-95 duration-200" glow>
            <div>
              <h3 className="font-display text-xl font-extrabold text-gold-400 tracking-wider">CHOOSE TRUMP SUIT</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Select the secret suit directly, or use one of the traditional hidden card selection methods below.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'] as Suit[]).map((suit) => {
                const info = SUIT_INFO[suit];
                return (
                  <button
                    key={suit}
                    onClick={() => { selectTrump(suit); closeModal(); }}
                    className="p-3 rounded-xl bg-premium-black border border-gold-500/10 hover:border-gold-500/50 hover:bg-gold-500/5 cursor-pointer text-center space-y-1 group transition-all"
                  >
                    <div className="text-xl transition-transform group-hover:scale-110">{info.symbol}</div>
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">{info.name.slice(0, 3)}</span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gold-500/10 pt-4 text-left">
              <span className="text-[10px] font-black uppercase text-gold-500/60 tracking-wider block mb-3">Special Selection Methods</span>
              
              <div className="grid grid-cols-2 gap-3">
                {/* 7th Card Option */}
                <button
                  onClick={() => {
                    const seventhCardSuit = gameState.hands?.SOUTH[6]?.suit || 'DIAMONDS';
                    selectTrump(seventhCardSuit);
                    closeModal();
                  }}
                  className="p-4 rounded-xl bg-gradient-to-b from-premium-gray/60 to-premium-black border border-gold-500/15 hover:border-gold-500/60 hover:bg-gold-500/5 cursor-pointer text-center space-y-1.5 group transition-all"
                >
                  <div className="text-2xl group-hover:scale-110 transition-transform">🎴</div>
                  <span className="text-[10px] font-black text-slate-200 block uppercase tracking-wider">7th Card Trump</span>
                  <p className="text-[8px] text-slate-500 leading-tight">Trump suit is set by the 7th card dealt to you.</p>
                </button>

                {/* Joker Card Option */}
                <button
                  onClick={() => {
                    const seventhCardSuit = gameState.hands?.SOUTH[6]?.suit || 'SPADES';
                    selectTrump(seventhCardSuit);
                    closeModal();
                  }}
                  className="p-4 rounded-xl bg-gradient-to-b from-premium-gray/60 to-premium-black border border-gold-500/15 hover:border-gold-500/60 hover:bg-gold-500/5 cursor-pointer text-center space-y-1.5 group transition-all"
                >
                  <div className="text-2xl group-hover:scale-110 transition-transform">🃟</div>
                  <span className="text-[10px] font-black text-gold-400 block uppercase tracking-wider">Joker Trump</span>
                  <p className="text-[8px] text-slate-500 leading-tight">Use a premium Joker card as the hidden trump indicator.</p>
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* 3. Single Hand Modal */}
      {activeModal === 'SINGLE_HAND' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-premium-black/40" />
          <GlassPanel className="relative z-10 w-full max-w-sm border-gold-500/20 text-center space-y-5" glow>
            <h3 className="font-display text-lg font-extrabold text-gold-400">PLAY SINGLE HAND?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If you declare Single Hand, you will play alone against all three players. Your partner will not contribute. You must win all 8 tricks to earn +3 game points!
            </p>
            <div className="flex space-x-3 pt-2">
              <Button 
                variant="glass" 
                onClick={() => respondSingleHand(false)}
                className="flex-1"
              >
                No, Standard Play
              </Button>
              <Button 
                variant="gold" 
                onClick={() => respondSingleHand(true)}
                className="flex-1"
                glow
              >
                Yes, Play Alone!
              </Button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* 4. Match Results Modal */}
      {activeModal === 'RESULTS' && gameState.roundResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-premium-black/85 backdrop-blur-md" />
          <GlassPanel className="relative z-10 w-full max-w-sm border-gold-500/20 text-center space-y-6" glow>
            <div className="w-16 h-16 mx-auto rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Award size={32} />
            </div>
            
            <div>
              <h3 className="font-display text-2xl font-black text-slate-100 tracking-wide">
                {gameState.roundResult.winner === 'RED' ? 'VICTORY!' : 'DEFEAT'}
              </h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {gameState.roundResult.winner === 'RED' ? 'Your team met the bid targets.' : 'Opponents defended successfully.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-premium-black/40 border border-gold-500/5 space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>Round Score Change:</span>
                <span className="text-gold-400">+{gameState.roundResult.scoreChange} Pts</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>Red Team Matches:</span>
                <span className="text-red-400">{gameState.matchScores.redTeam} / 6</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>Blue Team Matches:</span>
                <span className="text-blue-400">{gameState.matchScores.blueTeam} / 6</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <Button 
                variant="glass" 
                onClick={() => { closeModal(); navigate('/'); }}
                className="flex-1"
              >
                Quit Game
              </Button>
              <Button 
                variant="gold" 
                onClick={() => { closeModal(); resetGame(); navigate('/lobby/' + (gameState.roomCode || '')); }}
                className="flex-1"
                glow
              >
                Play Again
              </Button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* 5. Pair Declaration Confirmation Modal */}
      {showPairConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-premium-black/85 backdrop-blur-md" onClick={() => setShowPairConfirm(false)} />
          <GlassPanel className="relative z-10 w-full max-w-sm border-gold-500/20 text-center space-y-5" glow>
            <h3 className="font-display text-lg font-extrabold text-gold-400">DECLARE TRUMP PAIR?</h3>
            <p className="text-xs text-slate-400 leading-relaxed text-left">
              Are you sure you want to declare a Trump Pair? In 29, declaring a Pair (holding both the King and Queen of the trump suit) adjusts the game bidding target by **4 points**:
            </p>
            <div className="text-left space-y-1.5 p-3 rounded-lg bg-premium-black/40 border border-gold-500/5 text-[10px] text-slate-400 font-bold">
              <div className="flex justify-between">
                <span>If Bidder Declares:</span>
                <span className="text-gold-400">Target Shifted by -4 Pts (Easier)</span>
              </div>
              <div className="flex justify-between">
                <span>If Defender Declares:</span>
                <span className="text-red-400">Target Shifted by +4 Pts (Harder)</span>
              </div>
            </div>
            <div className="flex space-x-3 pt-2">
              <Button 
                variant="glass" 
                onClick={() => setShowPairConfirm(false)}
                className="flex-1 py-2.5"
              >
                Cancel
              </Button>
              <Button 
                variant="gold" 
                onClick={() => {
                  setShowPairConfirm(false);
                  declarePair();
                  // Trigger cinematic animation
                  setPairAnimationActive(true);
                  setTimeout(() => setPairAnimationActive(false), 3000);
                }}
                className="flex-1 py-2.5"
                glow
              >
                Declare
              </Button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Pair Declaration Cinematic Overlay */}
      <AnimatePresence>
        {pairAnimationActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-premium-black/85 backdrop-blur-sm pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: -50 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="flex flex-col items-center space-y-6"
            >
              {/* Floating Cards */}
              <div className="flex space-x-6 relative">
                {/* King card */}
                <motion.div
                  initial={{ x: -150, rotate: -20, opacity: 0 }}
                  animate={{ x: 0, rotate: -5, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 80 }}
                  className="w-24 h-36 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-gold-300 flex flex-col items-center justify-between p-3 shadow-2xl shadow-gold-500/30"
                >
                  <div className="w-full flex justify-between text-xs font-black text-premium-black">
                    <span>K</span>
                    <span>{gameState.trumpSuit === 'HEARTS' || gameState.trumpSuit === 'DIAMONDS' ? '♥' : '♠'}</span>
                  </div>
                  <span className="text-3xl text-premium-black">👑</span>
                  <div className="w-full flex justify-between text-xs font-black text-premium-black rotate-180">
                    <span>K</span>
                    <span>{gameState.trumpSuit === 'HEARTS' || gameState.trumpSuit === 'DIAMONDS' ? '♥' : '♠'}</span>
                  </div>
                </motion.div>

                {/* Queen card */}
                <motion.div
                  initial={{ x: 150, rotate: 20, opacity: 0 }}
                  animate={{ x: 0, rotate: 5, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 80 }}
                  className="w-24 h-36 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-gold-300 flex flex-col items-center justify-between p-3 shadow-2xl shadow-gold-500/30"
                >
                  <div className="w-full flex justify-between text-xs font-black text-premium-black">
                    <span>Q</span>
                    <span>{gameState.trumpSuit === 'HEARTS' || gameState.trumpSuit === 'DIAMONDS' ? '♥' : '♠'}</span>
                  </div>
                  <span className="text-3xl text-premium-black">👸</span>
                  <div className="w-full flex justify-between text-xs font-black text-premium-black rotate-180">
                    <span>Q</span>
                    <span>{gameState.trumpSuit === 'HEARTS' || gameState.trumpSuit === 'DIAMONDS' ? '♥' : '♠'}</span>
                  </div>
                </motion.div>
              </div>

              {/* Text Banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center space-y-2"
              >
                <h2 className="font-display text-4xl font-black text-gold-400 tracking-widest drop-shadow-[0_0_12px_rgba(212,175,55,0.6)] uppercase animate-pulse">
                  Pair Declared!
                </h2>
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                  Target Score Shifted by 4 Pts
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Game;
