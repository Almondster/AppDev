import React from 'react';

export const Avatar = ({ src, alt = 'U', size = 40, className = '' }) => {
  const getInitial = (text) => {
    if (!text) return 'U';
    const str = String(text).trim();
    return str.charAt(0).toUpperCase();
  };

  const getColor = (text) => {
    const colors = [
      'linear-gradient(135deg, #6366f1, #818cf8)',
      'linear-gradient(135deg, #f97316, #fbbf24)',
      'linear-gradient(135deg, #10b981, #34d399)',
      'linear-gradient(135deg, #ef4444, #fca5a5)',
      'linear-gradient(135deg, #a855f7, #d8b4fe)',
      'linear-gradient(135deg, #3b82f6, #60a5fa)',
    ];
    let hash = 0;
    const str = String(text || '');
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const initial = getInitial(alt);
  const bgGradient = getColor(alt);

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white overflow-hidden ring-2 ring-white/10 transition-transform hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        background: src ? 'transparent' : bgGradient,
        fontSize: `${size * 0.4}px`,
      }}
      title={alt}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span className="font-bold tracking-tight">{initial}</span>
      )}
    </div>
  );
};

export default Avatar;
