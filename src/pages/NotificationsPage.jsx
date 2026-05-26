import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare,
    CheckCheck,
    Bell,
    UserPlus,
    Package,
} from 'lucide-react';
import { useNotificationCenter } from '../context/useNotificationCenter';
import { getCurrentUser } from '../utils/currentUser';
import '../styles/NotificationsPage.css';

const FILTERS = ['all', 'unread', 'messages', 'orders', 'social'];

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const rawValue = typeof dateStr === 'string' ? dateStr.trim() : dateStr;
    const normalizedValue = typeof rawValue === 'string' && rawValue && !/[zZ]|[+-]\d{2}:\d{2}$/.test(rawValue)
        ? `${rawValue}Z`
        : rawValue;
    const timestamp = new Date(normalizedValue).getTime();
    if (Number.isNaN(timestamp)) return '';

    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
};

const NotificationsPage = () => {
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();
    const { notifications, loading, unreadCount, markAllRead, markNotificationRead } = useNotificationCenter();
    const userData = getCurrentUser();
    const isCreator = userData?.role === 'creator';
    const handleClick = async (notification) => {
        await markNotificationRead(notification);
        if (notification.link) {
            navigate(notification.link);
        }
    };

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
                    Stay updated with your orders, messages, and activity in real time.
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
