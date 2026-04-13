import { useState, useEffect } from 'react';
import { fetchOrders, updateOrderStatus } from '../services/api';

const statusColors = {
    'Pending': { bg: 'rgba(250, 204, 21, 0.1)', color: '#facc15' },
    'In Progress': { bg: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' },
    'Completed': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
    'Suspended': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
    'Delivered': { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
    'Cancelled': { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' },
};

const formatStatus = (s) => {
    if (!s) return 'Pending';
    const map = { pending: 'Pending', accepted: 'In Progress', in_progress: 'In Progress', active: 'In Progress', delivered: 'Delivered', completed: 'Completed', cancelled: 'Cancelled', disputed: 'Disputed', suspended: 'Suspended' };
    return map[s.toLowerCase()] || s.charAt(0).toUpperCase() + s.slice(1);
};

const OrdersPage = ({ userRole = 'creator', firebaseUid }) => {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseUid) return;
        setLoading(true);
        const params = userRole === 'admin' ? {} :
            userRole === 'creator' ? { creator_id: firebaseUid } :
            { client_id: firebaseUid };
        fetchOrders(params)
            .then(data => {
                const list = data?.results || data || [];
                setOrders(list.map(o => ({
                    ...o,
                    title: o.service_title,
                    budget: parseFloat(o.price) || 0,
                    creator: o.creator_display_name || o.creator_name || o.creator_id,
                    clientName: o.client_display_name || o.client_name || o.client_id,
                    status: formatStatus(o.status),
                    deadline: o.due_date ? new Date(o.due_date).toLocaleDateString() : null,
                })));
            })
            .catch(err => console.error('Failed to fetch orders:', err))
            .finally(() => setLoading(false));
    }, [firebaseUid, userRole]);

    const filteredOrders = filter === 'All'
        ? orders
        : orders.filter(o => o.status === filter);

    return (
        <section className="section page-fade">
            <header className="section__header">
                <h2 className="section__title">My Orders ({orders.length})</h2>
                <div className="filter-group">
                    {['All', 'Pending', 'In Progress', 'Completed', 'Delivered', 'Suspended'].map(f => (
                        <button
                            key={f}
                            className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <div className="card-grid">
                {loading ? (
                    <div className="empty-state"><p>Loading orders...</p></div>
                ) : filteredOrders.length > 0 ? filteredOrders.map(order => {
                    const sc = statusColors[order.status] || statusColors['Pending'];
                    return (
                        <div key={order.id} className="card card--clickable">
                            <div className="card__header">
                                <h3 className="card__title">{order.title}</h3>
                                <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', background: sc.bg, color: sc.color }}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="card__body">
                                <p><strong>{userRole === 'creator' ? 'Client' : 'Creator'}:</strong> {userRole === 'creator' ? (order.clientName || 'Awaiting') : order.creator}</p>
                                <p><strong>Amount:</strong> ₱{(order.budget || 0).toLocaleString()}</p>
                                {order.deadline && <p><strong>Deadline:</strong> {order.deadline}</p>}
                                {order.created_at && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Created: {new Date(order.created_at).toLocaleDateString()}</p>}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="empty-state">
                        <p>No orders found for the selected filter.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default OrdersPage;
