import React, { useEffect } from 'react';
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
  Award
} from 'lucide-react';
import { SUIT_INFO } from '../constants/game';
import type { Suit } from '../types/game';

export const Game: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const { 
    gameState, 
    statusText, 
    isYourTurn, 
    timerCount,
    initGame,
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

  useEffect(() => {
    // If game state is empty, initialize it locally
    if (!gameState && roomId) {
      initGame(roomId);
    }
    return () => {
      // Clean up game store on leave
      resetGame();
    };
  }, [roomId]);

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

        {/* Scores & audio toggles */}
        <div className="flex items-center space-x-4">
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
      <div className="flex-1 min-h-[500px] relative rounded-3xl bg-[radial-gradient(circle_at_center,var(--color-poker-800)_0%,var(--color-poker-900)_50%,var(--color-premium-black)_100%)] border-2 border-gold-500/25 shadow-2xl p-6 overflow-hidden flex flex-col justify-between">
        
        {/* Table Felt Lighting glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />

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
                : (gameState.trumpSuit ? '7th Card Hidden' : 'Selecting Suit...')}
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

          <Button size="sm" variant="glass" onClick={declarePair} className="text-[10px] flex-1 py-2">
            Declare Pair (+4/-4)
          </Button>
        </GlassPanel>
      </div>

      {/* Game Modals */}

      {/* 1. Bidding Modal */}
      {gameState.biddingActive && isYourTurn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-premium-black/85 backdrop-blur-md" />
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
          <div className="absolute inset-0 bg-premium-black/85 backdrop-blur-md" />
          <GlassPanel className="relative z-10 w-full max-w-md border-gold-500/20 text-center space-y-6 animate-in zoom-in-95 duration-200" glow>
            <h3 className="font-display text-xl font-extrabold text-gold-400 tracking-wider">CHOOSE TRUMP SUIT</h3>
            <p className="text-xs text-slate-400 font-medium">Select the secret suit. It will remain hidden in a face-down Joker card until revealed during play.</p>
            
            <div className="grid grid-cols-2 gap-4">
              {(['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'] as Suit[]).map((suit) => {
                const info = SUIT_INFO[suit];
                return (
                  <button
                    key={suit}
                    onClick={() => { selectTrump(suit); closeModal(); }}
                    className="p-5 rounded-2xl bg-premium-black border border-gold-500/15 hover:border-gold-500/60 hover:bg-gold-500/5 cursor-pointer text-center space-y-2 group transition-all"
                  >
                    <div className="text-3xl transition-transform group-hover:scale-110">{info.symbol}</div>
                    <span className="text-xs font-black text-slate-300 block uppercase tracking-wider">{info.name}</span>
                  </button>
                );
              })}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* 3. Single Hand Modal */}
      {activeModal === 'SINGLE_HAND' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-premium-black/85 backdrop-blur-md" />
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
                onClick={() => { closeModal(); initGame(roomId!); }}
                className="flex-1"
                glow
              >
                Play Again
              </Button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
};
export default Game;
