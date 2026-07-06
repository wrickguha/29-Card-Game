import React, { useState } from 'react';
import { useUIStore } from '../stores/useUIStore';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import { 
  Users, 
  Search, 
  UserPlus, 
  MessageSquare, 
  Zap
} from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  rank: string;
  status: 'ONLINE' | 'OFFLINE' | 'IN_GAME';
  winRate: number;
}

const MOCK_FRIENDS: Friend[] = [
  { id: 'fr_1', name: 'GrandMaster29', avatar: 'emerald_knight', rank: 'PLATINUM', status: 'ONLINE', winRate: 64 },
  { id: 'fr_2', name: 'SilentBluff', avatar: 'ruby_queen', rank: 'GOLD', status: 'IN_GAME', winRate: 58 },
  { id: 'fr_3', name: 'AceDeceiver', avatar: 'sapphire_king', rank: 'GOLD', status: 'OFFLINE', winRate: 52 },
];

export const Friends: React.FC = () => {
  const { addToast } = useUIStore();
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestCount, setRequestCount] = useState(1);

  const inviteFriend = (name: string) => {
    addToast({
      type: 'success',
      title: 'Invite Sent',
      message: `Sent lobby game invitation to ${name}.`,
    });
  };

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-left max-w-5xl mx-auto">
      {/* Grid: Friends list vs Requests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Friends Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-xl font-black text-slate-100 flex items-center space-x-2">
              <Users className="text-gold-500" size={20} />
              <span>Card Partners ({friends.length})</span>
            </h2>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search partners..."
                className="w-full bg-premium-black/60 border border-gold-500/10 focus:border-gold-500/40 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-300 placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-bold">No card partners found.</div>
            ) : (
              filteredFriends.map((friend) => (
                <GlassPanel 
                  key={friend.id}
                  className="p-4 border-gold-500/5 hover:border-gold-500/15 transition-all flex items-center justify-between"
                  hoverable
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-premium-light border border-gold-500/10 flex items-center justify-center font-display text-sm font-bold text-gold-400">
                        {friend.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-premium-black ${
                        friend.status === 'ONLINE' ? 'bg-emerald-500' :
                        friend.status === 'IN_GAME' ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'
                      }`} />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-slate-200">{friend.name}</span>
                        <span className="text-[9px] font-black uppercase text-gold-500/70">{friend.rank}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold flex items-center space-x-2 mt-0.5">
                        <span>Winrate: {friend.winRate}%</span>
                        <span>•</span>
                        <span>{friend.status === 'ONLINE' ? 'Available' : 
                               friend.status === 'IN_GAME' ? 'In Playing Screen' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => addToast({ type: 'info', title: 'Chat', message: `Open chat channel with ${friend.name}` })}
                      className="p-2.5 rounded-xl bg-premium-black border border-gold-500/5 text-slate-400 hover:text-gold-400 cursor-pointer transition-all"
                      title="Send Message"
                    >
                      <MessageSquare size={14} />
                    </button>
                    <Button 
                      size="sm" 
                      variant={friend.status === 'ONLINE' ? 'gold' : 'glass'}
                      disabled={friend.status !== 'ONLINE'}
                      onClick={() => inviteFriend(friend.name)}
                      className="text-[10px] py-2 px-3 flex items-center space-x-1"
                    >
                      <Zap size={10} fill="currentColor" />
                      <span>INVITE</span>
                    </Button>
                  </div>
                </GlassPanel>
              ))
            )}
          </div>
        </div>

        {/* Requests Column */}
        <div className="space-y-6">
          <h2 className="font-display text-xl font-black text-slate-100 flex items-center space-x-2">
            <UserPlus className="text-gold-500" size={20} />
            <span>Invitations ({requestCount})</span>
          </h2>

          <GlassPanel className="p-4 border-gold-500/10 space-y-4">
            {requestCount === 0 ? (
              <p className="text-xs text-slate-500 font-bold text-center py-6">No pending invitations.</p>
            ) : (
              <div className="p-3 bg-premium-black/40 border border-gold-500/5 rounded-xl space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-red-950 flex items-center justify-center font-display text-xs font-bold text-red-400">
                    RD
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black text-slate-200 block">RedDeceiver</span>
                    <span className="text-[9px] font-bold text-slate-500 block">Level 8 • 48% WR</span>
                  </div>
                </div>
                <div className="flex space-x-2 pt-1">
                  <Button 
                    size="sm" 
                    variant="success" 
                    className="flex-1 py-1.5 text-[10px]"
                    onClick={() => {
                      setRequestCount(0);
                      addToast({ type: 'success', title: 'Partner Added', message: 'RedDeceiver added to friends.' });
                      setFriends(prev => [...prev, { id: 'fr_4', name: 'RedDeceiver', avatar: 'ruby_queen', rank: 'SILVER', status: 'ONLINE', winRate: 48 }]);
                    }}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    className="flex-1 py-1.5 text-[10px]"
                    onClick={() => {
                      setRequestCount(0);
                      addToast({ type: 'info', title: 'Decline', message: 'Invitation declined.' });
                    }}
                  >
                    Ignore
                  </Button>
                </div>
              </div>
            )}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};
export default Friends;
