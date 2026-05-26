import { useContext } from 'react';
import { NotificationCenterContext } from './NotificationCenterContextObject';

export const useNotificationCenter = () => {
  const context = useContext(NotificationCenterContext);
  if (!context) {
    throw new Error('useNotificationCenter must be used within a NotificationCenterProvider');
  }
  return context;
};
