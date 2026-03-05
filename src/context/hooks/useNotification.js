import { useState, useCallback } from 'react';

/**
 * Hook for managing notification state
 * @param {number} duration - Duration in ms (default 3000)
 * @returns {Object} Notification state and handlers
 */
export const useNotification = (duration = 3000) => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    if (duration > 0) {
      setTimeout(() => setNotification(null), duration);
    }
  }, [duration]);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    clearNotification,
  };
};
