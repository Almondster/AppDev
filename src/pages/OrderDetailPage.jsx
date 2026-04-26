import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrder, updateOrder, fetchTimeline, getUserData } from '../api';
import { ArrowLeft, MessageSquare, Star, CheckCircle, Truck, XCircle, Play, Clock } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ReviewModal from '../components/ReviewModal';
import { createReview } from '../api';
import './OrderDetailPage.css';

const STATUS_STYLES = {
  pending:     { bg: 'rgba(250,204,21,0.1)', color: '#facc15' },
  accepted:    { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8' },
  in_progress: { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8' },
  delivered:   { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
  completed:   { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  cancelled:   { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444' },
  rejected:    { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444' },
  refunded:    { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userData = getUserData();
  const isCreator = userData?.role === 'creator';

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Modal states
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', variant: 'info', action: null });
  const [reviewOpen, setReviewOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [oRes, tRes] = await Promise.all([
          fetchOrder(id),
          fetchTimeline(id),
        ]);
        if (oRes.ok) setOrder(oRes.data);
        if (tRes.ok) setTimeline(tRes.data.results || tRes.data || []);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleStatusChange = (newStatus, title, message, variant = 'info') => {
    setConfirmModal({
      open: true, title, message, variant,
      action: async () => {
        setActionLoading(true);
        try {
          const { ok } = await updateOrder(id, { status: newStatus });
          if (ok) {
            setOrder(prev => ({ ...prev, status: newStatus }));
            showToast(`Order status updated to ${newStatus.replace('_', ' ')}`);
          }
        } catch { showToast('Failed to update status.'); }
        setActionLoading(false);
        setConfirmModal(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    setActionLoading(true);
    try {
      const { ok } = await createReview({
        order: order.id,
        reviewer_id: userData.firebase_uid,
        reviewee_id: isCreator ? order.client_id : order.creator_id,
        rating,
        comment,
      });
      if (ok) {
        showToast('Review submitted successfully!');
        setReviewOpen(false);
      }
    } catch { showToast('Failed to submit review.'); }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <main className="order-detail">
        <div className="od-breadcrumb">
          <span>Orders</span><span className="od-bc-sep">/</span>
          <span className="od-bc-active">Loading...</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 10 }}></div>
          <div className="skeleton" style={{ width: '60%', height: 32 }}></div>
          <div className="od-grid">
            <div className="od-card"><div className="skeleton" style={{ height: 160 }}></div></div>
            <div className="od-card"><div className="skeleton" style={{ height: 160 }}></div></div>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="order-detail">
        <button className="od-back" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <p style={{ color: '#71717a', textAlign: 'center', marginTop: '3rem' }}>Order not found.</p>
      </main>
    );
  }

  const st = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

  return (
    <main className="order-detail">
      <div className="od-breadcrumb">
        <span className="od-bc-muted">Orders</span>
        <span className="od-bc-sep">/</span>
        <span className="od-bc-active">#{order.id}</span>
      </div>

      <button className="od-back" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>

      {toast && <div className="global-toast global-toast--success">{toast}</div>}

      {/* Header */}
      <div className="od-header">
        <div>
          <h1 className="od-title">{order.service_title || `Order #${order.id}`}</h1>
          <p className="od-subtitle">Order #{order.id} • Created {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</p>
        </div>
        <span className="od-status-badge" style={{ background: st.bg, color: st.color }}>
          {(order.status || 'pending').replace('_', ' ')}
        </span>
      </div>

      {/* Info Grid */}
      <div className="od-grid">
        <div className="od-card">
          <h4>Order Details</h4>
          <div className="od-info-row">
            <span className="od-info-label">Service</span>
            <span className="od-info-value">{order.service_title || '—'}</span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">Amount</span>
            <span className="od-info-value">₱{parseFloat(order.price || 0).toLocaleString()}</span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">Due Date</span>
            <span className="od-info-value">{order.due_date ? new Date(order.due_date).toLocaleDateString() : '—'}</span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">Status</span>
            <span className="od-info-value" style={{ color: st.color, textTransform: 'capitalize' }}>
              {(order.status || 'pending').replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="od-card">
          <h4>Parties</h4>
          <div className="od-info-row">
            <span className="od-info-label">Client</span>
            <span className="od-info-value">{order.client_display_name || order.client_name || order.client_id || '—'}</span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">Creator</span>
            <span className="od-info-value">{order.creator_display_name || order.creator_name || order.creator_id || '—'}</span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">Created</span>
            <span className="od-info-value">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">Updated</span>
            <span className="od-info-value">{order.updated_at ? new Date(order.updated_at).toLocaleDateString() : '—'}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="od-actions">
        {/* Creator actions */}
        {isCreator && order.status === 'pending' && (
          <button className="od-action-btn od-action-btn--primary" onClick={() => handleStatusChange('in_progress', 'Accept Order?', 'This order will move to In Progress.', 'info')}>
            <Play size={16} /> Accept
          </button>
        )}
        {isCreator && order.status === 'in_progress' && (
          <button className="od-action-btn od-action-btn--warning" onClick={() => handleStatusChange('delivered', 'Mark as Delivered?', 'The client will be notified to review the delivery.', 'success')}>
            <Truck size={16} /> Deliver
          </button>
        )}

        {/* Client actions */}
        {!isCreator && order.status === 'delivered' && (
          <button className="od-action-btn od-action-btn--success" onClick={() => handleStatusChange('completed', 'Complete Order?', 'This will release payment to the creator. This action cannot be undone.', 'success')}>
            <CheckCircle size={16} /> Complete
          </button>
        )}

        {/* Cancel (both roles, only if not completed) */}
        {!['completed', 'cancelled', 'refunded', 'rejected'].includes(order.status) && (
          <button className="od-action-btn od-action-btn--danger" onClick={() => handleStatusChange('cancelled', 'Cancel Order?', 'Are you sure you want to cancel this order? This action cannot be undone.', 'danger')}>
            <XCircle size={16} /> Cancel
          </button>
        )}

        {/* Review (completed orders only) */}
        {order.status === 'completed' && (
          <button className="od-action-btn od-action-btn--outline" onClick={() => setReviewOpen(true)}>
            <Star size={16} /> Leave Review
          </button>
        )}

        {/* Message */}
        <button className="od-action-btn od-action-btn--outline" onClick={() => navigate(`/messages?to=${isCreator ? order.client_id : order.creator_id}`)}>
          <MessageSquare size={16} /> Message
        </button>
      </div>

      {/* Timeline */}
      <div className="od-card" style={{ gridColumn: '1 / -1' }}>
        <h4>Order Timeline</h4>
        <div className="od-timeline">
          {timeline.length > 0 ? timeline.map(t => (
            <div key={t.id} className="od-timeline-item">
              <div className="od-timeline-dot"></div>
              <div className="od-timeline-content">
                <h5>{t.event_type?.replace('_', ' ') || 'Event'}</h5>
                <p>{t.message || '—'} • {t.created_at ? new Date(t.created_at).toLocaleString() : ''}</p>
              </div>
            </div>
          )) : (
            <div className="od-timeline-item">
              <div className="od-timeline-dot" style={{ background: '#10b981' }}></div>
              <div className="od-timeline-content">
                <h5>Order Created</h5>
                <p>{order.created_at ? new Date(order.created_at).toLocaleString() : 'Just now'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        loading={actionLoading}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
      />

      <ReviewModal
        open={reviewOpen}
        revieweeName={isCreator ? (order.client_display_name || order.client_name) : (order.creator_display_name || order.creator_name)}
        loading={actionLoading}
        onSubmit={handleReviewSubmit}
        onClose={() => setReviewOpen(false)}
      />
    </main>
  );
};

export default OrderDetailPage;
