import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import '../styles/ConfirmModal.css';

const ICONS = {
  info:    <Info size={24} />,
  danger:  <AlertTriangle size={24} />,
  success: <CheckCircle size={24} />,
  warning: <AlertCircle size={24} />,
};

/**
 * Reusable confirmation modal.
 *
 * Props:
 *  - open (bool)
 *  - title (string)
 *  - message (string | ReactNode)
 *  - variant ('info' | 'danger' | 'success' | 'warning')  default 'info'
 *  - confirmLabel (string)  default 'Confirm'
 *  - cancelLabel (string)   default 'Cancel'
 *  - loading (bool)
 *  - onConfirm (fn)
 *  - onCancel (fn)
 */
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

  const btnClass =
    variant === 'danger'  ? 'confirm-modal__btn--danger' :
    variant === 'success' ? 'confirm-modal__btn--success' :
                            'confirm-modal__btn--confirm';

  return createPortal(
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className={`confirm-modal__icon confirm-modal__icon--${variant}`}>
          {ICONS[variant] || ICONS.info}
        </div>
        <h3 className="confirm-modal__title">{title}</h3>
        <div className="confirm-modal__message">{message}</div>
        <div className="confirm-modal__actions">
          <button
            className="confirm-modal__btn confirm-modal__btn--cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className={`confirm-modal__btn ${btnClass}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;

