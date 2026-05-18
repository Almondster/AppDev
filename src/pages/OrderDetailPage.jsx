import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  acceptOrder, 
  fetchOrder, 
  updateOrder, 
  fetchTimeline, 
  getUserData, 
  payOrder, 
  rejectOrder, 
  submitFinalOutput, 
  submitPartialOutput, 
  createSupportTicket,
  createReview,
  fetchReviews,
  updateReview
} from '../api';
import { 
  ArrowLeft, 
  MessageSquare, 
  Star, 
  XCircle, 
  CheckCircle, 
  Lock, 
  CreditCard, 
  Upload, 
  Download,
  Package,
  User,
  DollarSign,
  Clock,
  AlertCircle,
  FileText,
  Send
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ReviewModal from '../components/ReviewModal';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userData = getUserData();
  const isCreator = userData?.role === 'creator';

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [existingReview, setExistingReview] = useState(null);

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
          fetchTimeline({ order_id: id }),
        ]);
        if (oRes.ok) {
          console.log('Order fetched:', oRes.data);
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

        // Fetch existing review for this order
        if (oRes.ok && oRes.data.status === 'completed') {
          const reviewsRes = await fetchReviews({ order_id: id, reviewer_id: userData?.id || userData?.firebase_uid });
          if (reviewsRes.ok) {
            const reviews = reviewsRes.data.results || reviewsRes.data || [];
            if (reviews.length > 0) {
              setExistingReview(reviews[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const showToast = (msg, type = 'success') => { 
    setToast({ msg, type }); 
    setTimeout(() => setToast(null), 4000); 
  };

  const isDataUrl = (value) => String(value || '').startsWith('data:');

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      accepted: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
      in_progress: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
      partial_submitted: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
      final_submitted: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
      delivered: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
      completed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
      rejected: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
      disputed: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    };
    return colors[status] || colors.pending;
  };

  const formatStatus = (status) => {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderOutputLink = (url, label, filename) => {
    if (!url) return null;
    return (
      <a
        className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        href={url}
        target={isDataUrl(url) ? undefined : '_blank'}
        rel={isDataUrl(url) ? undefined : 'noreferrer'}
        download={isDataUrl(url) ? filename : undefined}
      >
        <Download size={16} />
        {isDataUrl(url) ? label : 'Download file'}
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
    reader.onerror = () => showToast('Failed to read attached file.', 'error');
    reader.readAsDataURL(file);
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
            // Reload order data to get updated information
            setTimeout(async () => {
              const { ok: reloadOk, data: reloadData } = await fetchOrder(id);
              if (reloadOk) {
                setOrder(reloadData);
              }
            }, 500);
          } else {
            showToast(data?.detail || 'Order update failed.', 'error');
          }
        } catch (err) {
          console.error('Action error:', err);
          showToast('Order update failed.', 'error');
        }
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
        showToast('Partial output submitted successfully!');
      } else {
        showToast(data?.detail || 'Failed to submit partial output.', 'error');
      }
    } catch (err) {
      console.error('Partial submit error:', err);
      showToast('Failed to submit partial output.', 'error');
    }
    setActionLoading(false);
  };

  const handleSubmitFinal = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { ok, data } = await submitFinalOutput(id, finalForm);
      if (ok) {
        setOrder(data);
        showToast('Final output submitted! It unlocks after payment.');
      } else {
        showToast(data?.detail || 'Failed to submit final output.', 'error');
      }
    } catch (err) {
      console.error('Final submit error:', err);
      showToast('Failed to submit final output.', 'error');
    }
    setActionLoading(false);
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    setActionLoading(true);
    try {
      const reviewerId = Number(userData?.id || userData?.firebase_uid);
      const revieweeId = Number(isCreator ? order.client_id : order.creator_id);
      
      if (existingReview) {
        // Update existing review
        const res = await updateReview(existingReview.id, { rating, comment });
        if (res.ok) {
          setExistingReview({ ...existingReview, rating, comment });
          showToast('Review updated successfully!');
          setReviewOpen(false);
        } else {
          showToast('Failed to update review.', 'error');
        }
      } else {
        // Create new review
        const res = await createReview({
          order_id: Number(order.id),
          reviewer_id: reviewerId,
          reviewee_id: revieweeId,
          rating,
          comment,
        });
        if (res.ok) {
          setExistingReview(res.data);
          showToast('Review submitted successfully!');
          setReviewOpen(false);
        } else {
          showToast('Failed to submit review.', 'error');
        }
      }
    } catch (err) {
      console.error('Review error:', err);
      showToast('Failed to submit review.', 'error');
    }
    setActionLoading(false);
  };

  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setDisputeLoading(true);
    try {
      const { ok } = await createSupportTicket({
        ticket_number: `DSP-${Date.now()}`,
        user_id: userData?.id || userData?.firebase_uid,
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
        showToast('Failed to submit dispute.', 'error');
      }
    } catch (err) {
      console.error('Dispute error:', err);
      showToast('Failed to submit dispute.', 'error');
    }
    setDisputeLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm mb-6">
            <span className="text-zinc-400">Orders</span>
            <span className="text-zinc-700">/</span>
            <span className="text-white">Loading...</span>
          </div>
          
          <div className="space-y-6">
            <div className="h-10 bg-white/5 rounded-lg w-32 animate-pulse" />
            <div className="h-12 bg-white/5 rounded-lg w-3/4 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 h-64 animate-pulse" />
              </div>
              <div className="space-y-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 h-48 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full pb-20">
        <div className="max-w-7xl mx-auto">
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors mb-6" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">Order not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(order.status);

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full pb-20">
      <div className="max-w-7xl mx-auto">
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

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <span className="text-zinc-400">Orders</span>
          <span className="text-zinc-700">/</span>
          <span className="text-white font-medium">{order.service_title || `Order #${order.id}`}</span>
        </div>

        {/* Back Button */}
        <button 
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors mb-6" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>

        {/* Header */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Package size={24} className="text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {order.service_title || 'Untitled Service'}
                </h1>
                <p className="text-zinc-400 text-sm">
                  Order #{order.id} • Created {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
              {formatStatus(order.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Order Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <User size={16} />
                    <span>{isCreator ? 'Client' : 'Creator'}</span>
                  </div>
                  <span className="text-white font-medium">
                    {isCreator ? (order.client_name || order.client_id) : (order.creator_name || order.creator_id)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <DollarSign size={16} />
                    <span>Amount</span>
                  </div>
                  <span className="text-white font-bold text-lg">₱{parseFloat(order.price || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock size={16} />
                    <span>Payment Status</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.payment_status === 'paid' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <FileText size={16} />
                    <span>Escrow Status</span>
                  </div>
                  <span className="text-white font-medium capitalize">
                    {order.escrow_status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Partial Output */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Partial Output</h3>
              
              {order.partial_output_url || order.partial_output_note ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                  {order.partial_output_url && renderOutputLink(order.partial_output_url, 'Download partial output', `order-${order.id}-partial`)}
                  {order.partial_output_note && (
                    <p className="text-zinc-400 text-sm mt-2">{order.partial_output_note}</p>
                  )}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm mb-4">No partial output submitted yet.</p>
              )}

              {isCreator && order.status === 'accepted' && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-lg mb-4 text-sm">
                  <p className="font-medium mb-2">Start working on this order first</p>
                  <button
                    onClick={() => confirmOrderAction(
                      'Start Working?',
                      'This will change the order status to In Progress.',
                      'info',
                      () => updateOrder(id, { status: 'in_progress' }),
                      'Order status updated to In Progress!'
                    )}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    Start Working
                  </button>
                </div>
              )}

              {isCreator && ['in_progress', 'partial_submitted'].includes(order.status) && (
                <form className="space-y-3" onSubmit={handleSubmitPartial}>
                  <input
                    value={isDataUrl(partialForm.partial_output_url) ? '' : partialForm.partial_output_url}
                    onChange={e => setPartialForm(prev => ({ ...prev, partial_output_url: e.target.value }))}
                    placeholder={isDataUrl(partialForm.partial_output_url) ? 'File attached' : 'Partial output URL'}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
                  />
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white cursor-pointer transition-colors">
                    <Upload size={16} />
                    Attach File
                    <input type="file" onChange={(e) => handleOutputFileUpload('partial', e)} className="hidden" />
                  </label>
                  <textarea
                    value={partialForm.partial_output_note}
                    onChange={e => setPartialForm(prev => ({ ...prev, partial_output_note: e.target.value }))}
                    placeholder="Add notes about the partial output..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 resize-none"
                  />
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="w-full px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Submit Partial Output
                  </button>
                </form>
              )}
            </div>

            {/* Final Output */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Final Output</h3>
              
              {(order.payment_status === 'paid' || order.status === 'completed' || isCreator) ? (
                order.final_file_url || order.final_output_note ? (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                    {order.final_file_url && renderOutputLink(order.final_file_url, 'Download final output', `order-${order.id}-final`)}
                    {order.final_output_note && (
                      <p className="text-zinc-400 text-sm mt-2">{order.final_output_note}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm mb-4">No final output submitted yet.</p>
                )
              ) : (
                <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-4">
                  <Lock size={18} />
                  <span className="text-sm">Final output unlocks after payment</span>
                </div>
              )}

              {isCreator && order.status === 'in_progress' && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-lg mb-4 text-sm">
                  <p>Submit partial output first before submitting final output.</p>
                </div>
              )}

              {isCreator && ['partial_submitted', 'final_submitted', 'delivered'].includes(order.status) && (
                <form className="space-y-3" onSubmit={handleSubmitFinal}>
                  <input
                    value={isDataUrl(finalForm.final_file_url) ? '' : finalForm.final_file_url}
                    onChange={e => setFinalForm(prev => ({ ...prev, final_file_url: e.target.value }))}
                    placeholder={isDataUrl(finalForm.final_file_url) ? 'File attached' : 'Final output URL'}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
                  />
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white cursor-pointer transition-colors">
                    <Upload size={16} />
                    Attach File
                    <input type="file" onChange={(e) => handleOutputFileUpload('final', e)} className="hidden" />
                  </label>
                  <textarea
                    value={finalForm.final_output_note}
                    onChange={e => setFinalForm(prev => ({ ...prev, final_output_note: e.target.value }))}
                    placeholder="Add notes about the final output..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 resize-none"
                  />
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="w-full px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Submit Final Output
                  </button>
                </form>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Order Timeline</h3>
              <div className="space-y-4">
                {timeline.length > 0 ? (
                  timeline.map((t, idx) => (
                    <div key={t.id || idx} className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                      <div className="flex-1 pb-4 border-b border-white/5 last:border-0">
                        <h5 className="text-white font-medium capitalize mb-1">
                          {(t.event_type || 'event').replace(/_/g, ' ')}
                        </h5>
                        <p className="text-zinc-400 text-sm">
                          {t.message || '—'}
                        </p>
                        <p className="text-zinc-600 text-xs mt-1">
                          {t.timestamp ? new Date(t.timestamp).toLocaleString() : t.created_at ? new Date(t.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <h5 className="text-white font-medium mb-1">Order Created</h5>
                      <p className="text-zinc-400 text-sm">
                        {order.created_at ? new Date(order.created_at).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-3 sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              
              {/* Creator: Accept/Reject */}
              {isCreator && order.status === 'pending' && (
                <>
                  <button 
                    onClick={() => confirmOrderAction(
                      'Accept Order?', 
                      'This order will move to Accepted status.', 
                      'info', 
                      () => acceptOrder(id), 
                      'Order accepted successfully!'
                    )}
                    disabled={actionLoading}
                    className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Accept Order
                  </button>
                  <button 
                    onClick={() => confirmOrderAction(
                      'Reject Order?', 
                      'This will decline the client order.', 
                      'danger', 
                      () => rejectOrder(id, 'Rejected by creator'), 
                      'Order rejected.'
                    )}
                    disabled={actionLoading}
                    className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Reject Order
                  </button>
                </>
              )}

              {/* Client: Pay & Unlock */}
              {!isCreator && order.status === 'final_submitted' && order.payment_status !== 'paid' && (
                <button 
                  onClick={() => {
                    setConfirmModal({
                      open: true,
                      title: 'Send Payment?',
                      message: 'This unlocks the final output and completes the order.',
                      variant: 'info',
                      action: async () => {
                        setActionLoading(true);
                        try {
                          const { ok, data } = await payOrder(id);
                          console.log('Payment response:', { ok, data });
                          if (ok) {
                            // Update local state with the returned order data
                            console.log('Updating order state with:', data);
                            setOrder(data);
                            showToast('Payment sent! Final output unlocked.');
                          } else {
                            showToast(data?.detail || 'Payment failed.', 'error');
                          }
                        } catch (err) {
                          console.error('Payment error:', err);
                          showToast('Payment failed.', 'error');
                        }
                        setActionLoading(false);
                        setConfirmModal(prev => ({ ...prev, open: false }));
                      },
                    });
                  }}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  Pay & Unlock Final
                </button>
              )}

              {/* Leave/Edit Review */}
              {order.status === 'completed' && (
                <button 
                  onClick={() => setReviewOpen(true)}
                  className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Star size={16} />
                  {existingReview ? 'Edit Review' : 'Leave Review'}
                </button>
              )}

              {/* Message */}
                            <button 
                onClick={() => navigate(`/messages?to=${isCreator ? order.client_id : order.creator_id}`)}
                className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} />
                Message {isCreator ? 'Client' : 'Creator'}
              </button>

              {/* File Dispute */}
              {['pending', 'accepted', 'in_progress', 'partial_submitted', 'final_submitted', 'delivered', 'completed'].includes(order.status) && (
                <button 
                  onClick={() => setDisputeModalOpen(true)}
                  className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle size={16} />
                  File Dispute
                </button>
              )}

              {actionLoading && (
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 py-2">
                  <div className="w-3 h-3 border-2 border-zinc-500/20 border-t-zinc-500 rounded-full animate-spin"></div>
                  Processing...
                </div>
              )}
            </div>
          </div>
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
        revieweeName={isCreator ? (order.client_name || order.client_id) : (order.creator_name || order.creator_id)}
        loading={actionLoading}
        onSubmit={handleReviewSubmit}
        onClose={() => setReviewOpen(false)}
        isEdit={!!existingReview}
        initialRating={existingReview?.rating || 0}
        initialComment={existingReview?.comment || ''}
      />

      {/* Dispute Modal */}
      {disputeModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setDisputeModalOpen(false)}
        >
          <div 
            className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-lg w-full p-6" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">File Dispute</h3>
            </div>
            
            <p className="text-zinc-400 text-sm mb-4">
              Explain the issue with this order. Admin will review both sides and make a decision.
            </p>
            
            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Describe the dispute and include key details..."
                required
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 resize-none"
              />
              
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setDisputeModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={disputeLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disputeLoading ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
