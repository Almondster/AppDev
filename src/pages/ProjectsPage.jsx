import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { acceptOrder, fetchMyCreatorOrders, fetchMyOrders, fetchUser, rejectOrder, updateOrder } from '../api';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const STATUS_FILTERS = ['all', 'pending', 'active', 'completed', 'refunded', 'cancelled'];

const hydrateOrderParticipantNames = async (orders) => {
    const userIds = [...new Set(
        orders
            .flatMap(order => [
                order.client_display_name || order.client_name ? null : order.client_id,
                order.creator_display_name || order.creator_name ? null : order.creator_id,
            ])
            .filter(Boolean)
    )];

    if (userIds.length === 0) return orders;

    const entries = await Promise.all(userIds.map(async (userId) => {
        try {
            const { ok, data } = await fetchUser(userId);
            return [String(userId), ok ? data?.username : null];
        } catch {
            return [String(userId), null];
        }
    }));
    const namesById = Object.fromEntries(entries);

    return orders.map(order => {
        const clientName = order.client_display_name || order.client_name || namesById[String(order.client_id)];
        const creatorName = order.creator_display_name || order.creator_name || namesById[String(order.creator_id)];
        return {
            ...order,
            client_name: clientName,
            client_display_name: clientName,
            creator_name: creatorName,
            creator_display_name: creatorName,
        };
    });
};

const ProjectsPage = ({ userRole = 'creator' }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const isCreator = userRole === 'creator';
    const isAdmin = userRole === 'admin';
    const navigate = useNavigate();

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', variant: 'info', action: null });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const fetcher = isCreator ? fetchMyCreatorOrders : fetchMyOrders;
                const { ok, data } = await fetcher();
                if (ok) {
                    const list = data.results || data || [];
                    setOrders(await hydrateOrderParticipantNames(list));
                }
            } catch (err) {
                console.error('Failed to load orders:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const mapStatus = (status) => {
        if (['accepted', 'partial_submitted', 'final_submitted', 'in_progress', 'delivered'].includes(status)) return 'active';
        if (['cancelled', 'rejected'].includes(status)) return 'cancelled';
        return status || 'pending';
    };

    const filtered = filter === 'all'
        ? orders
        : orders.filter(o => mapStatus(o.status) === filter);

    const statusCounts = STATUS_FILTERS.reduce((acc, s) => {
        acc[s] = s === 'all' ? orders.length : orders.filter(o => mapStatus(o.status) === s).length;
        return acc;
    }, {});

    const [toast, setToast] = useState('');

    const confirmStatusChange = (orderId, newStatus, title, message, variant = 'info') => {
        setConfirmModal({
            open: true, title, message, variant,
            action: async () => {
                setActionLoading(true);
                try {
                    const { ok } = await updateOrder(orderId, { status: newStatus });
                    if (ok) {
                        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                        setToast(`Order updated to ${newStatus.replace('_', ' ')}`);
                        setTimeout(() => setToast(''), 3000);
                    }
                } catch {
                    setToast('Failed to update order.');
                    setTimeout(() => setToast(''), 3000);
                }
                setActionLoading(false);
                setConfirmModal(prev => ({ ...prev, open: false }));
            },
        });
    };

    const confirmWorkflowAction = (orderId, title, message, action, variant = 'info') => {
        setConfirmModal({
            open: true, title, message, variant,
            action: async () => {
                setActionLoading(true);
                try {
                    const { ok, data } = await action();
                    if (ok) {
                        setOrders(prev => prev.map(o => o.id === orderId ? data : o));
                        setToast('Order updated.');
                    } else {
                        setToast(data?.detail || 'Failed to update order.');
                    }
                    setTimeout(() => setToast(''), 3000);
                } catch {
                    setToast('Failed to update order.');
                    setTimeout(() => setToast(''), 3000);
                }
                setActionLoading(false);
                setConfirmModal(prev => ({ ...prev, open: false }));
            },
        });
    };

    const getStatusBadge = (status) => {
        const s = mapStatus(status);
        const styles = {
            pending: { bg: 'rgba(250,204,21,0.1)', color: '#facc15' },
            active: { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8' },
            completed: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
            refunded: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
            cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
        };
        const st = styles[s] || styles.pending;
        return (
            <span style={{ background: st.bg, color: st.color, padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' }}>
                {(status || 'pending').replace('_', ' ')}
            </span>
        );
    };

    return (
        <main className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-500">
                    {isAdmin ? 'Admin Workspace' : isCreator ? 'Creator Workspace' : 'Client Workspace'}
                </span>
                <span className="text-zinc-600">/</span>
                <span className="text-white font-medium">{isAdmin ? 'Order Management' : 'Orders'}</span>
            </div>

            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-500/90 text-white px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    {toast}
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">{isAdmin ? 'Order Management' : isCreator ? 'Project Management' : 'My Orders'}</h1>
                <p className="text-sm text-zinc-400">
                    {isAdmin
                        ? 'Review and manage platform-wide orders.'
                        : isCreator
                            ? 'Manage your gig pipeline.'
                            : 'Track your active orders and history.'}
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {STATUS_FILTERS.map(s => (
                    <button key={s} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${filter === s ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`} onClick={() => setFilter(s)}>
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === s ? 'bg-black/10 text-black' : 'bg-white/10 text-zinc-400'}`}>{statusCounts[s]}</span>
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02]">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Service</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{isCreator ? 'Client' : 'Creator'}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Deadline</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors" style={{ opacity: 1 - (i * 0.06) }}>
                                        <td className="px-4 py-4"><div className="h-4 rounded bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer" style={{ width: `${55 + (i%4)*12}%` }}></div></td>
                                        <td className="px-4 py-4"><div className="h-4 rounded bg-white/5" style={{ width: `${50 + (i%3)*15}%` }}></div></td>
                                        <td className="px-4 py-4"><div className="h-6 w-20 rounded-full bg-white/5"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-white/5"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-white/5"></div></td>
                                        <td className="px-4 py-4"><div className="h-8 w-8 rounded-lg bg-white/5"></div></td>
                                    </tr>
                                ))
                            ) : filtered.length > 0 ? (
                                filtered.map(order => (
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-4 text-sm text-white font-medium">{order.service_title || 'Untitled service'}</td>
                                        <td className="px-4 py-4 text-sm text-zinc-400">{isCreator ? (order.client_display_name || order.client_name || 'Unknown client') : (order.creator_display_name || order.creator_name || 'Unknown creator')}</td>
                                        <td className="px-4 py-4">{getStatusBadge(order.status)}</td>
                                        <td className="px-4 py-4 text-sm text-zinc-400">{order.due_date ? new Date(order.due_date).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-4 text-sm text-white font-medium">₱{parseFloat(order.price || 0).toLocaleString()}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {isCreator && order.status === 'pending' && (
                                                    <>
                                                        <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors" title="Accept order" onClick={() => confirmWorkflowAction(order.id, 'Accept Order?', 'This order will move to Accepted.', () => acceptOrder(order.id), 'success')}>Accept</button>
                                                        <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors" title="Reject order" onClick={() => confirmWorkflowAction(order.id, 'Reject Order?', 'This will decline the client order.', () => rejectOrder(order.id, 'Rejected by creator.'), 'danger')}>Reject</button>
                                                    </>
                                                )}
                                                {isCreator && ['accepted', 'partial_submitted', 'final_submitted'].includes(order.status) && (
                                                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors" title="Submit output" onClick={() => navigate(`/orders/${order.id}`)}>Submit output</button>
                                                )}
                                                {!isCreator && order.status === 'final_submitted' && (
                                                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors flex items-center gap-1" title="Pay and unlock final output" onClick={() => navigate(`/orders/${order.id}`)}><CheckCircle size={14} /> Pay</button>
                                                )}
                                                {!['completed','cancelled','refunded','rejected','final_submitted'].includes(order.status) && (
                                                    <button className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-red-400 transition-colors" title="Cancel order" onClick={() => confirmStatusChange(order.id, 'cancelled', 'Cancel Order?', 'This action cannot be undone.', 'danger')}><XCircle size={14} /></button>
                                                )}
                                                {!(isCreator && ['accepted', 'partial_submitted', 'final_submitted'].includes(order.status)) && (
                                                    <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors" title="View details" onClick={() => navigate(`/orders/${order.id}`)}><Eye size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="px-4 py-16 text-center text-zinc-500">No orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            {/* Kanban View disabled until it is ready */}
            {/*
            <div className="gigs-kanban">
                    {['pending', 'active', 'completed', 'cancelled'].map(col => {
                        const colOrders = orders.filter(o => mapStatus(o.status) === col);
                        return (
                            <div key={col} className="kanban-column">
                                <div className="kanban-col-header">
                                    <h3>{col.charAt(0).toUpperCase() + col.slice(1)}</h3>
                                    <span className="kanban-count">{colOrders.length}</span>
                                </div>
                                <div className="kanban-cards">
                                    {colOrders.map(order => (
                                        <div key={order.id} className="kanban-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${order.id}`)}>
                                            <h4>{order.service_title || 'Untitled service'}</h4>
                                            <p>{isCreator ? (order.client_display_name || order.client_name || '') : (order.creator_display_name || order.creator_name || '')}</p>
                                            <div className="kanban-card-footer">
                                                <span className="kanban-price">₱{parseFloat(order.price || 0).toLocaleString()}</span>
                                                {order.due_date && <span className="kanban-deadline">{new Date(order.due_date).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {colOrders.length === 0 && <p className="kanban-empty">No orders</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {/* Confirm Modal */}
            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                loading={actionLoading}
                onConfirm={confirmModal.action}
                onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
            />
        </main>
    );
};

export default ProjectsPage;
