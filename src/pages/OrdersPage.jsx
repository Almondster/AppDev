import React, { useState, useEffect } from 'react';
import { fetchMyOrders as apiFetchOrders, fetchMyCreatorOrders, deleteOrder, getUserData, updateOrderStatus } from '../api';

const OrdersPage = () => {
    const [filter, setFilter] = useState('All');
    const [sortBy, setSortBy] = useState('recent');
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

    const [statusUpdating, setStatusUpdating] = useState(null);
    const [statusError, setStatusError] = useState('');
    const userRole = (getUserData()?.role || 'client').toLowerCase();
    const isCreator = userRole === 'creator';

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
        <section className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            <header className="space-y-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{isCreator ? 'Incoming Orders' : 'My Orders'} ({orders.length})</h2>
                    <p className="text-sm text-zinc-400">
                        {isCreator ? 'Manage client requests and keep delivery statuses up to date.' : 'Track the status of your purchases and deliveries.'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {['All', 'Pending', 'In_progress', 'Completed', 'Cancelled'].map(f => (
                            <button
                                key={f}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <label htmlFor="orderSort" className="sr-only">Sort orders</label>
                    <select id="orderSort" className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="recent">Sort: Recent</option>
                        <option value="amount">Sort: Amount</option>
                        <option value="client">Sort: Client</option>
                    </select>
                </div>
            </header>

            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
            {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{success}</div>}
            {statusError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{statusError}</div>}

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <p className="text-zinc-500">Loading orders...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedOrders.length > 0 ? sortedOrders.map(order => (
                        <div key={order.id} className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.03] transition-colors space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-base font-medium text-white flex-1">{order.service}</h3>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${
                                    order.status.toLowerCase() === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                    order.status.toLowerCase() === 'in progress' ? 'bg-blue-500/10 text-blue-400' :
                                    order.status.toLowerCase() === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                    order.status.toLowerCase() === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                    'bg-zinc-500/10 text-zinc-400'
                                }`}>{order.status}</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <p className="text-zinc-400"><strong className="text-zinc-300">Order ID:</strong> {order.id}</p>
                                <p className="text-zinc-400"><strong className="text-zinc-300">Amount:</strong> {order.amount}</p>
                                {order.creator && <p className="text-zinc-400"><strong className="text-zinc-300">Creator:</strong> {order.creator}</p>}
                                {order.date && <p className="text-zinc-400"><strong className="text-zinc-300">Date:</strong> {order.date}</p>}
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors" onClick={() => handleDelete(order.id)}>Remove</button>
                                <select
                                    value={order.status}
                                    onChange={e => handleStatusUpdate(order.id, e.target.value)}
                                    disabled={statusUpdating === order.id}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 disabled:opacity-50"
                                >
                                    {['Pending', 'In_progress', 'Completed', 'Cancelled'].map(opt => (
                                        <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                                    ))}
                                </select>
                                {statusUpdating === order.id && <span className="text-xs text-zinc-500">Updating...</span>}
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full flex items-center justify-center py-16">
                            <p className="text-zinc-500">No orders found for the selected filter.</p>
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
