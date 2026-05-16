import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    fetchDeadlines as apiFetchDeadlines, fetchMyMessages, fetchMyOrders, fetchMyCreatorOrders,
    fetchFollows, getUserData, patchUser,
} from '../api';
import { MessageSquare, ShoppingBag, Users, CheckCheck, Clock, Bell, UserPlus, Package, AlertCircle } from 'lucide-react';
import './NotificationsPage.css';

const FILTERS = ['all', 'unread', 'messages', 'orders', 'social'];

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

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();
    const userData = getUserData();
    const uid = userData?.firebase_uid;
    const isCreator = userData?.role === 'creator';
    const ordersLastSeenAt = userData?.orders_last_seen_at;
    const followsLastSeenAt = userData?.follows_last_seen_at;

    // Persist read IDs in localStorage
    const STORAGE_KEY = `createch_read_notifs_${uid}`;
    const getReadIds = useCallback(() => {
        try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
        catch { return new Set(); }
    }, [STORAGE_KEY]);
    const saveReadIds = useCallback((ids) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    }, [STORAGE_KEY]);

    useEffect(() => {
        (async () => {
            try {
                const readIds = getReadIds();
                const ordersFetcher = isCreator ? fetchMyCreatorOrders : fetchMyOrders;
                const [dRes, mRes, oRes, fRes] = await Promise.all([
                    apiFetchDeadlines(),
                    fetchMyMessages(),
                    ordersFetcher(),
                    fetchFollows(),
                ]);

                const notifs = [];
                const ordersLastSeen = ordersLastSeenAt ? new Date(ordersLastSeenAt) : new Date(0);
                const followsLastSeen = followsLastSeenAt ? new Date(followsLastSeenAt) : new Date(0);

                // Deadline notifications
                if (dRes.ok) {
                    (dRes.data.results || dRes.data || []).forEach(n => {
                        if (n.sent_to !== uid) return;
                        const nid = `d-${n.id}`;
                        notifs.push({
                            id: nid, type: 'orders',
                            title: n.notification_type === 'approaching' ? 'Deadline Approaching' : 'Deadline Passed',
                            subtitle: n.message || `Order deadline notification`,
                            date: n.sent_at || n.created_at,
                            read: !!n.read_at || readIds.has(nid),
                            link: '/projects',
                        });
                    });
                }

                // Message notifications (incoming only)
                if (mRes.ok) {
                    const msgs = (mRes.data.results || mRes.data || [])
                        .filter(m => m.sender_id !== uid)
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                    const bySender = {};
                    msgs.forEach(m => {
                        if (!bySender[m.sender_id]) bySender[m.sender_id] = m;
                    });
                    Object.values(bySender).forEach(m => {
                        const nid = `m-${m.id}`;
                        notifs.push({
                            id: nid, type: 'messages',
                            title: `New message from ${m.sender_name || 'User'}`,
                            subtitle: m.content?.slice(0, 80) || '(attachment)',
                            date: m.created_at,
                            read: m.is_read || readIds.has(nid),
                            link: '/messages',
                        });
                    });
                }

                // Order notifications — status changes
                if (oRes.ok) {
                    const orders = (oRes.data.results || oRes.data || []);
                    // Role-specific labels
                    const creatorLabels = {
                        pending: 'New order from a client',
                        accepted: 'You accepted an order',
                        in_progress: 'Work in progress',
                        delivered: 'You delivered an order',
                        completed: 'Order completed — payment received',
                        cancelled: 'Order was cancelled',
                        revision: 'Client requested a revision',
                    };
                    const clientLabels = {
                        pending: 'Order placed — awaiting acceptance',
                        accepted: 'Creator accepted your order',
                        in_progress: 'Creator started working',
                        delivered: 'Your order has been delivered',
                        completed: 'Order completed',
                        cancelled: 'Order was cancelled',
                        revision: 'Revision requested',
                    };
                    const labels = isCreator ? creatorLabels : clientLabels;
                    orders.forEach(o => {
                        const updatedDate = o.updated_at || o.created_at;
                        const label = labels[o.status] || `Order ${o.status}`;

                        const nid = `o-${o.id}`;
                        notifs.push({
                            id: nid, type: 'orders',
                            title: label,
                            subtitle: `"${o.service_title || 'Service'}" — ₱${parseFloat(o.price || 0).toLocaleString()}`,
                            date: updatedDate,
                            read: new Date(updatedDate) <= ordersLastSeen || readIds.has(nid),
                            link: `/orders/${o.id}`,
                        });
                    });
                }

                // Follow notifications
                if (fRes.ok) {
                    const allFollows = fRes.data.results || fRes.data || [];
                    allFollows
                        .filter(f => f.following_id === uid)
                        .forEach(f => {
                            const nid = `f-${f.id}`;
                            notifs.push({
                                id: nid, type: 'social',
                                title: 'New Follower',
                                subtitle: `${f.follower_name || f.follower_id || 'Someone'} started following you`,
                                date: f.created_at,
                                read: new Date(f.created_at) <= followsLastSeen || readIds.has(nid),
                                link: `/creator-profile?uid=${f.follower_id}`,
                            });
                        });
                }

                if (notifs.length === 0) {
                    notifs.push({
                        id: 'welcome', type: 'social',
                        title: 'Welcome to CREATECH!',
                        subtitle: 'Start exploring the marketplace and connect with creators.',
                        date: new Date().toISOString(),
                        read: true,
                        link: '/',
                    });
                }

                notifs.sort((a, b) => new Date(b.date) - new Date(a.date));
                setNotifications(notifs);
            } catch (err) {
                console.error('Notifications fetch error:', err);
                setNotifications([{
                    id: 'welcome', type: 'social',
                    title: 'Welcome to CREATECH!',
                    subtitle: 'Start exploring.',
                    date: new Date().toISOString(), read: true, link: '/',
                }]);
            } finally {
                setLoading(false);
            }
        })();
    }, [followsLastSeenAt, getReadIds, isCreator, ordersLastSeenAt, uid]);

    const markAllRead = () => {
        const readIds = getReadIds();
        notifications.forEach(n => readIds.add(n.id));
        saveReadIds(readIds);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        patchUser(uid, {
            orders_last_seen_at: new Date().toISOString(),
            follows_last_seen_at: new Date().toISOString(),
        }).catch(() => {});
    };

    const markOneRead = (id) => {
        const readIds = getReadIds();
        readIds.add(id);
        saveReadIds(readIds);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleClick = (notif) => {
        markOneRead(notif.id);
        if (notif.link) {
            navigate(notif.link);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const filtered = filter === 'all' ? notifications
        : filter === 'unread' ? notifications.filter(n => !n.read)
        : notifications.filter(n => n.type === filter);

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
                <p className="notif-subtitle">Stay updated with your orders, messages, and activity.</p>
                {unreadCount > 0 && (
                    <button className="notif-mark-btn" onClick={markAllRead}>
                        <CheckCheck size={14} /> Mark all read
                    </button>
                )}
            </div>

            <div className="notif-filters">
                {FILTERS.map(f => (
                    <button key={f} className={`notif-filter ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f === 'unread' && unreadCount > 0 && <span className="notif-filter-count">{unreadCount}</span>}
                    </button>
                ))}
            </div>

            <div className="notif-list">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="notif-item" style={{ pointerEvents: 'none' }}>
                            <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }}></div>
                            <div className="notif-content" style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div className="skeleton" style={{ width: `${120 + (i%3)*30}px`, height: 18 }}></div>
                                    <div className="skeleton" style={{ width: 60, height: 14 }}></div>
                                </div>
                                <div className="skeleton" style={{ width: `${70 + (i%4)*8}%`, height: 16 }}></div>
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="notif-empty-state">
                        <Bell size={48} color="#3f3f46" />
                        <p>No notifications{filter !== 'all' ? ` in "${filter}"` : ''}.</p>
                    </div>
                ) : (
                    filtered.map(n => {
                        const ic = getIconStyle(n.type);
                        return (
                            <div
                                key={n.id}
                                className={`notif-item ${!n.read ? 'unread' : ''}`}
                                onClick={() => handleClick(n)}
                            >
                                <div className="notif-icon" style={{ background: ic.bg, color: ic.color }}>{getIcon(n.type)}</div>
                                <div className="notif-content">
                                    <h4>{n.title}</h4>
                                    {n.subtitle && <p>{n.subtitle}</p>}
                                </div>
                                <div className="notif-meta">
                                    <span className="notif-time">{timeAgo(n.date)}</span>
                                    {!n.read && <span className="notif-dot"></span>}
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
