import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-premium-black select-none">
      {/* Cinematic Ambient Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,37,24,0.35)_0%,rgba(8,9,10,1)_100%)] z-0" />
      
      {/* Floating Card Suits Details */}
      <div className="absolute top-[10%] left-[15%] text-gold-500/10 text-9xl font-black rotate-12 animate-float pointer-events-none">♣</div>
      <div className="absolute bottom-[15%] left-[8%] text-red-700/5 text-8xl font-black -rotate-12 animate-float pointer-events-none" style={{ animationDelay: '1.5s' }}>♥</div>
      <div className="absolute top-[18%] right-[10%] text-red-700/5 text-9xl font-black rotate-45 animate-float pointer-events-none" style={{ animationDelay: '0.8s' }}>♦</div>
      <div className="absolute bottom-[8%] right-[15%] text-gold-500/10 text-[10rem] font-black -rotate-45 animate-float pointer-events-none" style={{ animationDelay: '2.2s' }}>♠</div>

      {/* Radiant Glow Spots */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-gold-500/5 blur-[80px] top-[20%] left-[30%] pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[100px] bottom-[15%] right-[25%] pointer-events-none" />

      {/* Main Card Holder */}
      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Animated Brand Header */}
        <div className="text-center mb-8 animate-fade-in duration-700">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-700 items-center justify-center shadow-xl shadow-gold-500/20 border border-gold-300/40 mb-3">
            <span className="font-display text-3xl font-black text-premium-black">29</span>
          </div>
          <h1 className="font-display text-3xl font-black tracking-wider gold-text-gradient">ROYAL CLUB</h1>
          <p className="text-xs uppercase font-extrabold tracking-widest text-gold-500/50 mt-1">Multiplayer Arena</p>
        </div>

        {/* Form Container */}
        {children}
      </div>
    </div>
  );
};
export default AuthLayout;
