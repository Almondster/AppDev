import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ORIGIN, acceptOrder, fetchOrder, updateOrder, fetchTimeline, getToken, getUserData, payOrder, rejectOrder, resolveApiUrl, submitFinalOutput, submitPartialOutput, uploadStorageFile } from '../api';
import { ArrowLeft, MessageSquare, Star, XCircle, Play, Lock, CreditCard, Upload, Download } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ReviewModal from '../components/ReviewModal';
import { createReview } from '../api';
import './OrderDetailPage.css';

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
  const canManageDueDate = userData?.role === 'creator' || userData?.role === 'admin';

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Modal states
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', variant: 'info', action: null });
  const [reviewOpen, setReviewOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [partialForm, setPartialForm] = useState({ partial_output_url: '', partial_output_note: '' });
  const [finalForm, setFinalForm] = useState({ final_file_url: '', final_output_note: '' });

  useEffect(() => {
    (async () => {
      try {
        const [oRes, tRes] = await Promise.all([
          fetchOrder(id),
          fetchTimeline(id),
        ]);
        if (oRes.ok) {
          setOrder(oRes.data);
          setDueDateInput(oRes.data.due_date ? new Date(oRes.data.due_date).toISOString().slice(0, 10) : '');
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

  const buildDueDatePayload = (dateValue) => {
    if (!dateValue) return null;
    return new Date(`${dateValue}T23:59:59`).toISOString();
  };

  const getDownloadFilename = (url, fallback) => {
    if (!url) return fallback;
    try {
      const parsedUrl = new URL(resolveApiUrl(url));
      const candidate = decodeURIComponent(parsedUrl.pathname.split('/').pop() || '');
      return candidate || fallback;
    } catch {
      return fallback;
    }
  };

  const isManagedUploadUrl = (url) => {
    if (!url) return false;
    try {
      const parsedUrl = new URL(resolveApiUrl(url));
      return parsedUrl.origin === API_ORIGIN && parsedUrl.pathname.startsWith('/uploads/');
    } catch {
      return false;
    }
  };

  const triggerDownload = (href, filename) => {
    const link = document.createElement('a');
    link.href = href;
    if (filename) link.download = filename;
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownload = async (url, fallbackFilename) => {
    const resolvedUrl = resolveApiUrl(url);
    const downloadFilename = getDownloadFilename(url, fallbackFilename);

    if (!isManagedUploadUrl(url)) {
      triggerDownload(resolvedUrl, downloadFilename);
      return;
    }

    setDownloadingUrl(resolvedUrl);
    try {
      const headers = {};
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(resolvedUrl, { headers });
      if (!response.ok) {
        throw new Error('download_failed');
      }

      const fileBlob = await response.blob();
      const objectUrl = window.URL.createObjectURL(fileBlob);
      triggerDownload(objectUrl, downloadFilename);
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      showToast('Failed to download file.');
    } finally {
      setDownloadingUrl('');
    }
  };

  const renderOutputLink = (url, label, filename) => {
    if (!url) return null;
    const resolvedUrl = resolveApiUrl(url);
    const downloadFilename = getDownloadFilename(url, filename);

    if (isManagedUploadUrl(url)) {
      return (
        <button
          type="button"
          className="od-download-link"
          onClick={() => handleDownload(url, filename)}
          disabled={downloadingUrl === resolvedUrl}
        >
          <Download size={15} />
          {downloadingUrl === resolvedUrl ? 'Downloading...' : label}
        </button>
      );
    }

    return (
      <a
        className="od-download-link"
        href={resolvedUrl}
        target="_blank"
        rel="noreferrer"
        download={downloadFilename}
      >
        <Download size={15} />
        {label}
      </a>
    );
  };

  const sanitizeFilename = (filename) => String(filename || 'upload')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const handleOutputFileUpload = async (target, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionLoading(true);
    try {
      const storagePath = `${id}/${target}/${Date.now()}-${sanitizeFilename(file.name)}`;
      const { ok, data } = await uploadStorageFile({
        bucket: 'orders',
        path: storagePath,
        body: file,
        contentType: file.type || 'application/octet-stream',
      });

      if (!ok) {
        showToast(data?.detail || 'Failed to upload attached file.');
        return;
      }

      if (target === 'partial') {
        setPartialForm((prev) => ({
          ...prev,
          partial_output_url: data.url,
          partial_output_note: prev.partial_output_note || `Attached file: ${file.name}`,
        }));
      } else {
        setFinalForm((prev) => ({
          ...prev,
          final_file_url: data.url,
          final_output_note: prev.final_output_note || `Attached file: ${file.name}`,
        }));
      }
      showToast(`${file.name} uploaded successfully.`);
    } catch {
      showToast('Failed to upload attached file.');
    } finally {
      setActionLoading(false);
      e.target.value = '';
    }
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

  const handleSaveDueDate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { ok, data } = await updateOrder(id, { due_date: buildDueDatePayload(dueDateInput) });
      if (ok) {
        setOrder(data);
        setDueDateInput(data.due_date ? new Date(data.due_date).toISOString().slice(0, 10) : '');
        showToast('Due date saved.');
      } else {
        showToast(data?.detail || 'Failed to save due date.');
      }
    } catch {
      showToast('Failed to save due date.');
    }
    setActionLoading(false);
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    setActionLoading(true);
    try {
      const { ok } = await createReview({
        order_id: order.id,
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
  const showDueDateEditor = canManageDueDate && !['pending', 'completed', 'cancelled', 'rejected', 'refunded'].includes(order.status);

  return (
    <main className="order-detail">
      <div className="od-breadcrumb">
        <span className="od-bc-muted">Orders</span>
        <span className="od-bc-sep">/</span>
        <span className="od-bc-active">{order.service_title || 'Untitled service'}</span>
      </div>

      <button className="od-back" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>

      {toast && <div className="global-toast global-toast--success">{toast}</div>}

      {/* Header */}
      <div className="od-header">
        <div>
          <h1 className="od-title">{order.service_title || 'Untitled service'}</h1>
          <p className="od-subtitle">Created {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</p>
        </div>
        <span className="od-status-badge" style={{ background: st.bg, color: st.color }}>
          {(order.status || 'pending').replace('_', ' ')}
        </span>
      </div>

      {/* Info Grid */}
      <div className="od-grid od-grid--single">
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

          {showDueDateEditor && (
            <form className="od-delivery-form" onSubmit={handleSaveDueDate}>
              <input
                type="date"
                value={dueDateInput}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDueDateInput(e.target.value)}
              />
              <button className="od-action-btn od-action-btn--outline" disabled={actionLoading || !dueDateInput}>
                Save Due Date
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="od-grid">
        <div className="od-card">
          <h4>Partial Output</h4>
          {order.partial_output_url || order.partial_output_note ? (
            <div className="od-delivery-box">
              {renderOutputLink(order.partial_output_url, 'Download partial output', `order-${order.id}-partial-output`)}
              {order.partial_output_note && <p>{order.partial_output_note}</p>}
            </div>
          ) : (
            <p className="od-muted">No partial output submitted yet.</p>
          )}

          {isCreator && ['accepted', 'partial_submitted'].includes(order.status) && (
            <form className="od-delivery-form" onSubmit={handleSubmitPartial}>
              <input
                value={partialForm.partial_output_url}
                onChange={e => setPartialForm(prev => ({ ...prev, partial_output_url: e.target.value }))}
                placeholder="Partial output link"
              />
              <label className="od-file-upload">
                <Upload size={15} />
                Attach partial file
                <input type="file" onChange={(e) => handleOutputFileUpload('partial', e)} />
              </label>
              <textarea
                value={partialForm.partial_output_note}
                onChange={e => setPartialForm(prev => ({ ...prev, partial_output_note: e.target.value }))}
                placeholder="Partial output notes"
                rows={3}
              />
              <button className="od-action-btn od-action-btn--primary" disabled={actionLoading}>Submit Partial</button>
            </form>
          )}
        </div>

        <div className="od-card">
          <h4>Final Output</h4>
          {order.payment_status === 'paid' || isCreator ? (
            order.final_file_url || order.final_output_note ? (
              <div className="od-delivery-box">
                {renderOutputLink(order.final_file_url, 'Download final output', `order-${order.id}-final-output`)}
                {order.final_output_note && <p>{order.final_output_note}</p>}
              </div>
            ) : (
              <p className="od-muted">No final output submitted yet.</p>
            )
          ) : (
            <div className="od-locked-output"><Lock size={16} /> Final output unlocks after dummy payment.</div>
          )}

          {isCreator && ['partial_submitted', 'final_submitted'].includes(order.status) && (
            <form className="od-delivery-form" onSubmit={handleSubmitFinal}>
              <input
                value={finalForm.final_file_url}
                onChange={e => setFinalForm(prev => ({ ...prev, final_file_url: e.target.value }))}
                placeholder="Final output link"
              />
              <label className="od-file-upload">
                <Upload size={15} />
                Attach downloadable final file
                <input type="file" onChange={(e) => handleOutputFileUpload('final', e)} />
              </label>
              <textarea
                value={finalForm.final_output_note}
                onChange={e => setFinalForm(prev => ({ ...prev, final_output_note: e.target.value }))}
                placeholder="Final output notes"
                rows={3}
              />
              <button className="od-action-btn od-action-btn--warning" disabled={actionLoading}>Save Final</button>
            </form>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="od-actions">
        {/* Creator actions */}
        {isCreator && order.status === 'pending' && (
          <button className="od-action-btn od-action-btn--primary" onClick={() => confirmOrderAction('Accept Order?', 'This order will move to Accepted.', 'success', () => acceptOrder(id), 'Order accepted.')}>
            <Play size={16} /> Accept
          </button>
        )}
        {isCreator && order.status === 'pending' && (
          <button className="od-action-btn od-action-btn--danger" onClick={() => confirmOrderAction('Reject Order?', 'This will decline the client order.', 'danger', () => rejectOrder(id, 'Rejected by creator.'), 'Order rejected.')}>
            <XCircle size={16} /> Reject
          </button>
        )}

        {/* Client actions */}
        {!isCreator && order.status === 'final_submitted' && order.payment_status !== 'paid' && (
          <button className="od-action-btn od-action-btn--success" onClick={() => confirmOrderAction('Send Dummy Payment?', 'This unlocks the final output and completes the order.', 'success', () => payOrder(id), 'Dummy payment sent. Final output unlocked.')}>
            <CreditCard size={16} /> Pay and Unlock Final
          </button>
        )}

        {/* Cancel (both roles, only if not completed) */}
        {!['completed', 'cancelled', 'refunded', 'rejected', 'final_submitted'].includes(order.status) && (
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
                <p>{t.message || '—'} • {t.timestamp ? new Date(t.timestamp).toLocaleString() : ''}</p>
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
