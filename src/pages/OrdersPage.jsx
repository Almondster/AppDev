import React, { useState, useEffect } from 'react';
import { fetchMyOrders as apiFetchOrders, fetchMyCreatorOrders, createOrder, deleteOrder, updateOrder, getUserData, updateOrderStatus } from '../api';

const OrdersPage = () => {
    const [filter, setFilter] = useState('All');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const userData = getUserData();
            const role = userData?.role || 'client';
            // Fetch orders based on user role
            const { ok, data } = role === 'creator'
                ? await fetchMyCreatorOrders()
                : await apiFetchOrders();
            if (ok) {
                const list = data.results || data || [];
                setOrders(list.map(o => ({
                    id: o.id,
                    service: o.service_title || `Order #${o.id}`,
                    status: capitalize(o.status),
                    amount: `₱${parseFloat(o.price || 0).toLocaleString()}`,
                    creator: o.creator_display_name || o.creator_name || o.creator_id,
                    client: o.client_display_name || o.client_name || o.client_id,
                    date: o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
                })));
            } else {
                setError('Failed to load orders.');
            }
        } catch {
            setError('Cannot connect to server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOrders(); }, []);

    const filteredOrders = filter === 'All'
        ? orders
        : orders.filter(o => o.status === filter);

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this order?')) return;
        const { ok } = await deleteOrder(id);
        if (ok) {
            setSuccess('Order deleted.');
            loadOrders();
        } else {
            setError('Failed to delete order.');
        }
        setTimeout(() => { setSuccess(''); setError(''); }, 3000);
    };

    // Order status update handler
    const [statusUpdating, setStatusUpdating] = useState(null);
    const [statusError, setStatusError] = useState('');

    const handleStatusUpdate = async (id, newStatus) => {
        setStatusUpdating(id);
        setStatusError('');
        const { ok, data } = await updateOrderStatus(id, newStatus);
        if (ok) {
            setSuccess('Order status updated.');
            loadOrders();
        } else {
            setStatusError(data?.detail || 'Failed to update status.');
        }
        setStatusUpdating(null);
        setTimeout(() => { setSuccess(''); setStatusError(''); }, 3000);
    };

    return (
        <section className="section page-fade">
            <header className="section__header">
                <h2 className="section__title">My Orders ({orders.length})</h2>
                <div className="filter-group">
                    {['All', 'Pending', 'In_progress', 'Completed', 'Cancelled'].map(f => (
                        <button
                            key={f}
                            className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <label htmlFor="orderSort" className="sr-only">Sort orders</label>
                <select id="orderSort" className="form-input sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="recent">Sort: Recent</option>
                    <option value="amount">Sort: Amount</option>
                    <option value="client">Sort: Client</option>
                </select>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
            {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}
            {statusError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.5rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{statusError}</div>}

            {loading ? (
                <div className="empty-state"><p>Loading orders...</p></div>
            ) : (
                <div className="card-grid">
                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                        <div key={order.id} className="card card--clickable">
                            <div className="card__header">
                                <h3 className="card__title">{order.service}</h3>
                                <span className={`badge badge--${order.status.toLowerCase().replace(' ', '-')}`}>{order.status}</span>
                            </div>
                            <div className="card__body">
                                <p><strong>Order ID:</strong> {order.id}</p>
                                <p><strong>Amount:</strong> {order.amount}</p>
                                {order.creator && <p><strong>Creator:</strong> {order.creator}</p>}
                                {order.date && <p><strong>Date:</strong> {order.date}</p>}
                            </div>
                            <div className="card__actions" style={{ marginTop: '0.75rem' }}>
                                <button className="card-action-btn card-action-btn--delete" onClick={() => handleDelete(order.id)}>Remove</button>
                                {/* Order status update dropdown */}
                                <select
                                    value={order.status}
                                    onChange={e => handleStatusUpdate(order.id, e.target.value)}
                                    disabled={statusUpdating === order.id}
                                    style={{ marginLeft: 8 }}
                                >
                                    {['Pending', 'In_progress', 'Completed', 'Cancelled'].map(opt => (
                                        <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                                    ))}
                                </select>
                                {statusUpdating === order.id && <span style={{ marginLeft: 8 }}>Updating...</span>}
                            </div>
                        </div>
                    )) : (
                        <div className="empty-state">
                            <p>No orders found for the selected filter.</p>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
}

export default OrdersPage;
