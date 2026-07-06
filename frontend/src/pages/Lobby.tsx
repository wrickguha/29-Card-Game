import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoomStore } from '../stores/useRoomStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import { useGameStore } from '../stores/useGameStore';
import { api } from '../services/api';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { 
  Copy, 
  Share2, 
  Send, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Wifi,
  Volume2
} from 'lucide-react';

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { roomId: roomCode } = useParams<{ roomId: string }>();
  
  const { user } = useAuthStore();
  const { 
    currentRoom, 
    lobbyChat, 
    ping, 
    toggleReady, 
    sendChatMessage, 
    leaveRoom,
    startPollingRoom,
    stopPollingRoom
  } = useRoomStore();
  const { joinGame } = useGameStore();
  const { addToast } = useUIStore();

  const [messageText, setMessageText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lobbyChat]);

  if (!currentRoom) {
    return (
      <div className="py-24 text-center space-y-4">
        <Clock className="mx-auto text-gold-500 animate-spin" size={32} />
        <h2 className="font-display text-xl font-bold text-slate-400">Loading Lobby data...</h2>
        <Button variant="glass" onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    addToast({
      type: 'success',
      title: 'Copied Code',
      message: 'Room code copied to clipboard.',
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user) return;
    sendChatMessage(messageText.trim());
    setMessageText('');
  };

  const seats = [
    { position: 'SOUTH', label: 'You (South)' },
    { position: 'WEST', label: 'West Partner' },
    { position: 'NORTH', label: 'North (Partner)' },
    { position: 'EAST', label: 'East Partner' },
  ];

  useEffect(() => {
    if (roomCode) {
      startPollingRoom(roomCode, (gameId) => {
        joinGame(gameId);
        addToast({
          type: 'success',
          title: 'Game Started',
          message: 'The match has begun! Transitioning to game board...',
        });
        navigate(`/game/${gameId}`);
      });
    }
    return () => {
      stopPollingRoom();
    };
  }, [roomCode, startPollingRoom, stopPollingRoom, joinGame, navigate]);

  const handleReadyClick = () => {
    if (user) {
      toggleReady();
    }
  };

  const handleStartGame = async () => {
    if (!currentRoom) return;
    try {
      addToast({
        type: 'info',
        title: 'Launching Game',
        message: 'Starting the match and creating game session...',
      });
      const response = await api.rooms.start(currentRoom.code);
      if (response.success && response.data) {
        const { gameId } = response.data;
        joinGame(gameId);
        navigate(`/game/${gameId}`);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Launch Failed',
        message: err.message || 'Could not start game.',
      });
    }
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Upper Status Panel */}
      <GlassPanel className="p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border-gold-500/10 bg-gradient-to-br from-premium-gray/50 to-premium-black">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Room Lobby Code</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="font-display text-2xl font-black text-gold-400 tracking-wider">{currentRoom.code}</span>
              <button 
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-premium-black border border-gold-500/10 hover:border-gold-500/40 text-gold-500 hover:text-gold-400 transition-all cursor-pointer"
                title="Copy Code"
              >
                <Copy size={14} />
              </button>
              <button 
                onClick={() => addToast({ type: 'info', title: 'Share Link', message: 'Lobby invite link generated.' })}
                className="p-1.5 rounded-lg bg-premium-black border border-gold-500/10 hover:border-gold-500/40 text-gold-500 hover:text-gold-400 transition-all cursor-pointer"
                title="Share Room"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Room configuration status */}
        <div className="flex items-center space-x-6 text-xs font-bold text-slate-400">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Mode</span>
            <span className="text-slate-300 mt-0.5 block">Standard 29 Game</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Connection Ping</span>
            <span className="text-emerald-400 flex items-center space-x-1 mt-0.5">
              <Wifi size={12} />
              <span>{ping} ms</span>
            </span>
          </div>
          <Button variant="danger" size="sm" onClick={() => { leaveRoom(); navigate('/'); }} className="py-2">
            Leave
          </Button>
        </div>
      </GlassPanel>

      {/* Main Grid: Seats Layout vs Chat Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seats Layout Box */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-display text-xl font-black text-slate-200 flex items-center space-x-2">
            <Volume2 className="text-gold-500" size={20} />
            <span>Table Arrangement Seats</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {seats.map((seat) => {
              const player = currentRoom.players.find(p => p.position === seat.position);
              return (
                <GlassPanel 
                  key={seat.position} 
                  className={`p-5 flex items-center justify-between border transition-all ${
                    player 
                      ? 'border-gold-500/15 bg-premium-gray/30' 
                      : 'border-dashed border-slate-800 bg-premium-black/20'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {player ? (
                      <Avatar id={player.avatar} className="w-12 h-12" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-slate-700 animate-pulse">
                        ?
                      </div>
                    )}

                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">{seat.label}</span>
                      {player ? (
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-sm font-black text-slate-200">{player.name}</span>
                          {player.isHost && (
                            <span className="p-0.5 rounded bg-gold-500/10 border border-gold-500/30 text-[8px] font-bold text-gold-400 uppercase tracking-widest">
                              Host
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-600 block mt-0.5">Waiting for player...</span>
                      )}
                    </div>
                  </div>

                  {/* Ready indicator */}
                  {player && (
                    <div className="flex items-center">
                      {player.isReady ? (
                        <span className="text-emerald-500 flex items-center space-x-1 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 size={12} fill="currentColor" className="text-premium-black" />
                          <span>READY</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center space-x-1 text-xs font-bold bg-slate-950/40 px-2.5 py-1 rounded-full border border-transparent">
                          <Clock size={12} />
                          <span>WAITING</span>
                        </span>
                      )}
                    </div>
                  )}
                </GlassPanel>
              );
            })}
          </div>

          {/* Quick Actions (Ready trigger) */}
          <div className="flex space-x-4">
            <Button
              variant={user && currentRoom.players.find(p => p.id === user.id)?.isReady ? 'success' : 'gold'}
              onClick={handleReadyClick}
              size="lg"
              className="flex-1"
              glow
            >
              {user && currentRoom.players.find(p => p.id === user.id)?.isReady ? 'UNREADY SEAT' : 'DECLARE READY'}
            </Button>
            
            {/* Host start button or mock trigger button */}
            <Button
              variant="gold"
              onClick={handleStartGame}
              size="lg"
              className="flex-1"
              glow
            >
              START MATCH NOW
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-gold-500/5 border border-gold-500/10 text-xs font-semibold text-gold-400/90 flex items-start space-x-3">
            <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
            <p>
              Note: This is a frontend demo sandbox. You can click "START MATCH NOW" to launch the local practice match boards against AI bots immediately, simulating card deals, bids and declarations.
            </p>
          </div>
        </div>

        {/* Chat Box */}
        <div className="space-y-6 flex flex-col h-full">
          <h2 className="font-display text-xl font-black text-slate-200">
            Lobby Chats
          </h2>

          <GlassPanel className="p-4 border-gold-500/15 flex flex-col h-[400px]">
            {/* Chats Messages list */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-4">
              {lobbyChat.map((msg) => (
                <div key={msg.id} className="text-xs">
                  {msg.senderName === 'SYSTEM' ? (
                    <div className="p-2 rounded-lg bg-gold-500/5 border border-gold-500/10 text-gold-500 text-center font-bold">
                      {msg.message}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className={`text-[10px] ${msg.senderPosition === 'SOUTH' ? 'text-gold-400' : 'text-slate-400'}`}>
                          {msg.senderName} ({msg.senderPosition})
                        </span>
                        <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                      </div>
                      <p className="bg-premium-black/40 border border-gold-500/5 p-2 rounded-xl text-slate-300 font-medium">
                        {msg.message}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Input field form */}
            <form onSubmit={handleSendMessage} className="flex space-x-2 mt-auto">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type in chat..."
                className="flex-1 bg-premium-black/60 border border-gold-500/10 focus:border-gold-500/40 rounded-xl py-2 px-3 text-xs font-semibold text-slate-300 placeholder-slate-600 outline-none transition-all"
              />
              <button 
                type="submit"
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gold-500 text-premium-black hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                <Send size={14} />
              </button>
            </form>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};
export default Lobby;
