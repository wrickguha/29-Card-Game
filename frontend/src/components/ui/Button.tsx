import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'gold' | 'glass' | 'danger' | 'success' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'glass',
  size = 'md',
  glow = false,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs font-semibold rounded-lg',
    md: 'px-6 py-3 text-sm font-bold rounded-xl tracking-wide',
    lg: 'px-8 py-4 text-base font-extrabold rounded-2xl tracking-widest uppercase',
  };

  const variantClasses = {
    gold: 'gold-button',
    glass: 'bg-premium-black/40 backdrop-blur-md border border-gold-500/25 hover:border-gold-500/60 text-gold-400 hover:text-gold-200 hover:bg-premium-gray/60 transition-all duration-300 shadow-md',
    danger: 'bg-red-950/40 backdrop-blur-md border border-red-800/30 hover:border-red-600 text-red-400 hover:text-red-200 hover:bg-red-900/40 transition-all duration-300 shadow-md',
    success: 'bg-emerald-950/40 backdrop-blur-md border border-emerald-800/30 hover:border-emerald-500 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-900/40 transition-all duration-300 shadow-md',
    blue: 'bg-blue-950/40 backdrop-blur-md border border-blue-800/30 hover:border-blue-500 text-blue-400 hover:text-blue-200 hover:bg-blue-900/40 transition-all duration-300 shadow-md',
  };

  const glowClass = glow ? 'animate-neon-pulse' : '';
  const opacityClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`
        inline-flex items-center justify-center font-display cursor-pointer select-none active:scale-[0.98]
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        ${glowClass}
        ${opacityClass}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};
export default Button;
