import React, { useState } from 'react';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Welcome to CREATECH!', message: 'Thank you for joining our platform.', read: false },
        { id: 2, title: 'Profile Updated', message: 'Your profile details were updated successfully.', read: true },
    ]);

    const markAllRead = () => {
        setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <section className="section page-fade">
            <header className="section__header">
                <h2 className="section__title">Notifications</h2>
                <button className="btn btn--ghost" onClick={markAllRead}>Mark All as Read</button>
            </header>

            <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
                {notifications.map(notif => (
                    <div key={notif.id} className={`card ${!notif.read ? 'card--unread' : ''}`} style={{ borderColor: !notif.read ? '#3b82f6' : '' }}>
                        <div className="card__header">
                            <h3 className="card__title">{notif.title}</h3>
                            {!notif.read && <span className="badge badge--in-progress">New</span>}
                        </div>
                        <div className="card__body">
                            <p>{notif.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default NotificationsPage;
