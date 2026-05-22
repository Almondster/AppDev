import { memo } from 'react';

const Button = memo(({ children, variant = 'primary', onClick, icon, disabled = false }) => {
  return (
    <button
      className={`btn btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
