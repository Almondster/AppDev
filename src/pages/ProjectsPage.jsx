import { useState, useEffect } from 'react';
import { fetchMyCreatorOrders, fetchMyOrders, getUserData, updateOrder } from '../api';
import { List, LayoutGrid, MoreVertical, Eye } from 'lucide-react';
import './ProjectsPage.css';

const STATUS_FILTERS = ['all', 'pending', 'active', 'completed', 'refunded', 'cancelled'];

const ProjectsPage = ({ userRole = 'creator' }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

    const userData = getUserData();
    const isCreator = userRole === 'creator';

    useEffect(() => {
        (async () => {
            try {
                const fetcher = isCreator ? fetchMyCreatorOrders : fetchMyOrders;
                const { ok, data } = await fetcher();
                if (ok) setOrders(data.results || data || []);
            } catch (err) {
                console.error('Failed to load orders:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const mapStatus = (status) => {
        if (['in_progress', 'accepted', 'delivered'].includes(status)) return 'active';
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

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const { ok } = await updateOrder(orderId, { status: newStatus });
            if (ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                setToast(`Order #${orderId} updated to ${newStatus.replace('_', ' ')}`);
                setTimeout(() => setToast(''), 3000);
            }
        } catch {
            setToast('Failed to update order.');
            setTimeout(() => setToast(''), 3000);
        }
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
                <div className="gigs-view-toggle">
                    <button className={`gigs-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
                    <button className={`gigs-view-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>Kanban</button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="gigs-filters">
                {STATUS_FILTERS.map(s => (
                    <button key={s} className={`gigs-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        <span className="gigs-filter-count">{statusCounts[s]}</span>
                    </button>
                ))}
            </div>

            {/* Table / List View */}
            {viewMode === 'list' ? (
                <div className="gigs-table-wrapper">
                    <table className="gigs-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
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
                                        <td><div className="skeleton" style={{ width: 40, height: 16 }}></div></td>
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
                                        <td className="gigs-cell-id">#{order.id}</td>
                                        <td className="gigs-cell-service">{order.service_title || `Order #${order.id}`}</td>
                                        <td className="gigs-cell-user">{isCreator ? (order.client_display_name || order.client_name || order.client_id) : (order.creator_display_name || order.creator_name || order.creator_id)}</td>
                                        <td>{getStatusBadge(order.status)}</td>
                                        <td className="gigs-cell-date">{order.due_date ? new Date(order.due_date).toLocaleDateString() : '—'}</td>
                                        <td className="gigs-cell-amount">₱{parseFloat(order.price || 0).toLocaleString()}</td>
                                        <td>
                                            <div className="gigs-action-group">
                                                {isCreator && order.status === 'pending' && (
                                                    <button className="gigs-action-btn gigs-action-btn--accept" title="Accept order" onClick={() => handleUpdateStatus(order.id, 'in_progress')}>Accept</button>
                                                )}
                                                {isCreator && order.status === 'in_progress' && (
                                                    <button className="gigs-action-btn gigs-action-btn--deliver" title="Mark as delivered" onClick={() => handleUpdateStatus(order.id, 'delivered')}>Deliver</button>
                                                )}
                                                <button className="gigs-action-btn" title="View details"><Eye size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className="gigs-empty">No orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Kanban View */
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
                                        <div key={order.id} className="kanban-card">
                                            <h4>{order.service_title || `Order #${order.id}`}</h4>
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
        </main>
    );
};

export default ProjectsPage;
