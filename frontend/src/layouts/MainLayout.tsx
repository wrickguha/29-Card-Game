import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  User, 
  Home, 
  Users, 
  LogOut, 
  Menu, 
  X,
  Trophy
} from 'lucide-react';
import Button from '../components/ui/Button';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { soundMuted, toggleSound } = useUIStore();
  const { notifications, unreadCount, markAllAsRead, removeNotification } = useNotificationStore();

  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: <Home size={18} /> },
    { path: '/profile', label: 'Profile', icon: <User size={18} /> },
    { path: '/friends', label: 'Friends', icon: <Users size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col relative text-slate-200">
      {/* Background Decor */}
      <div className="ambient-glow top-0 left-[20%] scale-150" />
      <div className="ambient-glow bottom-0 right-[10%] scale-125" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-premium-black/60 backdrop-blur-xl border-b border-gold-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center shadow-lg shadow-gold-500/20 group-hover:scale-105 transition-transform duration-300">
              <span className="font-display text-2xl font-black text-premium-black">29</span>
            </div>
            <div>
              <span className="font-display text-xl font-extrabold tracking-wider block gold-text-gradient">ROYAL CLUB</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold-500/60 block -mt-1">Card Game</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300
                    ${active 
                      ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20 shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                      : 'text-slate-400 hover:text-gold-400 hover:bg-premium-gray/50 border border-transparent'
                    }
                  `}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Stats & Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {/* User Profile Summary */}
            {user && (
              <Link to="/profile" className="flex items-center space-x-3 p-1.5 pr-4 rounded-full bg-premium-gray/60 border border-gold-500/10 hover:border-gold-500/30 transition-all duration-300">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-amber-700 flex items-center justify-center text-xs font-black text-premium-black uppercase border border-gold-400">
                  {user.username.slice(0, 2)}
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-slate-200 tracking-wide line-clamp-1">{user.username}</div>
                  <div className="text-[10px] text-gold-500 font-bold flex items-center space-x-1">
                    <Trophy size={10} />
                    <span>Lvl {user.level} • {user.rank}</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-premium-gray/60 border border-gold-500/10 hover:border-gold-500/40 text-gold-400 hover:text-gold-300 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Notifications Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-premium-gray/60 border border-gold-500/10 hover:border-gold-500/40 text-gold-400 hover:text-gold-300 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-[10px] font-black flex items-center justify-center text-white border border-premium-black animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl glass-panel p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-gold-500/10 pb-3 mb-3">
                    <h3 className="font-display font-bold text-gold-400">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-gold-500 hover:text-gold-300 cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500 font-medium">No notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`p-2.5 rounded-xl border transition-all text-left ${notif.read ? 'bg-premium-black/20 border-transparent' : 'bg-gold-500/5 border-gold-500/20'}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-gold-400 tracking-wide uppercase">{notif.type}</span>
                            <span className="text-[9px] text-slate-500 font-medium">{notif.timestamp}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-200 mt-0.5">{notif.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                          {notif.type === 'INVITE' && (
                            <div className="flex space-x-2 mt-2">
                              <Button 
                                size="sm" 
                                variant="gold" 
                                className="py-1 px-3 text-[10px]"
                                onClick={() => {
                                  navigate(`/lobby/${notif.roomId}`);
                                  removeNotification(notif.id);
                                  setNotifOpen(false);
                                }}
                              >
                                Join
                              </Button>
                              <Button 
                                size="sm" 
                                variant="danger" 
                                className="py-1 px-3 text-[10px]"
                                onClick={() => removeNotification(notif.id)}
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-premium-gray/60 border border-red-950/20 hover:border-red-600/40 text-red-400 hover:text-red-300 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Audio toggle for mobile */}
            <button
              onClick={toggleSound}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-premium-gray/60 border border-gold-500/10 text-gold-400"
            >
              {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-premium-gray/60 border border-gold-500/10 text-gold-400"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gold-500/10 bg-premium-black/95 p-4 space-y-3 animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold
                      ${active 
                        ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' 
                        : 'text-slate-400 hover:text-gold-400 hover:bg-premium-gray/30'
                      }
                    `}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gold-500/10 pt-3 flex items-center justify-between">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-xs font-black text-premium-black uppercase">
                    {user.username.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{user.username}</div>
                    <div className="text-[10px] text-gold-500">Lvl {user.level} • {user.rank}</div>
                  </div>
                </div>
              )}
              <Button size="sm" variant="danger" onClick={handleLogout} className="py-2">
                <LogOut size={14} className="mr-1.5" /> Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-premium-black/60 backdrop-blur-xl border-t border-gold-500/5 py-4 text-center z-10">
        <p className="text-[10px] font-semibold tracking-wider text-slate-600 uppercase">
          &copy; 2026 Royal Club 29. Designed for elite card playing.
        </p>
      </footer>
    </div>
  );
};
export default MainLayout;
