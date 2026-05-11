import React, { useMemo } from 'react';

const colors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
];

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

export const Avatar = ({ src, alt = 'User', size = 40, className = '', onClick }) => {
  const bg = useMemo(() => colors[Math.abs(String(alt).length) % colors.length], [alt]);
  const style = { width: size, height: size };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`rounded-full object-cover ${className}`}
        style={style}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold ${className}`}
      style={{ ...style, backgroundColor: bg, fontSize: Math.max(12, Math.floor(size * 0.38)) }}
      onClick={onClick}
    >
      {getInitials(alt)}
    </div>
  );
};

export default Avatar;
