import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useRoomStore } from '../stores/useRoomStore';
import { useGameStore } from '../stores/useGameStore';
import { useUIStore } from '../stores/useUIStore';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import { 
  Play, 
  PlusCircle, 
  Users, 
  ArrowRight,
  Zap
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createRoom, joinRoom } = useRoomStore();
  const { initGame } = useGameStore();
  const { addToast } = useUIStore();

  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const code = await createRoom(user.username, user.avatar);
      addToast({
        type: 'success',
        title: 'Lobby Created',
        message: `Lobby room created with code ${code}. Ready to invite.`,
      });
      navigate(`/lobby/${code}`);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not create lobby room.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode) return;
    setActionLoading(true);
    try {
      const success = await joinRoom(joinCode.toUpperCase(), user.username, user.avatar);
      if (success) {
        addToast({
          type: 'success',
          title: 'Joined Lobby',
          message: `Successfully entered Room lobby #${joinCode.toUpperCase()}.`,
        });
        navigate(`/lobby/${joinCode.toUpperCase()}`);
      } else {
        addToast({
          type: 'error',
          title: 'Join Failed',
          message: 'Room not found or full.',
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Something went wrong.',
      });
    } finally {
      setActionLoading(false);
      setShowJoinModal(false);
    }
  };

  const startPractice = () => {
    setActionLoading(true);
    addToast({
      type: 'info',
      title: 'Practice Started',
      message: 'Launching practice arena against AI bots...',
    });
    setTimeout(() => {
      initGame('local_practice');
      navigate('/game/local_practice');
      setActionLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto">
      {/* Banner */}
      <GlassPanel 
        className="relative overflow-hidden p-8 rounded-3xl bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.15)_0%,rgba(11,12,16,0.9)_70%)] border border-gold-500/20"
        glow
      >
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-black uppercase tracking-wider">
            <Zap size={12} fill="currentColor" />
            <span>Grand Opening Tourney Live</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black leading-tight tracking-wide gold-text-gradient">
            CLAIM YOUR SEAT AT THE ROYAL FELT
          </h1>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            Experience real-time 29 card game action with stunning card mechanics, double set multipliers, hidden trump triggers, and matches against players worldwide.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Button variant="gold" size="lg" onClick={startPractice} loading={actionLoading} className="flex items-center space-x-2">
              <Play size={16} fill="currentColor" />
              <span>PRACTICE VS BOTS</span>
            </Button>
            <Button variant="glass" size="lg" onClick={handleCreateRoom} loading={actionLoading} className="flex items-center space-x-2">
              <PlusCircle size={16} />
              <span>CREATE PRIVATE ROOM</span>
            </Button>
          </div>
        </div>
        <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 bg-[radial-gradient(circle,rgba(28,156,97,0.15)_0%,rgba(0,0,0,0)_60%)] flex items-center justify-center font-display text-[15rem] text-gold-500/5 rotate-12 font-black pointer-events-none select-none">
          J
        </div>
      </GlassPanel>

      {/* Play Lobby Options */}
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-black text-slate-100 flex items-center space-x-2">
          <Users className="text-gold-500" size={22} />
          <span>Join & Arena Channels</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <GlassPanel hoverable className="flex flex-col justify-between h-48 border-gold-500/10">
            <div>
              <h3 className="font-display text-lg font-bold text-gold-400">Join Matchmaking</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Compete online against active players on your level to climb ranks and claim season badge awards.
              </p>
            </div>
            <Button 
              variant="gold" 
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'Matchmaking',
                  message: 'Finding active lobby. Connecting to lobby channel...',
                });
                setTimeout(() => handleCreateRoom(), 1000);
              }}
              className="mt-4 w-full flex items-center justify-center space-x-1.5"
            >
              <span>Quick Play</span>
              <ArrowRight size={14} />
            </Button>
          </GlassPanel>

          <GlassPanel hoverable className="flex flex-col justify-between h-48 border-gold-500/10">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-200">Join Room Code</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Enter a room code sent by a friend to jump straight into their private game table.
              </p>
            </div>
            <Button 
              variant="glass" 
              onClick={() => setShowJoinModal(true)} 
              className="mt-4 w-full flex items-center justify-center space-x-1.5 border-gold-500/30"
            >
              <span>Enter Room Code</span>
            </Button>
          </GlassPanel>
        </div>
      </div>

      {/* Join Room Dialog Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-premium-black/85 backdrop-blur-md" onClick={() => setShowJoinModal(false)} />
          <GlassPanel className="relative z-10 w-full max-w-sm border-gold-500/20" glow>
            <h3 className="font-display text-xl font-extrabold text-gold-400 text-center mb-4">JOIN PRIVATE ROOM</h3>
            <form onSubmit={handleJoinRoomSubmit} className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Lobby Room Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ENTER 6-LETTER CODE"
                  className="w-full bg-premium-black/60 border border-gold-500/10 focus:border-gold-500/40 rounded-xl py-3.5 text-center text-lg font-black text-gold-400 placeholder-slate-700 outline-none tracking-widest uppercase transition-all"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <Button 
                  type="button" 
                  variant="glass" 
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="gold" 
                  loading={actionLoading}
                  className="flex-1"
                >
                  JOIN GAME
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
};
export default Home;
