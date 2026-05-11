import { memo } from 'react';

export const Button = memo(({ children, variant = 'primary', onClick, icon, disabled = false, className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-white text-black hover:bg-zinc-100 active:scale-95',
    secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-95',
    outline: 'bg-transparent text-white border border-white/20 hover:bg-white/10 active:scale-95',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
    success: 'bg-green-600 text-white hover:bg-green-700 active:scale-95',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
