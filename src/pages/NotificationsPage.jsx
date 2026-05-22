import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    fetchDeadlines as apiFetchDeadlines,
    fetchFollows,
    fetchMyMessages,
    fetchOrderNotifications,
    getApiOrigin,
    getToken,
    getUnreadOrderNotificationCount,
    markAllOrderNotificationsRead,
    markOrderNotificationRead,
    patchUser,
} from '../api';
import { MessageSquare, CheckCheck, Bell, UserPlus, Package } from 'lucide-react';
import { readCollection } from '../utils/collections';
import { getCurrentUser, getCurrentUserUid } from '../utils/currentUser';
import './NotificationsPage.css';

const FILTERS = ['all', 'unread', 'messages', 'orders', 'social'];
const FALLBACK_SYNC_MS = 5000;
const HEARTBEAT_MS = 20000;

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
};

const mapOrderNotification = (notification) => ({
    id: `on-${notification.id}`,
    backendId: notification.id,
    source: 'backend-order',
    type: 'orders',
    title: notification.title,
    subtitle: notification.message,
    date: notification.created_at,
    read: Boolean(notification.is_read),
    link: notification.action_url || (notification.order_id ? `/orders/${notification.order_id}` : '/projects'),
    extra_data: notification.extra_data || {},
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

    return next.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [serverUnreadCount, setServerUnreadCount] = useState(0);
    const navigate = useNavigate();
    const userData = getCurrentUser();
    const uid = getCurrentUserUid();
    const isCreator = userData?.role === 'creator';
    const followsLastSeenAt = userData?.follows_last_seen_at;

    const socketRef = useRef(null);
    const heartbeatRef = useRef(null);
    const reconnectRef = useRef(null);
    const refreshRef = useRef(null);

    const STORAGE_KEY = `createch_read_notifs_${uid}`;
    const getReadIds = useCallback(() => {
        try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
        catch { return new Set(); }
    }, [STORAGE_KEY]);
    const saveReadIds = useCallback((ids) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    }, [STORAGE_KEY]);

    const loadNotifications = useCallback(async (showLoader = false) => {
        if (!uid) return;
        if (showLoader) setLoading(true);

        try {
            const readIds = getReadIds();
            const [orderRes, countRes, deadlineRes, messageRes, followRes] = await Promise.all([
                fetchOrderNotifications({ limit: 100 }),
                getUnreadOrderNotificationCount(),
                apiFetchDeadlines(),
                fetchMyMessages(),
                fetchFollows(),
            ]);

            const nextNotifications = [];
            const followsLastSeen = followsLastSeenAt ? new Date(followsLastSeenAt) : new Date(0);

            if (orderRes.ok) {
                readCollection(orderRes)
                    .map(mapOrderNotification)
                    .forEach((notification) => nextNotifications.push(notification));
            }

            if (countRes.ok) {
                setServerUnreadCount(Number(countRes.data?.unread_count || 0));
            }

            if (deadlineRes.ok) {
                readCollection(deadlineRes).forEach((notification) => {
                    if (String(notification.sent_to) !== String(uid)) return;
                    const id = `d-${notification.id}`;
                    nextNotifications.push({
                        id,
                        source: 'derived-deadline',
                        type: 'orders',
                        title: notification.notification_type === 'approaching' ? 'Deadline Approaching' : 'Deadline Passed',
                        subtitle: notification.message || 'Order deadline notification',
                        date: notification.sent_at || notification.created_at,
                        read: Boolean(notification.read_at) || readIds.has(id),
                        link: '/projects',
                    });
                });
            }

            if (messageRes.ok) {
                const latestBySender = {};
                readCollection(messageRes)
                    .filter((message) => String(message.sender_id) !== String(uid))
                    .sort((left, right) => new Date(right.timestamp || right.created_at || 0) - new Date(left.timestamp || left.created_at || 0))
                    .forEach((message) => {
                        const senderId = String(message.sender_id);
                        if (!latestBySender[senderId]) {
                            latestBySender[senderId] = message;
                        }
                    });

                Object.values(latestBySender).forEach((message) => {
                    const id = `m-${message.id}`;
                    nextNotifications.push({
                        id,
                        source: 'derived-message',
                        type: 'messages',
                        title: `New message from ${message.sender_name || 'User'}`,
                        subtitle: message.content?.slice(0, 80) || '(attachment)',
                        date: message.timestamp || message.created_at,
                        read: Boolean(message.is_read) || readIds.has(id),
                        link: '/messages',
                    });
                });
            }

            if (followRes.ok) {
                readCollection(followRes)
                    .filter((follow) => String(follow.following_id) === String(uid))
                    .forEach((follow) => {
                        const id = `f-${follow.id}`;
                        nextNotifications.push({
                            id,
                            source: 'derived-follow',
                            type: 'social',
                            title: 'New Follower',
                            subtitle: `${follow.follower_name || follow.follower_id || 'Someone'} started following you`,
                            date: follow.created_at,
                            read: new Date(follow.created_at) <= followsLastSeen || readIds.has(id),
                            link: `/creator-profile?uid=${follow.follower_id}`,
                        });
                    });
            }

            if (nextNotifications.length === 0) {
                nextNotifications.push({
                    id: 'welcome',
                    source: 'system',
                    type: 'social',
                    title: 'Welcome to CREATECH!',
                    subtitle: 'Start exploring the marketplace and connect with creators.',
                    date: new Date().toISOString(),
                    read: true,
                    link: '/',
                });
            }

            nextNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
            setNotifications(nextNotifications);
        } catch (error) {
            console.error('Notifications fetch error:', error);
            setNotifications([{
                id: 'welcome',
                source: 'system',
                type: 'social',
                title: 'Welcome to CREATECH!',
                subtitle: 'Start exploring.',
                date: new Date().toISOString(),
                read: true,
                link: '/',
            }]);
        } finally {
            setLoading(false);
        }
    }, [followsLastSeenAt, getReadIds, uid]);

    useEffect(() => {
        refreshRef.current = loadNotifications;
    }, [loadNotifications]);

    useEffect(() => {
        loadNotifications(true);

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
    }, [loadNotifications]);

    useEffect(() => {
        const token = getToken();
        if (!uid || !token) return undefined;

        let disposed = false;

        const stopHeartbeat = () => {
            if (heartbeatRef.current) {
                window.clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
        };

        const scheduleReconnect = () => {
            if (disposed || reconnectRef.current) return;
            reconnectRef.current = window.setTimeout(() => {
                reconnectRef.current = null;
                connect();
            }, 1500);
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
                        setNotifications((prev) => prev.map((notification) =>
                            notification.source === 'backend-order' ? { ...notification, read: true } : notification
                        ));
                        return;
                    }

                    if (payload.type === 'notification.cleared') {
                        setNotifications((prev) => prev.filter((notification) => notification.source !== 'backend-order'));
                    }
                } catch (error) {
                    console.error('Failed to handle notification update:', error);
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
    }, [uid]);

    const markAllRead = async () => {
        const readIds = getReadIds();
        notifications.forEach((notification) => {
            if (notification.source !== 'backend-order') {
                readIds.add(notification.id);
            }
        });
        saveReadIds(readIds);

        setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));

        try {
            await markAllOrderNotificationsRead();
        } catch {}

        patchUser(uid, {
            follows_last_seen_at: new Date().toISOString(),
        }).catch(() => {});
    };

    const markOneRead = async (notification) => {
        if (!notification || notification.read) return;

        setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item));

        if (notification.source === 'backend-order' && notification.backendId != null) {
            try {
                const result = await markOrderNotificationRead(notification.backendId);
                if (!result?.ok) {
                    refreshRef.current?.(false);
                }
            } catch {
                refreshRef.current?.(false);
            }
            return;
        }

        const readIds = getReadIds();
        readIds.add(notification.id);
        saveReadIds(readIds);
    };

    const handleClick = async (notification) => {
        await markOneRead(notification);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.read).length,
        [notifications],
    );

    const filtered = filter === 'all'
        ? notifications
        : filter === 'unread'
            ? notifications.filter((notification) => !notification.read)
            : notifications.filter((notification) => notification.type === filter);

    const getIcon = (type) => {
        switch (type) {
            case 'messages': return <MessageSquare size={18} />;
            case 'orders': return <Package size={18} />;
            case 'social': return <UserPlus size={18} />;
            default: return <Bell size={18} />;
        }
    };

    const getIconStyle = (type) => {
        switch (type) {
            case 'messages': return { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' };
            case 'orders': return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' };
            case 'social': return { bg: 'rgba(251,146,60,0.15)', color: '#fb923c' };
            default: return { bg: 'rgba(56,189,248,0.15)', color: '#38bdf8' };
        }
    };

    return (
        <main className="notif-page">
            <div className="notif-breadcrumb">
                <span className="notif-bc-muted">{isCreator ? 'Creator Workspace' : 'Client Workspace'}</span>
                <span className="notif-bc-sep">/</span>
                <span className="notif-bc-active">Notifications</span>
            </div>

            <div className="notif-header">
                <div className="notif-title-row">
                    <h1>Notifications</h1>
                    {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </div>
                <p className="notif-subtitle">
                    Stay updated with your orders, messages, and activity.
                    {serverUnreadCount > 0 ? ` ${serverUnreadCount} unread from live order alerts.` : ''}
                </p>
                {unreadCount > 0 && (
                    <button className="notif-mark-btn" onClick={markAllRead}>
                        <CheckCheck size={14} /> Mark all read
                    </button>
                )}
            </div>

            <div className="notif-filters">
                {FILTERS.map((item) => (
                    <button key={item} className={`notif-filter ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                        {item === 'unread' && unreadCount > 0 && <span className="notif-filter-count">{unreadCount}</span>}
                    </button>
                ))}
            </div>

            <div className="notif-list">
                {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="notif-item" style={{ pointerEvents: 'none' }}>
                            <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }}></div>
                            <div className="notif-content" style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div className="skeleton" style={{ width: `${120 + (index % 3) * 30}px`, height: 18 }}></div>
                                    <div className="skeleton" style={{ width: 60, height: 14 }}></div>
                                </div>
                                <div className="skeleton" style={{ width: `${70 + (index % 4) * 8}%`, height: 16 }}></div>
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="notif-empty-state">
                        <Bell size={48} color="#3f3f46" />
                        <p>No notifications{filter !== 'all' ? ` in "${filter}"` : ''}.</p>
                    </div>
                ) : (
                    filtered.map((notification) => {
                        const iconStyle = getIconStyle(notification.type);
                        return (
                            <div
                                key={notification.id}
                                className={`notif-item ${!notification.read ? 'unread' : ''}`}
                                onClick={() => handleClick(notification)}
                            >
                                <div className="notif-icon" style={{ background: iconStyle.bg, color: iconStyle.color }}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="notif-content">
                                    <h4>{notification.title}</h4>
                                    {notification.subtitle && <p>{notification.subtitle}</p>}
                                </div>
                                <div className="notif-meta">
                                    <span className="notif-time">{timeAgo(notification.date)}</span>
                                    {!notification.read && <span className="notif-dot"></span>}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
};

export default NotificationsPage;
