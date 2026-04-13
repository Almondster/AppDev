import { useState, useEffect } from 'react';
import { useNotification } from '../hooks/useNotification';
import { fetchDeadlineNotifications, fetchOrderTimeline } from '../services/api';

const NotificationsPage = ({ userRole = 'creator', firebaseUid }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { notification, showNotification } = useNotification();

    useEffect(() => {
        if (!firebaseUid) return;
        setLoading(true);

        // Fetch deadline notifications and order timeline events for this user
        Promise.all([
            fetchDeadlineNotifications().catch(() => ({ results: [] })),
            fetchOrderTimeline().catch(() => ({ results: [] })),
        ]).then(([deadlineData, timelineData]) => {
            const deadlines = (deadlineData?.results || deadlineData || [])
                .filter(d => d.sent_to === firebaseUid)
                .map(d => ({
                    id: `dl-${d.id}`,
                    title: `⏰ ${d.notification_type}`,
                    message: `Deadline notification for Order #${d.order}`,
                    read: !!d.read_at,
                    time: d.sent_at ? timeAgo(d.sent_at) : '',
                    created_at: d.sent_at,
                }));

            const timeline = (timelineData?.results || timelineData || [])
                .filter(t => t.actor_id === firebaseUid || userRole === 'admin')
                .slice(0, 15)
                .map(t => ({
                    id: `tl-${t.id}`,
                    title: formatEventType(t.event_type),
                    message: t.message || `Event on Order #${t.order}`,
                    read: true,
                    time: t.created_at ? timeAgo(t.created_at) : '',
                    created_at: t.created_at,
                }));

            // Combine and sort by date
            const combined = [...deadlines, ...timeline].sort((a, b) =>
                new Date(b.created_at || 0) - new Date(a.created_at || 0)
            );

            // If no API notifications, show role-based welcome
            if (combined.length === 0) {
                combined.push(
                    { id: 'welcome', title: 'Welcome to CREATECH!', message: 'Thank you for joining our platform. Notifications about your orders and activity will appear here.', read: false, time: 'Just now' }
                );
            }

            setNotifications(combined);
        }).finally(() => setLoading(false));
    }, [firebaseUid, userRole]);

    const markAllRead = () => {
        setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
        showNotification('All notifications marked as read.');
    };

    const toggleRead = (id) => {
        setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
    };

    const deleteNotif = (id) => {
        setNotifications((prev) => prev.filter(n => n.id !== id));
        showNotification('Notification deleted.', 'info');
    };

    const clearAll = () => {
        setNotifications([]);
        showNotification('All notifications cleared.', 'info');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <section className="section page-fade">
            {notification && (
                <div className={`notification notification--${notification.type}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
                    {notification.message}
                </div>
            )}

            <header className="section__header">
                <h2 className="section__title">
                    Notifications
                    {unreadCount > 0 && <span style={{ marginLeft: '0.5rem', padding: '2px 8px', background: '#3b82f6', color: '#fff', borderRadius: '12px', fontSize: '0.8rem' }}>{unreadCount}</span>}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn--ghost" onClick={markAllRead}>Mark All Read</button>
                    <button className="btn btn--ghost" onClick={clearAll} style={{ color: '#f87171' }}>Clear All</button>
                </div>
            </header>

            <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
                {loading ? (
                    <div className="empty-state"><p>Loading notifications...</p></div>
                ) : notifications.length > 0 ? notifications.map(notif => (
                    <div key={notif.id} className={`card ${!notif.read ? 'card--unread' : ''}`} style={{ borderColor: !notif.read ? '#3b82f6' : '', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <div className="card__header">
                                <h3 className="card__title">{notif.title}</h3>
                                {!notif.read && <span className="badge badge--in-progress">New</span>}
                            </div>
                            <div className="card__body">
                                <p>{notif.message}</p>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>{notif.time}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, paddingTop: '0.5rem' }}>
                            <button onClick={() => toggleRead(notif.id)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                {notif.read ? 'Unread' : 'Read'}
                            </button>
                            <button onClick={() => deleteNotif(notif.id)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                ✕
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                        <span className="empty-state__icon">🔔</span>
                        <p>No notifications.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function formatEventType(type) {
    if (!type) return '📋 Activity';
    const map = {
        'order_created': '🎉 New Order',
        'order_accepted': '✅ Order Accepted',
        'status_change': '🔄 Status Update',
        'delivery': '📦 Delivery',
        'payment': '💰 Payment',
        'review': '⭐ Review',
    };
    return map[type] || `📋 ${type.replace(/_/g, ' ')}`;
}

export default NotificationsPage;
