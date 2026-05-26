import React, { useEffect, useState } from 'react';

export const Avatar = ({ src, alt = 'U', size = 40, className = '' }) => {
  const [imageFailed, setImageFailed] = useState(false);

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
  const shouldShowImage = Boolean(src) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        background: shouldShowImage ? 'transparent' : bgGradient,
        fontSize: `${size * 0.4}px`,
        color: '#fff',
        fontWeight: 600,
        borderRadius: '999px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        transition: 'transform 0.18s ease',
      }}
      title={alt}
    >
      {shouldShowImage ? (
        <img
          src={src}
          alt={alt}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        <span
          style={{
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {initial}
        </span>
      )}
    </div>
  );
};

export default Avatar;
