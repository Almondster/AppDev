import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acceptOrder, fetchOrder, updateOrder, fetchTimeline, getUserData, payOrder, rejectOrder, submitFinalOutput, submitPartialOutput, createSupportTicket } from '../api';
import { ArrowLeft, MessageSquare, Star, XCircle, Play, Lock, CreditCard, Upload, Download } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ReviewModal from '../components/ReviewModal';
import { createReview } from '../api';

const STATUS_STYLES = {
  pending:     { bg: 'rgba(250,204,21,0.1)', color: '#facc15' },
  accepted:    { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8' },
  in_progress: { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8' },
  partial_submitted: { bg: 'rgba(99,102,241,0.1)', color: '#818cf8' },
  final_submitted: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
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
  const [partialForm, setPartialForm] = useState({ partial_output_url: '', partial_output_note: '' });
  const [finalForm, setFinalForm] = useState({ final_file_url: '', final_output_note: '' });
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [oRes, tRes] = await Promise.all([
          fetchOrder(id),
          fetchTimeline(id),
        ]);
        if (oRes.ok) {
          setOrder(oRes.data);
          setPartialForm({
            partial_output_url: oRes.data.partial_output_url || '',
            partial_output_note: oRes.data.partial_output_note || '',
          });
          setFinalForm({
            final_file_url: oRes.data.final_file_url || '',
            final_output_note: oRes.data.final_output_note || '',
          });
        }
        if (tRes.ok) setTimeline(tRes.data.results || tRes.data || []);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };
  const isDataUrl = (value) => String(value || '').startsWith('data:');

  const renderOutputLink = (url, label, filename) => {
    if (!url) return null;
    return (
      <a
        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
        href={url}
        target={isDataUrl(url) ? undefined : '_blank'}
        rel={isDataUrl(url) ? undefined : 'noreferrer'}
        download={isDataUrl(url) ? filename : undefined}
      >
        {isDataUrl(url) && <Download size={15} />}
        {isDataUrl(url) ? label : url}
      </a>
    );
  };

  const handleOutputFileUpload = (target, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = String(reader.result || '');
      if (target === 'partial') {
        setPartialForm((prev) => ({
          ...prev,
          partial_output_url: fileData,
          partial_output_note: prev.partial_output_note || `Attached file: ${file.name}`,
        }));
      } else {
        setFinalForm((prev) => ({
          ...prev,
          final_file_url: fileData,
          final_output_note: prev.final_output_note || `Attached file: ${file.name}`,
        }));
      }
    };
    reader.onerror = () => showToast('Failed to read attached file.');
    reader.readAsDataURL(file);
  };

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

  const confirmOrderAction = (title, message, variant, action, successMessage) => {
    setConfirmModal({
      open: true, title, message, variant,
      action: async () => {
        setActionLoading(true);
        try {
          const { ok, data } = await action();
          if (ok) {
            setOrder(data);
            showToast(successMessage);
          } else {
            showToast(data?.detail || 'Order update failed.');
          }
        } catch { showToast('Order update failed.'); }
        setActionLoading(false);
        setConfirmModal(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleSubmitPartial = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { ok, data } = await submitPartialOutput(id, partialForm);
      if (ok) {
        setOrder(data);
        showToast('Partial output sent to the client.');
      } else {
        showToast(data?.detail || 'Failed to submit partial output.');
      }
    } catch { showToast('Failed to submit partial output.'); }
    setActionLoading(false);
  };

  const handleSubmitFinal = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { ok, data } = await submitFinalOutput(id, finalForm);
      if (ok) {
        setOrder(data);
        showToast('Final output saved. It unlocks after dummy payment.');
      } else {
        showToast(data?.detail || 'Failed to submit final output.');
      }
    } catch { showToast('Failed to submit final output.'); }
    setActionLoading(false);
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    setActionLoading(true);
    try {
      const reviewerId = Number(userData?.firebase_uid || userData?.id);
      const revieweeId = Number(isCreator ? order.client_id : order.creator_id);
      const { ok } = await createReview({
        order_id: Number(order.id),
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
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

  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setDisputeLoading(true);
    try {
      const { ok } = await createSupportTicket({
        ticket_number: `DSP-${Date.now()}`,
        user_id: userData?.firebase_uid,
        email: userData?.email || '',
        category: 'dispute',
        message: `Order #${order.id} (${order.service_title || 'Untitled service'})\n\n${disputeReason.trim()}`,
        user_role: userData?.role,
        status: 'open',
      });
      if (ok) {
        showToast('Dispute submitted. Admin will review this case.');
        setDisputeModalOpen(false);
        setDisputeReason('');
      } else {
        showToast('Failed to submit dispute.');
      }
    } catch {
      showToast('Failed to submit dispute.');
    }
    setDisputeLoading(false);
  };

  if (loading) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-sm mb-6">
          <span className="text-zinc-400">Orders</span><span className="text-zinc-600">/</span>
          <span className="text-white">Loading...</span>
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-9 w-30 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded-xl"></div>
          <div className="h-8 w-3/5 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"><div className="h-40 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded-xl"></div></div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"><div className="h-40 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded-xl"></div></div>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors mb-6" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <p className="text-zinc-500 text-center mt-12">Order not found.</p>
      </main>
    );
  }

  const st = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm mb-6">
        <span className="text-zinc-400">Orders</span>
        <span className="text-zinc-600">/</span>
        <span className="text-white">{order.service_title || 'Untitled service'}</span>
      </div>

      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors mb-6" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>

      {toast && <div className="fixed top-4 right-4 bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-3 rounded-xl z-50">{toast}</div>}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{order.service_title || 'Untitled service'}</h1>
          <p className="text-zinc-400">Created {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</p>
        </div>
        <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: st.bg, color: st.color }}>
          {(order.status || 'pending').replace('_', ' ')}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <h4 className="text-white font-semibold mb-4">Order Details</h4>
          <div className="flex justify-between items-center py-3 border-b border-white/5">
            <span className="text-zinc-400">Service</span>
            <span className="text-white font-medium">{order.service_title || '—'}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/5">
            <span className="text-zinc-400">Amount</span>
            <span className="text-white font-medium">₱{parseFloat(order.price || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/5">
            <span className="text-zinc-400">Due Date</span>
            <span className="text-white font-medium">{order.due_date ? new Date(order.due_date).toLocaleDateString() : '—'}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-zinc-400">Status</span>
            <span className="font-medium capitalize" style={{ color: st.color }}>
              {(order.status || 'pending').replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <h4 className="text-white font-semibold mb-4">Partial Output</h4>
          {order.partial_output_url || order.partial_output_note ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              {renderOutputLink(order.partial_output_url, 'Download partial output', `order-${order.id}-partial-output`)}
              {order.partial_output_note && <p className="text-zinc-400 mt-2">{order.partial_output_note}</p>}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No partial output submitted yet.</p>
          )}

          {isCreator && ['accepted', 'partial_submitted'].includes(order.status) && (
            <form className="flex flex-col gap-3 mt-4" onSubmit={handleSubmitPartial}>
              <input
                value={isDataUrl(partialForm.partial_output_url) ? '' : partialForm.partial_output_url}
                onChange={e => setPartialForm(prev => ({ ...prev, partial_output_url: e.target.value }))}
                placeholder={isDataUrl(partialForm.partial_output_url) ? 'Attached file selected' : 'Partial output link'}
                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
              />
              <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white cursor-pointer transition-colors">
                <Upload size={15} />
                Attach partial file
                <input type="file" onChange={(e) => handleOutputFileUpload('partial', e)} className="hidden" />
              </label>
              <textarea
                value={partialForm.partial_output_note}
                onChange={e => setPartialForm(prev => ({ ...prev, partial_output_note: e.target.value }))}
                placeholder="Partial output notes"
                rows={3}
                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 resize-none"
              />
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50" disabled={actionLoading}>Submit Partial</button>
            </form>
          )}
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <h4 className="text-white font-semibold mb-4">Final Output</h4>
          {order.payment_status === 'paid' || isCreator ? (
            order.final_file_url || order.final_output_note ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                {renderOutputLink(order.final_file_url, 'Download final output', `order-${order.id}-final-output`)}
                {order.final_output_note && <p className="text-zinc-400 mt-2">{order.final_output_note}</p>}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No final output submitted yet.</p>
            )
          ) : (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-xl"><Lock size={16} /> Final output unlocks after dummy payment.</div>
          )}

          {isCreator && ['partial_submitted', 'final_submitted'].includes(order.status) && (
            <form className="flex flex-col gap-3 mt-4" onSubmit={handleSubmitFinal}>
              <input
                value={isDataUrl(finalForm.final_file_url) ? '' : finalForm.final_file_url}
                onChange={e => setFinalForm(prev => ({ ...prev, final_file_url: e.target.value }))}
                placeholder={isDataUrl(finalForm.final_file_url) ? 'Attached file selected' : 'Final output link'}
                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
              />
              <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white cursor-pointer transition-colors">
                <Upload size={15} />
                Attach downloadable final file
                <input type="file" onChange={(e) => handleOutputFileUpload('final', e)} className="hidden" />
              </label>
              <textarea
                value={finalForm.final_output_note}
                onChange={e => setFinalForm(prev => ({ ...prev, final_output_note: e.target.value }))}
                placeholder="Final output notes"
                rows={3}
                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 resize-none"
              />
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50" disabled={actionLoading}>Save Final</button>
            </form>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Creator actions */}
        {isCreator && order.status === 'pending' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors" onClick={() => confirmOrderAction('Accept Order?', 'This order will move to Accepted.', 'success', () => acceptOrder(id), 'Order accepted.')}>
            <Play size={16} /> Accept
          </button>
        )}
        {isCreator && order.status === 'pending' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors" onClick={() => confirmOrderAction('Reject Order?', 'This will decline the client order.', 'danger', () => rejectOrder(id, 'Rejected by creator.'), 'Order rejected.')}>
            <XCircle size={16} /> Reject
          </button>
        )}

        {/* Client actions */}
        {!isCreator && order.status === 'final_submitted' && order.payment_status !== 'paid' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors" onClick={() => confirmOrderAction('Send Dummy Payment?', 'This unlocks the final output and completes the order.', 'success', () => payOrder(id), 'Dummy payment sent. Final output unlocked.')}>
            <CreditCard size={16} /> Pay and Unlock Final
          </button>
        )}

        {/* Cancel (both roles, only if not completed) */}
        {!['completed', 'cancelled', 'refunded', 'rejected', 'final_submitted'].includes(order.status) && (
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors" onClick={() => handleStatusChange('cancelled', 'Cancel Order?', 'Are you sure you want to cancel this order? This action cannot be undone.', 'danger')}>
            <XCircle size={16} /> Cancel
          </button>
        )}

        {/* Review (completed orders only) */}
        {order.status === 'completed' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-colors" onClick={() => setReviewOpen(true)}>
            <Star size={16} /> Leave Review
          </button>
        )}

        {/* Message */}
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-colors" onClick={() => navigate(`/messages?to=${isCreator ? order.client_id : order.creator_id}`)}>
          <MessageSquare size={16} /> Message
        </button>
        {['pending', 'accepted', 'in_progress', 'partial_submitted', 'final_submitted', 'delivered'].includes(order.status) && (
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors" onClick={() => setDisputeModalOpen(true)}>
            <XCircle size={16} /> File Dispute
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <h4 className="text-white font-semibold mb-4">Order Timeline</h4>
        <div className="flex flex-col gap-4">
          {timeline.length > 0 ? timeline.map(t => (
            <div key={t.id} className="flex gap-4">
              <div className="w-3 h-3 rounded-full bg-indigo-500 mt-1 flex-shrink-0"></div>
              <div className="flex-1">
                <h5 className="text-white font-medium capitalize">{t.event_type?.replace('_', ' ') || 'Event'}</h5>
                <p className="text-zinc-400 text-sm">{t.message || '—'} • {t.timestamp ? new Date(t.timestamp).toLocaleString() : ''}</p>
              </div>
            </div>
          )) : (
            <div className="flex gap-4">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
              <div className="flex-1">
                <h5 className="text-white font-medium">Order Created</h5>
                <p className="text-zinc-400 text-sm">{order.created_at ? new Date(order.created_at).toLocaleString() : 'Just now'}</p>
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

      {disputeModalOpen && (
        <div className="confirm-overlay" onClick={() => setDisputeModalOpen(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-modal__title">File Dispute</h3>
            <p className="confirm-modal__message">
              Explain the issue with this order. Admin will review both sides.
            </p>
            <form onSubmit={handleSubmitDispute}>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Describe the dispute and include key details."
                required
                style={{ width: '100%', minHeight: 120, padding: '0.75rem', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', marginTop: '0.75rem' }}
              />
              <div className="confirm-modal__actions">
                <button type="button" className="confirm-modal__btn confirm-modal__btn--cancel" onClick={() => setDisputeModalOpen(false)}>Cancel</button>
                <button type="submit" className="confirm-modal__btn confirm-modal__btn--confirm" disabled={disputeLoading}>
                  {disputeLoading ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default OrderDetailPage;
