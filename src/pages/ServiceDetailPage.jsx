import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchService, fetchCreators, fetchReviews, createOrder, getUserData } from '../api';
import { ArrowLeft, Star, MessageSquare, Clock, Tag } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import './ServiceDetailPage.css';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userData = getUserData();

  const [service, setService] = useState(null);
  const [creator, setCreator] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [sRes, cRes, rRes] = await Promise.all([
          fetchService(id),
          fetchCreators(),
          fetchReviews(),
        ]);
        if (sRes.ok) {
          setService(sRes.data);
          // Find creator
          if (cRes.ok) {
            const creators = cRes.data.results || cRes.data || [];
            setCreator(creators.find(c => c.user_id === sRes.data.creator_id) || null);
          }
          // Filter reviews for this creator
          if (rRes.ok) {
            const allReviews = rRes.data.results || rRes.data || [];
            setReviews(allReviews.filter(r => r.reviewee_id === sRes.data.creator_id));
          }
        }
      } catch (err) {
        console.error('Failed to load service:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const safeText = (value, fallback = '') => {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
  };

  const handleOrder = async () => {
    setOrdering(true);
    try {
      const { ok } = await createOrder({
        service_id: service.id,
      });
      if (ok) {
        showToast(`Order placed for "${safeText(service.title || service.label, 'Untitled service')}"! Redirecting...`);
        setTimeout(() => navigate('/projects'), 1500);
      } else {
        showToast('Failed to place order.');
      }
    } catch {
      showToast('Connection error.');
    }
    setOrdering(false);
    setConfirmOpen(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const getInitial = (name) => safeText(name, 'U').charAt(0).toUpperCase();
  const getColor = (name) => {
    const colors = ['#6366f1', '#f97316', '#10b981', '#ef4444', '#a855f7', '#3b82f6'];
    const text = safeText(name);
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <Star key={i} size={14} fill={i < rating ? '#f59e0b' : 'transparent'} color={i < rating ? '#f59e0b' : '#52525b'} />
    ));

  if (loading) {
    return (
      <main className="service-detail">
        <div className="sd-breadcrumb"><span>Marketplace</span><span className="sd-bc-sep">/</span><span className="sd-bc-active">Loading...</span></div>
        <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 10, marginBottom: 16 }}></div>
        <div className="sd-hero"><div className="skeleton" style={{ height: 280 }}></div><div style={{ padding: '1.5rem 2rem' }}><div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 10 }}></div><div className="skeleton" style={{ height: 16, width: '90%' }}></div></div></div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="service-detail">
        <button className="sd-back" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <p style={{ color: '#71717a', textAlign: 'center', marginTop: '3rem' }}>Service not found.</p>
      </main>
    );
  }

  const creatorUser = creator?.user || {};
  const serviceTitle = safeText(service.title || service.label, 'Untitled service');
  const serviceCreatorId = safeText(service.creator_id, 'Unknown creator');
  const creatorName = safeText(creatorUser.display_name || creatorUser.full_name || serviceCreatorId, 'Unknown creator');

  return (
    <main className="service-detail">
      <div className="sd-breadcrumb">
        <span>Marketplace</span>
        <span className="sd-bc-sep">/</span>
        <span className="sd-bc-active">{serviceTitle}</span>
      </div>

      <button className="sd-back" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>

      {toast && <div className="global-toast global-toast--success">{toast}</div>}

      <div className="sd-layout">
        {/* Main Content */}
        <div>
          <div className="sd-hero">
            {service.image_url ? (
              <img src={service.image_url} alt={serviceTitle} className="sd-hero-image" />
            ) : (
              <div className="sd-hero-placeholder">{getInitial(serviceTitle)}</div>
            )}
            <div className="sd-hero-body">
              {service.category && <span className="sd-category-chip">{service.category}</span>}
              <h1 className="sd-title">{serviceTitle}</h1>
              <p className="sd-description">{service.description || 'No description provided.'}</p>

              <div className="sd-meta-row">
                <div className="sd-meta-item">
                  <span className="sd-meta-label">Price</span>
                  <span className="sd-meta-value">₱{parseFloat(service.price || 0).toLocaleString()}</span>
                </div>
                <div className="sd-meta-item">
                  <span className="sd-meta-label">Delivery</span>
                  <span className="sd-meta-value">{service.delivery_time || '3 days'}</span>
                </div>
                <div className="sd-meta-item">
                  <span className="sd-meta-label">Rating</span>
                  <span className="sd-meta-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {avgRating ? <><Star size={14} fill="#f59e0b" color="#f59e0b" /> {avgRating}</> : 'No ratings'}
                  </span>
                </div>
                <div className="sd-meta-item">
                  <span className="sd-meta-label">Reviews</span>
                  <span className="sd-meta-value">{reviews.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="od-card sd-reviews-section" style={{ marginTop: '1.5rem' }}>
            <h3>Reviews ({reviews.length})</h3>
            {reviews.length > 0 ? reviews.map(r => (
              <div key={r.id} className="sd-review-item">
                <div className="sd-review-avatar">{getInitial(r.reviewer_name || r.reviewer_id)}</div>
                <div className="sd-review-body">
                  <h5>{r.reviewer_name || r.reviewer_id || 'Anonymous'}</h5>
                  <div className="sd-review-stars">{renderStars(r.rating || 0)}</div>
                  <p>{r.comment || '(No comment)'}</p>
                </div>
              </div>
            )) : (
              <p style={{ color: '#52525b', fontSize: '0.9rem' }}>No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="sd-sidebar-card">
            <p className="sd-price-display">₱{parseFloat(service.price || 0).toLocaleString()}</p>
            <p className="sd-price-label">Starting price</p>

            {userData?.role !== 'creator' && (
              <button className="sd-order-btn" onClick={() => setConfirmOpen(true)}>
                Order This Service
              </button>
            )}

            <button className="sd-message-btn" onClick={() => navigate(`/messages?to=${serviceCreatorId}`)}>
              <MessageSquare size={16} /> Contact Creator
            </button>

            <div className="sd-creator-info" onClick={() => navigate(`/creator-profile?uid=${serviceCreatorId}`)}>
              <div className="sd-creator-avatar" style={{ background: getColor(creatorName) }}>
                {getInitial(creatorName)}
              </div>
              <div>
                <div className="sd-creator-name">{creatorName}</div>
                <div className="sd-creator-rating">
                  {avgRating ? <><Star size={12} fill="#f59e0b" color="#f59e0b" /> {avgRating} ({reviews.length} reviews)</> : 'No reviews'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Place Order?"
        message={<>You are about to order <strong>"{serviceTitle}"</strong> for <strong>₱{parseFloat(service.price || 0).toLocaleString()}</strong>. The creator will be notified and can accept your order.</>}
        variant="info"
        confirmLabel="Place Order"
        loading={ordering}
        onConfirm={handleOrder}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
};

export default ServiceDetailPage;
