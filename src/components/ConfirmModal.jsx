import React from 'react';
import { AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';

const ICONS = {
  info:    <Info size={24} />,
  danger:  <AlertTriangle size={24} />,
  success: <CheckCircle size={24} />,
  warning: <AlertCircle size={24} />,
};

const ConfirmModal = ({
  open,
  title = 'Are you sure?',
  message = '',
  variant = 'info',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const iconColors = {
    info: 'text-blue-400 bg-blue-500/10',
    danger: 'text-red-400 bg-red-500/10',
    success: 'text-green-400 bg-green-500/10',
    warning: 'text-yellow-400 bg-yellow-500/10',
  };

  const buttonColors = {
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className={`w-12 h-12 rounded-full ${iconColors[variant]} flex items-center justify-center mx-auto mb-4`}>
          {ICONS[variant] || ICONS.info}
        </div>
        <h3 className="text-xl font-semibold text-white text-center mb-2">{title}</h3>
        <div className="text-zinc-400 text-center mb-6 text-sm">{message}</div>
        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg font-medium transition-colors border border-white/10"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${buttonColors[variant]}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
