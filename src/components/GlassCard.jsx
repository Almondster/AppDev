import React from 'react';

export const GlassCard = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-xl border border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl ${className}`}
  >
    {children}
  </div>
);

export default GlassCard;
