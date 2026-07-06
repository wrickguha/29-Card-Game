import React, { useState, useEffect } from 'react';
import { useUIStore } from '../stores/useUIStore';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { api } from '../services/api';
import { 
  Users, 
  Search, 
  UserPlus, 
  Zap
} from 'lucide-react';

export const Friends: React.FC = () => {
  const { addToast } = useUIStore();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.users.list();
        if (response.success && response.data) {
          setUsers(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch players', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const inviteFriend = (name: string) => {
    addToast({
      type: 'success',
      title: 'Invite Sent',
      message: `Sent lobby game invitation to ${name}.`,
    });
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-left max-w-5xl mx-auto">
      {/* Grid: Players list vs Requests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Players Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-xl font-black text-slate-100 flex items-center space-x-2">
              <Users className="text-gold-500" size={20} />
              <span>Card Partners ({users.length})</span>
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
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-bold">
                {loading ? 'Loading active players...' : 'No other active players found.'}
              </div>
            ) : (
              filteredUsers.map((player) => (
                <GlassPanel 
                  key={player.id}
                  className="p-4 border-gold-500/5 hover:border-gold-500/15 transition-all flex items-center justify-between"
                  hoverable
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar id={player.avatar} className="w-10 h-10 rounded-xl" />
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-premium-black bg-emerald-500" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-slate-200">{player.username}</span>
                        <span className="text-[9px] font-black uppercase text-gold-500/70">{player.rank}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold flex items-center space-x-2 mt-0.5">
                        <span>Winrate: {player.winRate}%</span>
                        <span>•</span>
                        <span>Level {player.level}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="gold"
                      onClick={() => inviteFriend(player.username)}
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
            <span>Invitations (0)</span>
          </h2>

          <GlassPanel className="p-4 border-gold-500/10">
            <p className="text-xs text-slate-500 font-bold text-center py-6">No pending invitations.</p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};

export default Friends;
