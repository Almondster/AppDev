import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { acceptOrder, fetchMyCreatorOrders, fetchMyOrders, fetchOrders, fetchUser, rejectOrder, updateOrder, getUserData, deleteOrder, refundOrder } from '../api';
import { Eye, CheckCircle, XCircle, RefreshCcw, Ban, Trash2, AlertTriangle, ShieldCheck, Clock, DollarSign, RotateCcw } from 'lucide-react';
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

    const userData = getUserData();
    const isCreator = userRole === 'creator';
    const isAdmin = userRole === 'admin';
    const navigate = useNavigate();

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', variant: 'info', action: null });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                let fetcher;
                if (isAdmin) {
                    fetcher = fetchOrders; // Admin sees ALL orders
                } else if (isCreator) {
                    fetcher = fetchMyCreatorOrders; // Creator sees their orders
                } else {
                    fetcher = fetchMyOrders; // Client sees their orders
                }
                
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
    }, [isAdmin, isCreator]);

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

    const confirmDeleteOrder = (orderId) => {
        setConfirmModal({
            open: true,
            title: 'Delete Order?',
            message: 'This will permanently delete this order from the system. This action cannot be undone.',
            variant: 'danger',
            action: async () => {
                setActionLoading(true);
                try {
                    const { ok } = await deleteOrder(orderId);
                    if (ok) {
                        setOrders(prev => prev.filter(o => o.id !== orderId));
                        setToast('Order deleted successfully.');
                    } else {
                        setToast('Failed to delete order.');
                    }
                    setTimeout(() => setToast(''), 3000);
                } catch {
                    setToast('Failed to delete order.');
                    setTimeout(() => setToast(''), 3000);
                }
                setActionLoading(false);
                setConfirmModal(prev => ({ ...prev, open: false }));
            },
        });
    };

    const confirmRefundOrder = (order) => {
        setConfirmModal({
            open: true,
            title: 'Issue Refund?',
            message: `This will refund ₱${parseFloat(order.price || 0).toLocaleString()} to the client and mark the order as refunded. This action cannot be undone.`,
            variant: 'warning',
            action: async () => {
                setActionLoading(true);
                try {
                    const { ok } = await refundOrder(order.id, {
                        refund_amount: order.price,
                        reason: 'Admin refund'
                    });
                    if (ok) {
                        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'refunded', escrow_status: 'refunded', payment_status: 'refunded' } : o));
                        setToast('Refund processed successfully.');
                    } else {
                        setToast('Failed to process refund.');
                    }
                    setTimeout(() => setToast(''), 3000);
                } catch {
                    setToast('Failed to process refund.');
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
            pending: { bg: 'rgba(250,204,21,0.1)', color: '#facc15', border: 'rgba(250,204,21,0.2)' },
            active: { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: 'rgba(56,189,248,0.2)' },
            completed: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
            refunded: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', border: 'rgba(168,85,247,0.2)' },
            cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
        };
        const st = styles[s] || styles.pending;
        return (
            <span style={{ 
                background: st.bg, 
                color: st.color, 
                border: `1px solid ${st.border}`,
                padding: '0.25rem 0.75rem', 
                borderRadius: '20px', 
                fontSize: '0.75rem', 
                fontWeight: '600', 
                textTransform: 'capitalize',
                boxShadow: `0 0 10px ${st.bg}`
            }}>
                {(status || 'pending').replace('_', ' ')}
            </span>
        );
    };

    return (
        <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto h-full pb-20">
            {/* Toast */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-xl backdrop-blur-md shadow-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-300">
                    {toast}
                </div>
            )}

            {/* Header with Admin Theme */}
            <div className="rounded-2xl p-6 md:p-8" style={{ 
                background: isAdmin 
                    ? 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(168,85,247,0.08))' 
                    : 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                        background: isAdmin ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)',
                        border: isAdmin ? '1px solid rgba(244,63,94,0.2)' : '1px solid rgba(99,102,241,0.2)'
                    }}>
                        {isAdmin ? <ShieldCheck size={22} className="text-rose-400" /> : <CheckCircle size={22} className="text-indigo-400" />}
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">
                            {isAdmin ? 'Order Management' : isCreator ? 'Project Management' : 'My Orders'}
                        </h1>
                    </div>
                </div>
                <p className="text-zinc-400 text-sm">
                    {isAdmin
                        ? 'Monitor and manage all platform orders with full administrative control.'
                        : isCreator
                            ? 'Manage your gig pipeline and client orders.'
                            : 'Track your active orders and order history.'}
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {STATUS_FILTERS.map(s => (
                    <button 
                        key={s} 
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                            filter === s 
                                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                        }`} 
                        onClick={() => setFilter(s)}
                    >
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                            filter === s 
                                ? 'bg-black/10 text-black' 
                                : 'bg-white/10 text-zinc-400'
                        }`}>
                            {statusCounts[s]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Service</th>
                            {isAdmin ? (
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Client</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Creator</th>
                                </>
                            ) : (
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">{isCreator ? 'Client' : 'Creator'}</th>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Payment</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors" style={{ opacity: 1 - (i * 0.06) }}>
                                    <td className="px-4 py-4"><div className="h-4 rounded bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer" style={{ width: `${55 + (i%4)*12}%` }}></div></td>
                                    <td className="px-4 py-4"><div className="h-4 rounded bg-white/5" style={{ width: `${50 + (i%3)*15}%` }}></div></td>
                                    {isAdmin && <td className="px-4 py-4"><div className="h-4 rounded bg-white/5" style={{ width: `${50 + (i%3)*15}%` }}></div></td>}
                                    <td className="px-4 py-4"><div className="h-6 w-20 rounded-full bg-white/5"></div></td>
                                    <td className="px-4 py-4"><div className="h-6 w-16 rounded-full bg-white/5"></div></td>
                                    <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-white/5"></div></td>
                                    <td className="px-4 py-4"><div className="h-8 w-24 rounded-lg bg-white/5"></div></td>
                                </tr>
                            ))
                        ) : filtered.length > 0 ? (
                            filtered.map(order => (
                                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-4 py-4 text-sm text-white font-medium">{order.service_title || 'Untitled service'}</td>
                                    {isAdmin ? (
                                        <>
                                            <td className="px-4 py-4 text-sm text-zinc-400">{order.client_display_name || order.client_name || `Client #${order.client_id}`}</td>
                                            <td className="px-4 py-4 text-sm text-zinc-400">{order.creator_display_name || order.creator_name || `Creator #${order.creator_id}`}</td>
                                        </>
                                    ) : (
                                        <td className="px-4 py-4 text-sm text-zinc-400">{isCreator ? (order.client_display_name || order.client_name || 'Unknown client') : (order.creator_display_name || order.creator_name || 'Unknown creator')}</td>
                                    )}
                                    <td className="px-4 py-4">{getStatusBadge(order.status)}</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase whitespace-nowrap ${
                                            order.payment_status === 'paid' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-white font-medium">₱{parseFloat(order.price || 0).toLocaleString()}</td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            {/* Creator Actions */}
                                            {isCreator && order.status === 'pending' && (
                                                <>
                                                    <button 
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                                                        title="Accept order" 
                                                        onClick={() => confirmWorkflowAction(order.id, 'Accept Order?', 'This order will move to Accepted.', () => acceptOrder(order.id), 'success')}
                                                    >
                                                        <CheckCircle size={12} className="inline mr-1" />
                                                        Accept
                                                    </button>
                                                    <button 
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all" 
                                                        title="Reject order" 
                                                        onClick={() => confirmWorkflowAction(order.id, 'Reject Order?', 'This will decline the client order.', () => rejectOrder(order.id, 'Rejected by creator.'), 'danger')}
                                                    >
                                                        <XCircle size={12} className="inline mr-1" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            
                                            {/* Client Payment Action */}
                                            {!isCreator && !isAdmin && order.status === 'final_submitted' && order.payment_status !== 'paid' && (
                                                <button 
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                                                    title="Pay and unlock final output" 
                                                    onClick={() => navigate(`/orders/${order.id}`)}
                                                >
                                                    <DollarSign size={12} />
                                                    Pay Now
                                                </button>
                                            )}

                                            {/* Admin Actions */}
                                            {isAdmin && (
                                                <>
                                                    {/* Issue Refund */}
                                                    {order.status !== 'refunded' && order.payment_status === 'paid' && (
                                                        <button 
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-all" 
                                                            title="Issue refund to client" 
                                                            onClick={() => confirmRefundOrder(order)}
                                                        >
                                                            <RotateCcw size={12} className="inline mr-1" />
                                                            Refund
                                                        </button>
                                                    )}
                                                    
                                                    {/* Force Complete */}
                                                    {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'refunded' && (
                                                        <button 
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all" 
                                                            title="Force complete order" 
                                                            onClick={() => confirmStatusChange(order.id, 'completed', 'Force Complete Order?', 'This will mark the order as completed and release escrow.', 'success')}
                                                        >
                                                            <CheckCircle size={12} className="inline mr-1" />
                                                            Complete
                                                        </button>
                                                    )}
                                                    
                                                    {/* Force Cancel */}
                                                    {order.status !== 'cancelled' && order.status !== 'completed' && order.status !== 'refunded' && (
                                                        <button 
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all" 
                                                            title="Force cancel order" 
                                                            onClick={() => confirmStatusChange(order.id, 'cancelled', 'Force Cancel Order?', 'This will cancel the order immediately.', 'danger')}
                                                        >
                                                            <Ban size={12} className="inline mr-1" />
                                                            Cancel
                                                        </button>
                                                    )}

                                                    {/* Reset to Pending */}
                                                    {order.status !== 'pending' && order.status !== 'refunded' && (
                                                        <button 
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all" 
                                                            title="Reset to pending" 
                                                            onClick={() => confirmStatusChange(order.id, 'pending', 'Reset Order?', 'This will reset the order to pending status.', 'warning')}
                                                        >
                                                            <RefreshCcw size={12} className="inline mr-1" />
                                                            Reset
                                                        </button>
                                                    )}

                                                    {/* Delete Order */}
                                                    <button 
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all" 
                                                        title="Delete order permanently" 
                                                        onClick={() => confirmDeleteOrder(order.id)}
                                                    >
                                                        <Trash2 size={12} className="inline mr-1" />
                                                        Delete
                                                    </button>
                                                </>
                                            )}

                                            {/* View Details (All Roles) */}
                                            <button 
                                                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-white/5" 
                                                title="View details" 
                                                onClick={() => navigate(`/orders/${order.id}`)}
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={isAdmin ? "7" : "6"} className="px-4 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                            <AlertTriangle size={32} className="text-zinc-600" />
                                        </div>
                                        <p className="text-zinc-500 text-sm">No orders found.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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
