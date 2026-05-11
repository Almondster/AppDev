import React, { useEffect } from 'react';
import { Check, AlertCircle, X, Info } from 'lucide-react';

export const Toast = ({ message, isVisible, type = 'success', onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/15 border-green-500/40 text-green-100';
      case 'error':
        return 'bg-red-500/15 border-red-500/40 text-red-100';
      case 'warning':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-100';
      default:
        return 'bg-blue-500/15 border-blue-500/40 text-blue-100';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check size={18} className="flex-shrink-0" />;
      case 'error':
        return <AlertCircle size={18} className="flex-shrink-0" />;
      case 'warning':
        return <AlertCircle size={18} className="flex-shrink-0" />;
      default:
        return <Info size={18} className="flex-shrink-0" />;
    }
  };

  return (
    <div
      className={`
        fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg border
        backdrop-blur-lg shadow-2xl z-50
        transform transition-all duration-300 ease-out
        animate-in slide-in-from-bottom-4
        ${getStyles()}
      `}
    >
      {getIcon()}
      <span className="text-sm font-medium max-w-xs">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
