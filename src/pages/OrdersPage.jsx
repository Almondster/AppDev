import React, { useState, useEffect } from 'react';
import { deleteOrder, updateOrderStatus } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import { readCollection } from '../utils/collections';
import { getCurrentUserRole } from '../utils/currentUser';
import { getOrderFetcherForRole } from '../utils/orders';
import { humanizeLabel } from '../utils/text';

const OrdersPage = () => {
    const [filter, setFilter] = useState('All');
    const [sortBy, setSortBy] = useState('recent');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [statusConfirm, setStatusConfirm] = useState({ open: false, id: null, newStatus: '' });

    const loadOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const role = getCurrentUserRole('client');
            const response = await getOrderFetcherForRole(role)();

            if (response.ok) {
                const list = readCollection(response);
                setOrders(list.map(o => ({
                    id: o.id,
                    service: o.service_title || `Order #${o.id}`,
                    rawStatus: o.status || '',
                    status: humanizeLabel(o.status),
                    amount: `â‚±${parseFloat(o.price || 0).toLocaleString()}`,
                    rawPrice: parseFloat(o.price || 0),
                    creator: o.creator_display_name || o.creator_name || o.creator_id,
                    client: o.client_display_name || o.client_name || o.client_id,
                    date: o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
                    rawDate: o.created_at || '',
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

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortBy === 'amount') return b.rawPrice - a.rawPrice;
        if (sortBy === 'client') return (a.client || '').localeCompare(b.client || '');
        return new Date(b.rawDate || 0) - new Date(a.rawDate || 0);
    });

    const handleDelete = async () => {
        const id = deleteConfirm.id;
        if (!id) return;
        setDeleteLoading(true);
        const { ok } = await deleteOrder(id);
        if (ok) {
            setSuccess('Order deleted.');
            loadOrders();
        } else {
            setError('Failed to delete order.');
        }
        setDeleteLoading(false);
        setDeleteConfirm({ open: false, id: null });
        setTimeout(() => { setSuccess(''); setError(''); }, 3000);
    };

    const [statusUpdating, setStatusUpdating] = useState(null);
    const [statusError, setStatusError] = useState('');

    const handleStatusUpdate = async (id, newStatus) => {
        setStatusConfirm({ open: true, id, newStatus });
    };

    const confirmStatusUpdate = async () => {
        const { id, newStatus } = statusConfirm;
        setStatusConfirm(prev => ({ ...prev, open: false }));
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
        <>
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
                            {humanizeLabel(f)}
                        </button>
                    ))}
                </div>
                <label htmlFor="orderSort" className="sr-only">Sort orders</label>
                <select id="orderSort" className="form-input sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="recent">Sort: Recent</option>
                    <option value="amount">Sort: Amount</option>
                    <option value="client">Sort: Client</option>
                </select>
            </header>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
            {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}
            {statusError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.5rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{statusError}</div>}

            {loading ? (
                <div className="empty-state"><p>Loading orders...</p></div>
            ) : (
                <div className="card-grid">
                    {sortedOrders.length > 0 ? sortedOrders.map(order => (
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
                                <button className="card-action-btn card-action-btn--delete" onClick={() => setDeleteConfirm({ open: true, id: order.id })}>Remove</button>
                                <select
                                    value={order.rawStatus}
                                    onChange={e => handleStatusUpdate(order.id, e.target.value)}
                                    disabled={statusUpdating === order.id}
                                    style={{ marginLeft: 8 }}
                                >
                                    {['Pending', 'In_progress', 'Completed', 'Cancelled'].map(opt => (
                                        <option key={opt} value={opt}>{humanizeLabel(opt)}</option>
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

        <ConfirmModal
            open={deleteConfirm.open}
            title="Remove Order?"
            message="Are you sure you want to remove this order? This action cannot be undone."
            variant="danger"
            confirmLabel="Remove"
            loading={deleteLoading}
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirm({ open: false, id: null })}
        />

        <ConfirmModal
            open={statusConfirm.open}
            title={`${statusConfirm.newStatus === 'Cancelled' ? 'Cancel' : 'Update'} Order?`}
            message={statusConfirm.newStatus === 'Cancelled'
                ? 'Are you sure you want to cancel this order? This action cannot be undone.'
                : `Change order status to "${humanizeLabel(statusConfirm.newStatus)}"?`}
            variant={statusConfirm.newStatus === 'Cancelled' ? 'danger' : 'warning'}
            confirmLabel={statusConfirm.newStatus === 'Cancelled' ? 'Cancel Order' : 'Update Status'}
            onConfirm={confirmStatusUpdate}
            onCancel={() => setStatusConfirm({ open: false, id: null, newStatus: '' })}
        />
    </>
    );
};

export default OrdersPage;
