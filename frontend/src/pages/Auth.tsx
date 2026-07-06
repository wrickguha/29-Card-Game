import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'login') {
        if (!email || !password) {
          addToast({
            type: 'error',
            title: 'Login Error',
            message: 'Please fill in all details.',
          });
          setLoading(false);
          return;
        }
        const success = await login(email, password);
        if (success) {
          addToast({
            type: 'success',
            title: 'Welcome Back',
            message: 'Signed in successfully as ' + email.split('@')[0],
          });
          navigate('/');
        }
      } else {
        if (!username || !email || !password) {
          addToast({
            type: 'error',
            title: 'Registration Error',
            message: 'Please fill in all details.',
          });
          setLoading(false);
          return;
        }
        const success = await register(username, email, password);
        if (success) {
          addToast({
            type: 'success',
            title: 'Account Created',
            message: 'Registered successfully as ' + username,
          });
          navigate('/');
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Authentication Failed',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassPanel className="w-full relative overflow-hidden" glow>
      {/* Tabs */}
      <div className="flex border-b border-gold-500/10 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('login')}
          className={`flex-1 text-center font-display font-black text-sm uppercase pb-3 border-b-2 tracking-widest transition-all cursor-pointer ${
            activeTab === 'login'
              ? 'text-gold-400 border-gold-500'
              : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`flex-1 text-center font-display font-black text-sm uppercase pb-3 border-b-2 tracking-widest transition-all cursor-pointer ${
            activeTab === 'register'
              ? 'text-gold-400 border-gold-500'
              : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {activeTab === 'register' && (
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <User size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. CardShredder"
                className="w-full bg-premium-black/60 border border-gold-500/10 focus:border-gold-500/50 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-200 placeholder-slate-600 outline-none transition-all"
                required={activeTab === 'register'}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5 text-left">
          <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <Mail size={16} />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. player@royalclub.com"
              className="w-full bg-premium-black/60 border border-gold-500/10 focus:border-gold-500/50 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-200 placeholder-slate-600 outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Password</label>
            {activeTab === 'login' && (
              <a href="#" className="text-[10px] font-bold text-gold-500 hover:text-gold-300">Forgot?</a>
            )}
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <Lock size={16} />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-premium-black/60 border border-gold-500/10 focus:border-gold-500/50 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-200 placeholder-slate-600 outline-none transition-all"
              required
            />
          </div>
          {activeTab === 'register' && password.length > 0 && (
            <div className="text-[10px] flex items-center space-x-1.5 text-slate-500 mt-1 font-semibold">
              <ShieldCheck size={12} className={password.length >= 8 ? 'text-emerald-500' : 'text-slate-500'} />
              <span>Password strength: {password.length >= 8 ? 'Strong' : 'Weak (Min 8 chars)'}</span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="gold"
            className="w-full py-3.5"
            loading={loading}
            glow
          >
            {activeTab === 'login' ? 'SIGN INTO LOBBY' : 'CREATE ACCOUNT'}
          </Button>
        </div>
      </form>

      {/* Guest Login Option */}
      <div className="mt-6 pt-4 border-t border-gold-500/10 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Or play instantly</p>
        <button
          onClick={() => {
            setEmail('guest@royalclub.com');
            setPassword('guest-login');
            setTimeout(() => {
              login('guest@royalclub.com', 'guest-login');
              addToast({ type: 'info', title: 'Guest Sign In', message: 'Logged in as RoyalGuest' });
              navigate('/');
            }, 300);
          }}
          className="text-xs font-bold text-gold-500 hover:text-gold-300 tracking-wide underline cursor-pointer"
        >
          Enter as Guest Player
        </button>
      </div>
    </GlassPanel>
  );
};
export default Auth;
