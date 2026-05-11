import React from 'react';

export const GlassCard = ({ children, className = '' }) => {
  return (
    <div
      className={`
        rounded-xl border transition-all duration-300
        backdrop-blur-md bg-white/[0.05] border-white/[0.08]
        hover:bg-white/[0.08] hover:border-white/[0.12]
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
