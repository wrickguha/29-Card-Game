import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  glow?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  hoverable = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`
        glass-panel 
        rounded-2xl 
        p-6 
        transition-all 
        duration-300
        ${hoverable ? 'glass-panel-hover' : ''}
        ${glow ? 'animate-neon-pulse' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
export default GlassPanel;
