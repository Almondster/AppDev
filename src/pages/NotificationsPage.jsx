import React, { useState, useEffect } from 'react';
import { fetchDeadlines as apiFetchDeadlines, fetchMyMessages, getUserData } from '../api';
import { MessageSquare, ShoppingBag, Users, CheckCheck, Clock } from 'lucide-react';
import './NotificationsPage.css';

const FILTERS = ['all', 'unread', 'messages', 'orders', 'social'];

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const userData = getUserData();

    useEffect(() => {
        (async () => {
            try {
                const [dRes, mRes] = await Promise.all([apiFetchDeadlines(), fetchMyMessages()]);
                const notifs = [];

                if (dRes.ok) {
                    (dRes.data.results || dRes.data || []).forEach(n => {
                        notifs.push({
                            id: `d-${n.id}`, type: 'orders',
                            title: n.message || `Deadline Notification`,
                            subtitle: `Order #${n.order_id || '—'}`,
                            date: n.sent_at || n.created_at,
                            read: n.is_read || false,
                        });
                    });
                }
                if (mRes.ok) {
                    (mRes.data.results || mRes.data || []).forEach(m => {
                        if (m.sender_id !== userData?.firebase_uid) {
                            notifs.push({
                                id: `m-${m.id}`, type: 'messages',
                                title: `New message from ${m.sender_name || m.sender_id}`,
                                subtitle: m.content?.slice(0, 60) || '',
                                date: m.created_at,
                                read: m.is_read || false,
                            });
                        }
                    });
                }

                if (notifs.length === 0) {
                    notifs.push({ id: 'welcome', type: 'social', title: 'Welcome to CREATECH!', subtitle: 'Start exploring the platform.', date: new Date().toISOString(), read: false });
                }

                notifs.sort((a, b) => new Date(b.date) - new Date(a.date));
                setNotifications(notifs);
            } catch {
                setNotifications([{ id: 'welcome', type: 'social', title: 'Welcome to CREATECH!', subtitle: 'Start exploring.', date: new Date().toISOString(), read: false }]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    const unreadCount = notifications.filter(n => !n.read).length;

    const filtered = filter === 'all' ? notifications
        : filter === 'unread' ? notifications.filter(n => !n.read)
        : notifications.filter(n => n.type === filter);

    const getIcon = (type) => {
        switch (type) {
            case 'messages': return <MessageSquare size={18} />;
            case 'orders': return <ShoppingBag size={18} />;
            case 'social': return <Users size={18} />;
            default: return <Clock size={18} />;
        }
    };

    const getIconBg = (type) => {
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
                <span className="notif-bc-muted">{userData?.role === 'client' ? 'Client Workspace' : 'Creator Workspace'}</span>
                <span className="notif-bc-sep">/</span>
                <span className="notif-bc-active">Notifications</span>
            </div>

            <div className="notif-header">
                <div className="notif-title-row">
                    <h1>Notifications</h1>
                    {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </div>
                <p className="notif-subtitle">Stay updated with your activity.</p>
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
                    </button>
                ))}
            </div>

            <div className="notif-list">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="notif-item" style={{ pointerEvents: 'none' }}>
                            <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }}></div>
                            <div className="notif-content" style={{ flex: 1 }}>
                                <div className="skeleton-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div className="skeleton" style={{ width: `${120 + (i%3)*30}px`, height: 18 }}></div>
                                    <div className="skeleton" style={{ width: 60, height: 14 }}></div>
                                </div>
                                <div className="skeleton" style={{ width: `${70 + (i%4)*8}%`, height: 16, marginBottom: 5 }}></div>
                                <div className="skeleton" style={{ width: `${45 + (i%3)*10}%`, height: 16 }}></div>
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <p className="notif-empty">No notifications.</p>
                ) : (
                    filtered.map(n => {
                        const ic = getIconBg(n.type);
                        return (
                            <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                                <div className="notif-icon" style={{ background: ic.bg, color: ic.color }}>{getIcon(n.type)}</div>
                                <div className="notif-content">
                                    <h4>{n.title}</h4>
                                    {n.subtitle && <p>{n.subtitle}</p>}
                                </div>
                                <span className="notif-date">{n.date ? new Date(n.date).toLocaleDateString() : ''}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
};

export default NotificationsPage;
