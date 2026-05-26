import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchOrderNotifications,
  getApiOrigin,
  getToken,
  getUnreadOrderNotificationCount,
  markAllOrderNotificationsRead,
  markOrderNotificationRead,
  getUnreadMessagesCount,
} from '../api';
import { readCollection } from '../utils/collections';
import { NotificationCenterContext } from './NotificationCenterContextObject';

const FALLBACK_SYNC_MS = 5000;
const HEARTBEAT_MS = 20000;
const RECONNECT_DELAY_MS = 1500;

const getNotificationCategory = (notificationType) => {
  const type = String(notificationType || '').toLowerCase();
  if (type.startsWith('message_')) return 'messages';
  if (type.startsWith('follow_') || type.startsWith('creator_application_') || type.startsWith('review_')) {
    return 'social';
  }
  return 'orders';
};

const mapOrderNotification = (notification) => ({
  id: `on-${notification.id}`,
  backendId: notification.id,
  source: 'backend',
  type: getNotificationCategory(notification.notification_type),
  notificationType: notification.notification_type,
  title: notification.title,
  subtitle: notification.message,
  date: notification.created_at,
  read: Boolean(notification.is_read),
  link: notification.action_url || (notification.order_id ? `/orders/${notification.order_id}` : '/'),
  extraData: notification.extra_data || {},
});

const upsertNotifications = (existing, incoming) => {
  const list = Array.isArray(incoming) ? incoming : [incoming];
  const next = [...existing];

  list.forEach((item) => {
    if (!item) return;
    const index = next.findIndex((candidate) => candidate.id === item.id);
    if (index >= 0) {
      next[index] = { ...next[index], ...item };
    } else {
      next.push(item);
    }
  });

  return next.sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0));
};

export const NotificationCenterProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverUnreadCount, setServerUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);
  const reconnectRef = useRef(null);
  const refreshRef = useRef(null);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const refreshNotifications = useCallback(async (showLoader = false) => {
    const token = getToken();
    if (!token) {
      setNotifications([]);
      setServerUnreadCount(0);
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);

    try {
      const [notificationsRes, countRes, msgsCountRes] = await Promise.all([
        fetchOrderNotifications({ limit: 100 }),
        getUnreadOrderNotificationCount(),
        getUnreadMessagesCount(),
      ]);

      if (notificationsRes.ok) {
        const next = readCollection(notificationsRes).map(mapOrderNotification);
        setNotifications(next);
      }

      if (countRes.ok) {
        setServerUnreadCount(Number(countRes.data?.unread_count || 0));
      }
      
      if (msgsCountRes && msgsCountRes.ok) {
        setUnreadMessagesCount(Number(msgsCountRes.data?.unread_count || 0));
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRef.current = refreshNotifications;
  }, [refreshNotifications]);

  useEffect(() => {
    refreshNotifications(true);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshRef.current?.(false);
      }
    }, FALLBACK_SYNC_MS);

    const handleFocus = () => refreshRef.current?.(false);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshRef.current?.(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;

    let disposed = false;

    const scheduleReconnect = () => {
      if (disposed || reconnectRef.current) return;
      reconnectRef.current = window.setTimeout(() => {
        reconnectRef.current = null;
        connect();
      }, RECONNECT_DELAY_MS);
    };

    const connect = () => {
      if (disposed) return;
      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const socket = new WebSocket(`${getApiOrigin().replace(/^http/, 'ws')}/api/order-notifications/ws?token=${encodeURIComponent(token)}`);
      socketRef.current = socket;

      socket.onopen = () => {
        refreshRef.current?.(false);
        stopHeartbeat();
        heartbeatRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, HEARTBEAT_MS);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload?.type || payload.type.startsWith('connection.')) return;

          if (typeof payload.unread_count === 'number') {
            setServerUnreadCount(payload.unread_count);
          }

          if ((payload.type === 'notification.created' || payload.type === 'notification.updated') && payload.notification) {
            setNotifications((prev) => upsertNotifications(prev, mapOrderNotification(payload.notification)));
            return;
          }

          if (payload.type === 'notification.deleted' && payload.notification_id != null) {
            setNotifications((prev) => prev.filter((notification) => notification.id !== `on-${payload.notification_id}`));
            return;
          }

          if (payload.type === 'notification.read_all') {
            setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
            return;
          }

          if (payload.type === 'notification.cleared') {
            setNotifications([]);
          }
        } catch (error) {
          console.error('Failed to handle realtime notification:', error);
        }
      };

      socket.onerror = () => {
        scheduleReconnect();
      };

      socket.onclose = () => {
        stopHeartbeat();
        if (socketRef.current === socket) {
          socketRef.current = null;
        }
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      disposed = true;
      stopHeartbeat();
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    };
  }, [stopHeartbeat]);

  const markNotificationRead = useCallback(async (notification) => {
    if (!notification?.backendId || notification.read) return;

    setNotifications((prev) => prev.map((item) => (
      item.id === notification.id ? { ...item, read: true } : item
    )));
    setServerUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const result = await markOrderNotificationRead(notification.backendId);
      if (!result?.ok) {
        refreshRef.current?.(false);
      }
    } catch {
      refreshRef.current?.(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    setServerUnreadCount(0);

    try {
      const result = await markAllOrderNotificationsRead();
      if (!result?.ok) {
        refreshRef.current?.(false);
      }
    } catch {
      refreshRef.current?.(false);
    }
  }, []);

  const unreadCount = useMemo(() => {
    const localUnread = notifications.filter((notification) => !notification.read).length;
    return Math.max(localUnread, serverUnreadCount);
  }, [notifications, serverUnreadCount]);

  const value = useMemo(() => ({
    notifications,
    loading,
    unreadCount,
    unreadMessagesCount,
    refreshNotifications,
    markNotificationRead,
    markAllRead,
  }), [loading, markAllRead, markNotificationRead, notifications, refreshNotifications, unreadCount, unreadMessagesCount]);

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
    </NotificationCenterContext.Provider>
  );
};
