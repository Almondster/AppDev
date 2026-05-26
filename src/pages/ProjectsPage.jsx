import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { acceptOrder, fetchUser, rejectOrder, updateOrder } from '../api';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { readCollection } from '../utils/collections';
import { getOrderFetcherForRole, isActiveCreatorOrderStatus, mapOrderStatusBucket, ORDER_STATUS_FILTERS } from '../utils/orders';
import { humanizeLabel } from '../utils/text';
import '../styles/ProjectsPage.css';

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
    const navigate = useNavigate();

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', variant: 'info', action: null });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { ok, data } = await getOrderFetcherForRole(userRole)();
                if (ok) {
                    const list = readCollection({ data });
                    setOrders(await hydrateOrderParticipantNames(list));
                }
            } catch (err) {
                console.error('Failed to load orders:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [isCreator, userRole]);

    const filtered = filter === 'all'
        ? orders
        : orders.filter(o => mapOrderStatusBucket(o.status) === filter);

    const statusCounts = ORDER_STATUS_FILTERS.reduce((acc, s) => {
        acc[s] = s === 'all' ? orders.length : orders.filter(o => mapOrderStatusBucket(o.status) === s).length;
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
        const s = mapOrderStatusBucket(status);
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
                {humanizeLabel(status || 'pending')}
            </span>
        );
    };

    return (
        <main className="gigs-page">
            {/* Breadcrumb */}
            <div className="gigs-breadcrumb">
                <span className="gigs-bc-muted">{isCreator ? 'Creator Workspace' : 'Client Workspace'}</span>
                <span className="gigs-bc-sep">/</span>
                <span className="gigs-bc-active">Orders</span>
            </div>

            {toast && <div className="global-toast global-toast--success">{toast}</div>}

            {/* Header */}
            <div className="gigs-header">
                <div>
                    <h1 className="gigs-title">{isCreator ? 'Project Management' : 'My Orders'}</h1>
                    <p className="gigs-subtitle">{isCreator ? 'Manage your gig pipeline.' : 'Track your active orders and history.'}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="gigs-filters">
                {ORDER_STATUS_FILTERS.map(s => (
                    <button key={s} className={`gigs-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                        {humanizeLabel(s)}
                        <span className="gigs-filter-count">{statusCounts[s]}</span>
                    </button>
                ))}
            </div>

            <div className="gigs-table-wrapper">
                    <table className="gigs-table">
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>{isCreator ? 'Client' : 'Creator'}</th>
                                <th>Status</th>
                                <th>Deadline</th>
                                <th>Amount</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} style={{ opacity: 1 - (i * 0.06) }}>
                                        <td><div className="skeleton" style={{ width: `${55 + (i%4)*12}%`, height: 16 }}></div></td>
                                        <td><div className="skeleton" style={{ width: `${50 + (i%3)*15}%`, height: 16 }}></div></td>
                                        <td><div className="skeleton" style={{ width: 65, height: 24, borderRadius: 6 }}></div></td>
                                        <td><div className="skeleton" style={{ width: 75, height: 16 }}></div></td>
                                        <td><div className="skeleton" style={{ width: 60, height: 18 }}></div></td>
                                        <td><div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }}></div></td>
                                    </tr>
                                ))
                            ) : filtered.length > 0 ? (
                                filtered.map(order => (
                                    <tr key={order.id}>
                                        <td className="gigs-cell-service">{order.service_title || 'Untitled service'}</td>
                                        <td className="gigs-cell-user">{isCreator ? (order.client_display_name || order.client_name || 'Unknown client') : (order.creator_display_name || order.creator_name || 'Unknown creator')}</td>
                                        <td>{getStatusBadge(order.status)}</td>
                                        <td className="gigs-cell-date">{order.due_date ? new Date(order.due_date).toLocaleDateString() : '—'}</td>
                                        <td className="gigs-cell-amount">₱{parseFloat(order.price || 0).toLocaleString()}</td>
                                        <td>
                                            <div className="gigs-action-group">
                                                {isCreator && order.status === 'pending' && (
                                                    <>
                                                        <button className="gigs-action-btn gigs-action-btn--accept" title="Accept order" onClick={() => confirmWorkflowAction(order.id, 'Accept Order?', 'This order will move to Accepted.', () => acceptOrder(order.id), 'success')}>Accept</button>
                                                        <button className="gigs-action-btn gigs-action-btn--cancel" title="Reject order" onClick={() => confirmWorkflowAction(order.id, 'Reject Order?', 'This will decline the client order.', () => rejectOrder(order.id, 'Rejected by creator.'), 'danger')}>Reject</button>
                                                    </>
                                                )}
                                                {isCreator && isActiveCreatorOrderStatus(order.status) && (
                                                    <button className="gigs-action-btn gigs-action-btn--deliver" title="Submit output" onClick={() => navigate(`/orders/${order.id}`)}>Submit output</button>
                                                )}
                                                {!isCreator && order.status === 'final_submitted' && (
                                                    <button className="gigs-action-btn gigs-action-btn--accept" title="Pay and unlock final output" onClick={() => navigate(`/orders/${order.id}`)}><CheckCircle size={14} /> Pay</button>
                                                )}
                                                {!['completed','cancelled','refunded','rejected','final_submitted'].includes(order.status) && (
                                                    <button className="gigs-action-btn gigs-action-btn--cancel" title="Cancel order" onClick={() => confirmStatusChange(order.id, 'cancelled', 'Cancel Order?', 'This action cannot be undone.', 'danger')} style={{ color: '#f87171', fontSize: '0.75rem' }}><XCircle size={14} /></button>
                                                )}
                                                {!(isCreator && isActiveCreatorOrderStatus(order.status)) && (
                                                    <button className="gigs-action-btn" title="View details" onClick={() => navigate(`/orders/${order.id}`)}><Eye size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="gigs-empty">No orders found.</td></tr>
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
