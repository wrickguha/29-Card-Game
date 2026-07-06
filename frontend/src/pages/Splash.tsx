import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import Button from '../components/ui/Button';

export const Splash: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          setLoadingComplete(true);
          return 100;
        }
        const diff = Math.random() * 15;
        return Math.min(oldProgress + diff, 100);
      });
    }, 150);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleEnter = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-premium-black relative overflow-hidden select-none">
      {/* Background radial fade */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,37,24,0.45)_0%,rgba(8,9,10,1)_100%)] z-0" />

      {/* Floating details */}
      <div className="absolute top-[20%] w-full text-center pointer-events-none opacity-20 z-0">
        <span className="font-display text-[12vw] font-black tracking-widest text-gold-500/10">ROYAL</span>
      </div>

      {/* Glow Center */}
      <div className="absolute w-[350px] h-[350px] rounded-full bg-gold-500/5 blur-[60px] pointer-events-none" />

      {/* Logo container */}
      <div className="z-10 flex flex-col items-center max-w-sm px-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center shadow-2xl shadow-gold-500/30 border border-gold-300 animate-float">
          <span className="font-display text-5xl font-black text-premium-black">29</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-widest mt-6 text-center gold-text-gradient">
          ROYAL CLUB
        </h1>
        <p className="text-xs uppercase font-extrabold tracking-[0.3em] text-gold-500/60 mt-2 text-center">
          Real-Time Multiplayer Arena
        </p>

        {/* Loading details */}
        <div className="w-64 mt-12">
          {!loadingComplete ? (
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                <span>Loading Assets...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-premium-gray rounded-full overflow-hidden border border-gold-500/10 p-[1px]">
                <div 
                  className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="animate-bounce">
              <Button 
                variant="gold" 
                size="lg" 
                glow 
                onClick={handleEnter}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Play size={16} fill="currentColor" />
                <span>ENTER ARENA</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Credits */}
      <div className="absolute bottom-6 z-10 text-[9px] font-bold tracking-widest text-slate-600 uppercase">
        VITE • REACT 19 • ZUSTAND • TAILWIND v4
      </div>
    </div>
  );
};
export default Splash;
