import { useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import '../styles/NotificationsPage.css';

const getNotificationsForRole = (role) => {
    const base = [
        { id: 1, title: 'Welcome to CREATECH!', message: 'Thank you for joining our platform.', read: false, time: 'Just now' },
    ];

    if (role === 'admin') {
        return [
            ...base,
            { id: 10, title: '🔴 System Alert', message: 'Failed API handshake detected with Stripe Gateway. Check system logs.', read: false, time: '10 min ago' },
            { id: 11, title: '⚠️ Anomalous Login', message: 'Multiple login attempts from IP 192.168.x.x detected.', read: false, time: '30 min ago' },
            { id: 12, title: '📊 Daily Report', message: 'Platform processed 42 transactions totaling ₱186,500 yesterday.', read: true, time: '1 day ago' },
            { id: 13, title: '🛡️ User Suspended', message: 'Sarah Chen auto-suspended after reaching 5 reports threshold.', read: true, time: '2 days ago' },
            { id: 14, title: '🔧 Maintenance Complete', message: 'Server maintenance completed successfully. All systems operational.', read: true, time: '3 days ago' },
        ];
    }

    if (role === 'creator') {
        return [
            ...base,
            { id: 20, title: '🎉 New Order!', message: 'GreenCo hired you for "Logo Design for EcoBrand". Check your orders.', read: false, time: '5 min ago' },
            { id: 21, title: '💰 Payment Received', message: 'You received ₱600 for "Social Media Graphics".', read: false, time: '1 hour ago' },
            { id: 22, title: '📝 Review Request', message: 'TechStart left feedback on your "Website Redesign" project.', read: true, time: '1 day ago' },
            { id: 23, title: '⭐ Profile Milestone', message: 'You\'ve completed 15 orders! Your profile is now "Verified Creator".', read: true, time: '3 days ago' },
        ];
    }

    // client
    return [
        ...base,
        { id: 30, title: '✅ Order Confirmed', message: 'Your order for "Custom Illustration" with Jane Smith is now pending.', read: false, time: '10 min ago' },
        { id: 31, title: '📦 Delivery Update', message: 'Alex Rivera submitted the first draft for your project.', read: false, time: '2 hours ago' },
        { id: 32, title: '💳 Payment Processed', message: '₱1,200 charged for "Full Brand Strategy" hire.', read: true, time: '1 day ago' },
    ];
};

const NotificationsPage = ({ userRole = 'creator' }) => {
    const [notifications, setNotifications] = useState(() => getNotificationsForRole(userRole));
    const { notification, showNotification } = useNotification();

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
                {notifications.length > 0 ? notifications.map(notif => (
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

export default NotificationsPage;
