import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import GlassPanel from '../components/ui/GlassPanel';
import { 
  Trophy, 
  Target, 
  Heart, 
  Edit3, 
  Check,
  Calendar,
  Sparkles
} from 'lucide-react';

const AVATAR_OPTIONS = [
  { id: 'royal_gold', label: 'Gold Crest', class: 'from-amber-400 to-amber-600' },
  { id: 'emerald_knight', label: 'Emerald Shield', class: 'from-emerald-400 to-emerald-600' },
  { id: 'ruby_queen', label: 'Ruby Crown', class: 'from-red-400 to-red-600' },
  { id: 'sapphire_king', label: 'Sapphire Scepter', class: 'from-blue-400 to-blue-600' },
];

export const Profile: React.FC = () => {
  const { user, updateAvatar } = useAuthStore();
  const { addToast } = useUIStore();
  const [editingAvatar, setEditingAvatar] = useState(false);

  if (!user) return <div className="text-center py-12 text-slate-500 font-bold">Please sign in to view your profile.</div>;

  const selectAvatar = (avatarId: string) => {
    updateAvatar(avatarId);
    setEditingAvatar(false);
    addToast({
      type: 'success',
      title: 'Avatar Updated',
      message: 'Your in-game avatar has been customized.',
    });
  };

  const currentAvatarBg = AVATAR_OPTIONS.find(a => a.id === user.avatar)?.class || 'from-gold-400 to-gold-700';
  const stats = [
    { label: 'Games Played', value: user.gamesPlayed, icon: <Calendar className="text-blue-400" size={18} /> },
    { label: 'Games Won', value: user.gamesWon, icon: <Trophy className="text-gold-400" size={18} /> },
    { label: 'Win Ratio', value: `${user.winRate}%`, icon: <Target className="text-emerald-400" size={18} /> },
    { label: 'Gold Tokens', value: user.totalPointsEarned, icon: <Sparkles className="text-amber-400" size={18} /> },
  ];

  return (
    <div className="space-y-8 text-left max-w-5xl mx-auto">
      {/* Header card with Profile summary */}
      <GlassPanel className="p-8 rounded-3xl border-gold-500/10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 bg-gradient-to-br from-premium-gray/60 to-premium-black">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${currentAvatarBg} flex items-center justify-center font-display text-4xl font-black text-premium-black uppercase border-2 border-gold-400 shadow-xl shadow-gold-500/10`}>
              {user.username.slice(0, 2)}
            </div>
            <button
              onClick={() => setEditingAvatar(!editingAvatar)}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-premium-light border border-gold-500/30 hover:border-gold-500 text-gold-400 hover:scale-105 transition-all cursor-pointer shadow-md"
            >
              <Edit3 size={14} />
            </button>
          </div>

          <div className="text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h2 className="font-display text-2xl font-black text-slate-100">{user.username}</h2>
              <span className="px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-[10px] font-black uppercase tracking-wider">
                {user.rank}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Registered Member since July 2026</p>
            <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs text-slate-500 font-bold">
              <Heart size={14} className="text-red-500" />
              <span>Favorite Suit: Hearts ♥ • Partner: SilentBluff</span>
            </div>
          </div>
        </div>

        {/* Level Box */}
        <div className="px-6 py-4 rounded-2xl bg-premium-black/40 border border-gold-500/10 text-center w-full md:w-auto">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Season level</span>
          <span className="text-4xl font-display font-black text-gold-400 block mt-1">Lvl {user.level}</span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">Level Progress: 78%</span>
        </div>
      </GlassPanel>

      {/* Avatar Picker selection drawer */}
      {editingAvatar && (
        <GlassPanel className="p-6 border-gold-500/20" glow>
          <h3 className="font-display text-lg font-bold text-gold-400 mb-4 flex items-center space-x-2">
            <Sparkles size={18} />
            <span>Customize Avatar Emblem</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {AVATAR_OPTIONS.map((avatar) => {
              const active = user.avatar === avatar.id;
              return (
                <button
                  key={avatar.id}
                  onClick={() => selectAvatar(avatar.id)}
                  className={`relative p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                    active 
                      ? 'bg-gold-500/15 border-gold-500 shadow-md shadow-gold-500/5' 
                      : 'bg-premium-black/40 border-gold-500/10 hover:border-gold-500/40'
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${avatar.class} flex items-center justify-center font-display font-black text-premium-black text-lg`}>
                    {user.username.slice(0,2)}
                  </div>
                  <span className="text-xs font-bold text-slate-300 block mt-2">{avatar.label}</span>
                  {active && (
                    <span className="absolute top-2 right-2 text-gold-400 bg-premium-black p-0.5 rounded-full border border-gold-500/30">
                      <Check size={10} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </GlassPanel>
      )}
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <GlassPanel key={i} className="p-4 border-gold-500/5 hover:border-gold-500/10 transition-all text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-premium-black/60 flex items-center justify-center border border-gold-500/10">
              {stat.icon}
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mt-3">{stat.label}</span>
            <span className="text-2xl font-black text-slate-200 block mt-1">{stat.value}</span>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
};
export default Profile;
