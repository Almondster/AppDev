import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchMyCreatorOrders, 
  getUserData, 
  updateOrderStatus,
  acceptOrder,
  rejectOrder
} from '../api';
import { 
  Package, 
  Search, 
  Clock, 
  DollarSign, 
  User, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, order: null });

  const userData = getUserData();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { ok, data } = await fetchMyCreatorOrders();
      if (ok) {
        const list = data.results || data || [];
        setOrders(list);
      } else {
        showToast('Failed to load orders.', 'error');
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      showToast('Cannot connect to server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchSearch = searchTerm.trim() === '' || 
      (o.service_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(o.id).includes(searchTerm);
    
    const matchFilter = filter === 'all' || o.status === filter;
    
    return matchSearch && matchFilter;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'amount') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'client') return (a.client_name || '').localeCompare(b.client_name || '');
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  // Status badge colors
  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      accepted: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
      in_progress: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
      partial_submitted: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
      final_submitted: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
      completed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
      rejected: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
      disputed: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    };
    return colors[status] || { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' };
  };

  // Format status for display
  const formatStatus = (status) => {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    setActionLoading(orderId);
    try {
      const { ok, data } = await updateOrderStatus(orderId, newStatus);
      if (ok) {
        showToast(`Order status updated to ${formatStatus(newStatus)}!`);
        await loadOrders();
      } else {
        showToast(data?.detail || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error('Status update error:', err);
      showToast('Failed to update status.', 'error');
    }
    setActionLoading(null);
  };

  // Handle accept order
  const handleAccept = async (order) => {
    setConfirmModal({ open: false, action: null, order: null });
    setActionLoading(order.id);
    try {
      const { ok, data } = await acceptOrder(order.id);
      if (ok) {
        showToast(`Order #${order.id} accepted!`);
        await loadOrders();
      } else {
        showToast(data?.detail || 'Failed to accept order.', 'error');
      }
    } catch (err) {
      console.error('Accept error:', err);
      showToast('Failed to accept order.', 'error');
    }
    setActionLoading(null);
  };

  // Handle reject order
  const handleReject = async (order) => {
    setConfirmModal({ open: false, action: null, order: null });
    setActionLoading(order.id);
    try {
      const { ok, data } = await rejectOrder(order.id, 'Order rejected by creator');
      if (ok) {
        showToast(`Order #${order.id} rejected.`);
        await loadOrders();
      } else {
        showToast(data?.detail || 'Failed to reject order.', 'error');
      }
    } catch (err) {
      console.error('Reject error:', err);
      showToast('Failed to reject order.', 'error');
    }
    setActionLoading(null);
  };

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    in_progress: orders.filter(o => o.status === 'in_progress' || o.status === 'accepted').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.price || 0), 0),
  };

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full pb-20">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg backdrop-blur-md shadow-lg ${
          toast.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          <p className="text-sm">{toast.msg}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Package size={22} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Incoming Orders</h1>
            <p className="text-zinc-400 text-sm mt-1">Manage client requests and delivery statuses</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-2xl font-bold text-purple-400">{stats.in_progress}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Revenue</p>
          <p className="text-2xl font-bold text-blue-400">₱{stats.revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by order ID, service, or client..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:border-white/20"
        >
          <option value="recent">Newest First</option>
          <option value="amount">Highest Amount</option>
          <option value="client">Client Name</option>
        </select>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-500">Loading orders...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedOrders.length > 0 ? (
            sortedOrders.map(order => {
              const statusColor = getStatusColor(order.status);
              const isPending = order.status === 'pending';
              const isProcessing = actionLoading === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:bg-white/[0.03] transition-all"
                >
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white line-clamp-2 mb-1">
                          {order.service_title || `Order #${order.id}`}
                        </h3>
                        <p className="text-xs text-zinc-500">Order #{order.id}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text} border ${statusColor.border} whitespace-nowrap`}>
                        {formatStatus(order.status)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={14} className="text-zinc-500" />
                        <span className="text-zinc-400">Client:</span>
                        <span className="text-white font-medium">{order.client_name || order.client_id}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={14} className="text-zinc-500" />
                        <span className="text-zinc-400">Amount:</span>
                        <span className="text-white font-bold">₱{parseFloat(order.price || 0).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-zinc-500" />
                        <span className="text-zinc-400">Date:</span>
                        <span className="text-white">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmModal({ open: true, action: 'accept', order })}
                            disabled={isProcessing}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={14} />
                            Accept
                          </button>
                          <button
                            onClick={() => setConfirmModal({ open: true, action: 'reject', order })}
                            disabled={isProcessing}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      )}

                      {!isPending && order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'rejected' && (
                        <select
                          value={order.status}
                          onChange={e => handleStatusUpdate(order.id, e.target.value)}
                          disabled={isProcessing}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-white/20 disabled:opacity-50"
                        >
                          <option value="accepted">Accepted</option>
                          <option value="in_progress">In Progress</option>
                          <option value="partial_submitted">Partial Submitted</option>
                          <option value="final_submitted">Final Submitted</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}

                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={14} />
                        View Details
                      </button>

                      {isProcessing && (
                        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                          <div className="w-3 h-3 border-2 border-zinc-500/20 border-t-zinc-500 rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <Package size={32} className="text-blue-400" />
              </div>
              <p className="text-zinc-400 text-lg mb-2">
                {searchTerm ? 'No orders match your search' : 'No orders yet'}
              </p>
              <p className="text-zinc-600 text-sm">
                {searchTerm ? 'Try a different search term or filter' : 'Orders from clients will appear here'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.action === 'accept' ? 'Accept Order?' : 'Reject Order?'}
        message={
          confirmModal.order ? (
            <>
              Are you sure you want to {confirmModal.action} order{' '}
              <strong className="text-white">#{confirmModal.order.id}</strong> for{' '}
              <strong className="text-white">"{confirmModal.order.service_title}"</strong>?
            </>
          ) : ''
        }
        variant={confirmModal.action === 'accept' ? 'info' : 'danger'}
        confirmLabel={confirmModal.action === 'accept' ? 'Accept Order' : 'Reject Order'}
        loading={actionLoading !== null}
        onConfirm={() => {
          if (confirmModal.action === 'accept') {
            handleAccept(confirmModal.order);
          } else {
            handleReject(confirmModal.order);
          }
        }}
        onCancel={() => setConfirmModal({ open: false, action: null, order: null })}
      />
    </div>
  );
};

export default OrdersPage;
