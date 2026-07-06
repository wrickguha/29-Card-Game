import React from 'react';

interface AvatarProps {
  id: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ id, className = 'w-10 h-10' }) => {
  // 4 premium stylized human character vector faces
  switch (id) {
    case 'royal_gold': // King / Gentleman character
      return (
        <svg viewBox="0 0 128 128" className={className}>
          <circle cx="64" cy="64" r="64" fill="#E2E8F0" />
          {/* Background gradient style */}
          <defs>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r="60" fill="url(#gold-grad)" />
          {/* Collar / Suit */}
          <path d="M30 110 C 30 90, 98 90, 98 110 Z" fill="#1E293B" />
          <path d="M50 110 L 64 95 L 78 110 Z" fill="#FFFFFF" />
          <path d="M62 100 L 64 105 L 66 100 Z" fill="#EF4444" /> {/* Bowtie */}
          {/* Face */}
          <circle cx="64" cy="66" r="32" fill="#FDBA74" />
          {/* Hair / Crown */}
          <path d="M32 66 C 32 30, 96 30, 96 66 C 88 56, 40 56, 32 66 Z" fill="#78350F" />
          {/* Crown */}
          <path d="M44 42 L 52 52 L 64 40 L 76 52 L 84 42 L 80 58 L 48 58 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
          <circle cx="64" cy="38" r="2.5" fill="#EF4444" />
          {/* Eyes */}
          <circle cx="54" cy="68" r="3.5" fill="#1E293B" />
          <circle cx="74" cy="68" r="3.5" fill="#1E293B" />
          {/* Beard / Mustache */}
          <path d="M48 76 C 54 82, 74 82, 80 76 C 82 86, 46 86, 48 76 Z" fill="#451A03" />
          <path d="M52 74 C 58 72, 70 72, 76 74 C 78 78, 50 78, 52 74 Z" fill="#451A03" />
          {/* Smile */}
          <path d="M60 80 Q 64 83 68 80" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'emerald_knight': // Knight / Warrior character
      return (
        <svg viewBox="0 0 128 128" className={className}>
          <defs>
            <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r="60" fill="url(#emerald-grad)" />
          {/* Armor shoulder guard */}
          <path d="M28 112 C 28 92, 100 92, 100 112 Z" fill="#475569" stroke="#334155" strokeWidth="2" />
          {/* Face */}
          <circle cx="64" cy="64" r="30" fill="#FFD2A1" />
          {/* Eyes */}
          <circle cx="54" cy="64" r="3.5" fill="#1E293B" />
          <circle cx="74" cy="64" r="3.5" fill="#1E293B" />
          {/* Knight Helmet */}
          <path d="M34 60 C 34 25, 94 25, 94 60 C 94 68, 88 74, 88 74 L 64 82 L 40 74 C 40 74, 34 68, 34 60 Z" fill="#64748B" opacity="0.9" />
          {/* Helmet Crest/Visor */}
          <path d="M64 22 L 68 34 L 60 34 Z" fill="#EF4444" />
          <path d="M44 54 H 84" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          <path d="M50 62 V 72" stroke="#475569" strokeWidth="3" />
          <path d="M64 62 V 75" stroke="#475569" strokeWidth="3" />
          <path d="M78 62 V 72" stroke="#475569" strokeWidth="3" />
        </svg>
      );

    case 'ruby_queen': // Elegant Queen female character
      return (
        <svg viewBox="0 0 128 128" className={className}>
          <defs>
            <linearGradient id="ruby-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r="60" fill="url(#ruby-grad)" />
          {/* Dress */}
          <path d="M32 112 C 32 94, 96 94, 96 112 Z" fill="#4C1D95" />
          {/* Necklace */}
          <path d="M52 98 Q 64 106 76 98" stroke="#FBBF24" strokeWidth="3" fill="none" />
          <circle cx="64" cy="103" r="3.5" fill="#EF4444" />
          {/* Face */}
          <circle cx="64" cy="66" r="28" fill="#FED7AA" />
          {/* Eyes & Lashes */}
          <path d="M50 64 Q 54 60 58 64" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M70 64 Q 74 60 78 64" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="54" cy="66" r="2" fill="#1E293B" />
          <circle cx="74" cy="66" r="2" fill="#1E293B" />
          {/* Rosy Cheeks */}
          <circle cx="46" cy="72" r="3" fill="#F87171" opacity="0.6" />
          <circle cx="82" cy="72" r="3" fill="#F87171" opacity="0.6" />
          {/* Hair */}
          <path d="M36 66 C 34 32, 94 32, 92 66 C 88 56, 76 52, 64 52 C 52 52, 40 56, 36 66 Z" fill="#1E1B4B" />
          {/* Hair Buns */}
          <circle cx="38" cy="48" r="12" fill="#1E1B4B" />
          <circle cx="90" cy="48" r="12" fill="#1E1B4B" />
          {/* Tiara */}
          <path d="M50 48 L 56 42 L 64 34 L 72 42 L 78 48 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
          <circle cx="64" cy="32" r="2" fill="#3B82F6" />
          {/* Lipstick Smile */}
          <path d="M58 80 Q 64 85 70 80" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'sapphire_king': // Wizard / Intelligent Scholar character
      return (
        <svg viewBox="0 0 128 128" className={className}>
          <defs>
            <linearGradient id="sapphire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r="60" fill="url(#sapphire-grad)" />
          {/* Robe */}
          <path d="M30 110 C 30 90, 98 90, 98 110 Z" fill="#0F172A" />
          {/* Face */}
          <circle cx="64" cy="66" r="30" fill="#FFD2A1" />
          {/* Glasses */}
          <circle cx="52" cy="64" r="10" stroke="#FBBF24" strokeWidth="2.5" fill="none" />
          <circle cx="76" cy="64" r="10" stroke="#FBBF24" strokeWidth="2.5" fill="none" />
          <line x1="62" y1="64" x2="66" y2="64" stroke="#FBBF24" strokeWidth="2.5" />
          {/* Eyes */}
          <circle cx="52" cy="64" r="2.5" fill="#1E293B" />
          <circle cx="76" cy="64" r="2.5" fill="#1E293B" />
          {/* Hat (Wizard Cap) */}
          <path d="M38 52 L 64 12 L 90 52 Z" fill="#1E293B" stroke="#3B82F6" strokeWidth="1.5" />
          <path d="M32 54 C 44 48, 84 48, 96 54 L 96 58 C 84 52, 44 52, 32 58 Z" fill="#FBBF24" />
          {/* Stars on Hat */}
          <path d="M60 28 L 62 32 L 66 32 L 63 34 L 64 38 L 60 35 L 56 38 L 57 34 L 54 32 L 58 32 Z" fill="#FBBF24" transform="scale(0.6) translate(38, 12)" />
          {/* Mustache */}
          <path d="M50 78 C 56 74, 72 74, 78 78 C 80 84, 48 84, 50 78 Z" fill="#E2E8F0" />
          <path d="M58 78 Q 64 83 70 78" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      );

    default: // Fallback user icon
      return (
        <svg viewBox="0 0 128 128" className={className}>
          <circle cx="64" cy="64" r="60" fill="#475569" />
          <circle cx="64" cy="50" r="20" fill="#94A3B8" />
          <path d="M28 100 C 28 80, 100 80, 100 100 Z" fill="#94A3B8" />
        </svg>
      );
  }
};
