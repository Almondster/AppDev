import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    fetchDeadlines as apiFetchDeadlines, fetchMyMessages, fetchMyOrders, fetchMyCreatorOrders,
    fetchFollows, getUserData, patchUser, fetchOrderNotifications, markNotificationRead,
    markAllNotificationsRead,
} from '../api';
import { MessageSquare, ShoppingBag, Users, CheckCheck, Clock, Bell, UserPlus, Package, AlertCircle } from 'lucide-react';

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
    const ordersSeenKey = `createch_orders_last_seen_${uid}`;
    const followsSeenKey = `createch_follows_last_seen_${uid}`;

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
        const fetchNotifications = async () => {
            try {
                const readIds = getReadIds();
                const ordersFetcher = isCreator ? fetchMyCreatorOrders : fetchMyOrders;
                const [dRes, mRes, oRes, fRes, onRes] = await Promise.all([
                    apiFetchDeadlines(),
                    fetchMyMessages(),
                    ordersFetcher(),
                    fetchFollows(),
                    fetchOrderNotifications({ limit: 50 }), // Fetch order notifications from backend
                ]);

                const notifs = [];
                const ordersLastSeen = new Date(localStorage.getItem(ordersSeenKey) || userData?.orders_last_seen_at || 0);
                const followsLastSeen = new Date(localStorage.getItem(followsSeenKey) || userData?.follows_last_seen_at || 0);

                // Order notifications from backend (NEW - priority display)
                if (onRes.ok && onRes.data) {
                    (onRes.data || []).forEach(n => {
                        const nid = `on-${n.id}`;
                        notifs.push({
                            id: nid,
                            type: 'orders',
                            title: n.title,
                            subtitle: n.message,
                            date: n.created_at,
                            read: n.is_read || readIds.has(nid),
                            link: n.action_url || `/orders/${n.order_id}`,
                            backendId: n.id, // Store backend ID for marking as read
                        });
                    });
                }

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

                // Message notifications (incoming only - where current user is the RECEIVER)
                if (mRes.ok) {
                    const msgs = (mRes.data.results || mRes.data || [])
                        .filter(m => 
                            String(m.receiver_id) === String(uid) && // I am the receiver
                            !m.is_read // Message is unread
                            // Note: FastAPI backend doesn't have is_deleted field
                        )
                        .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp));

                    // Group by sender to avoid spam (show one notification per sender)
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
                            date: m.created_at || m.timestamp, // FastAPI uses 'timestamp' field
                            read: false, // These are all unread messages (already filtered above)
                            link: '/messages',
                        });
                    });
                }

                // Order notifications — status changes (LEGACY - keep for backward compatibility)
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
        };

        fetchNotifications();
        const timer = setInterval(fetchNotifications, 2500); // Poll every 2.5 seconds for near real-time updates
        return () => clearInterval(timer);
    }, [isCreator, uid, ordersSeenKey, followsSeenKey, userData?.orders_last_seen_at, userData?.follows_last_seen_at, getReadIds]);

    const markAllRead = async () => {
        const readIds = getReadIds();
        notifications.forEach(n => readIds.add(n.id));
        saveReadIds(readIds);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        const now = new Date().toISOString();
        localStorage.setItem(ordersSeenKey, now);
        localStorage.setItem(followsSeenKey, now);
        patchUser(uid, {
            orders_last_seen_at: now,
            follows_last_seen_at: now,
        }).catch(() => {});
        
        // Mark all backend order notifications as read
        markAllNotificationsRead().catch(() => {});
    };

    const markOneRead = async (notif) => {
        const readIds = getReadIds();
        readIds.add(notif.id);
        saveReadIds(readIds);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        
        // If this is a backend order notification, mark it as read on the backend
        if (notif.backendId) {
            markNotificationRead(notif.backendId).catch(() => {});
        }
    };

    const handleClick = (notif) => {
        markOneRead(notif);
        if (notif.type === 'orders') {
            const now = new Date().toISOString();
            localStorage.setItem(ordersSeenKey, now);
            patchUser(uid, { orders_last_seen_at: now }).catch(() => {});
        }
        if (notif.type === 'social') {
            const now = new Date().toISOString();
            localStorage.setItem(followsSeenKey, now);
            patchUser(uid, { follows_last_seen_at: now }).catch(() => {});
        }
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
        <main className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-500">{isCreator ? 'Creator Workspace' : 'Client Workspace'}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-white font-medium">Notifications</span>
            </div>

            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white">Notifications</h1>
                        {unreadCount > 0 && <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-medium">{unreadCount}</span>}
                    </div>
                    <p className="text-sm text-zinc-400">Stay updated with your orders, messages, and activity.</p>
                </div>
                {unreadCount > 0 && (
                    <button className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium flex items-center gap-2 transition-colors" onClick={markAllRead}>
                        <CheckCheck size={14} /> Mark all read
                    </button>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {FILTERS.map(f => (
                    <button key={f} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${filter === f ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`} onClick={() => setFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f === 'unread' && unreadCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-xs">{unreadCount}</span>}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4 pointer-events-none">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className={`h-4 rounded bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer`} style={{ width: `${120 + (i%3)*30}px` }}></div>
                                    <div className="h-3 w-16 rounded bg-white/5"></div>
                                </div>
                                <div className="h-4 rounded bg-white/5" style={{ width: `${70 + (i%4)*8}%` }}></div>
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Bell size={48} className="text-zinc-700 mb-4" />
                        <p className="text-zinc-500">No notifications{filter !== 'all' ? ` in "${filter}"` : ''}.</p>
                    </div>
                ) : (
                    filtered.map(n => {
                        const ic = getIconStyle(n.type);
                        return (
                            <div
                                key={n.id}
                                className={`p-4 rounded-xl border cursor-pointer transition-all hover:bg-white/[0.03] flex items-start gap-4 ${!n.read ? 'bg-white/[0.02] border-white/10' : 'bg-transparent border-white/5'}`}
                                onClick={() => handleClick(n)}
                            >
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: ic.bg, color: ic.color }}>{getIcon(n.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-white mb-1">{n.title}</h4>
                                    {n.subtitle && <p className="text-xs text-zinc-400 line-clamp-2">{n.subtitle}</p>}
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className="text-xs text-zinc-500">{timeAgo(n.date)}</span>
                                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
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
