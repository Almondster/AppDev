import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchService, fetchCreators, fetchReviews, createOrder, getUserData } from '../api';
import { ArrowLeft, Star, MessageSquare, Clock, Tag } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

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

  const safeText = (value, fallback = '') => {
    if (value === undefined || value === null) return fallback;
    const text = String(value).trim();
    return text || fallback;
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handleOrder = async () => {
    setOrdering(true);
    try {
      const { ok } = await createOrder({
        service_id: Number(service.id),
        client_id: userData?.firebase_uid,
        creator_id: service.creator_id,
        service_title: service.title || service.label,
        price: service.price,
        status: 'pending',
        client_name: userData?.full_name || userData?.email,
      });
      if (ok) {
        showToast(`Order placed for "${service.title}"! Redirecting...`);
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

  const getInitial = (name) => (name || 'U').charAt(0).toUpperCase();
  const getColor = (name) => {
    const colors = ['#6366f1', '#f97316', '#10b981', '#ef4444', '#a855f7', '#3b82f6'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <Star key={i} size={14} fill={i < rating ? '#f59e0b' : 'transparent'} color={i < rating ? '#f59e0b' : '#52525b'} />
    ));

  if (loading) {
    return (
      <main className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-400">Marketplace</span>
          <span className="text-zinc-600">/</span>
          <span className="text-white">Loading...</span>
        </div>
        <div className="h-9 w-32 rounded-lg bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer"></div>
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
          <div className="h-72 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer"></div>
          <div className="p-8 space-y-4">
            <div className="h-7 w-3/5 rounded bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer"></div>
            <div className="h-4 w-11/12 rounded bg-white/5"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="p-8 max-w-6xl mx-auto space-y-6">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <p className="text-zinc-500 text-center mt-12">Service not found.</p>
      </main>
    );
  }

  const creatorUser = creator?.user || {};
  const serviceCreatorId = safeText(service.creator_id, 'Unknown creator');
  const creatorName = safeText(
    creatorUser.display_name || creatorUser.full_name || creatorUser.username || serviceCreatorId,
    'Unknown creator'
  );

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-zinc-400">Marketplace</span>
        <span className="text-zinc-600">/</span>
        <span className="text-white font-medium">{service.title || service.label}</span>
      </div>

      <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500/90 text-white px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
            {service.image_url ? (
              <img src={service.image_url} alt={service.title} className="w-full h-80 object-cover" />
            ) : (
              <div className="w-full h-80 bg-zinc-900 flex items-center justify-center text-4xl font-bold text-zinc-700">
                {getInitial(service.title)}
              </div>
            )}
            <div className="p-8 space-y-6">
              {service.category && (
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                  {service.category}
                </span>
              )}
              <h1 className="text-3xl font-bold text-white">{service.title || service.label}</h1>
              <p className="text-zinc-400 leading-relaxed">{service.description || 'No description provided.'}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Price</span>
                  <span className="block text-lg font-semibold text-white">₱{parseFloat(service.price || 0).toLocaleString()}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Delivery</span>
                  <span className="block text-lg font-semibold text-white">{service.delivery_time || '3 days'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Rating</span>
                  <span className="flex items-center gap-1.5 text-lg font-semibold text-white">
                    {avgRating ? <><Star size={14} fill="#f59e0b" color="#f59e0b" /> {avgRating}</> : <span className="text-zinc-500 text-sm">No ratings</span>}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Reviews</span>
                  <span className="block text-lg font-semibold text-white">{reviews.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-8 space-y-6">
            <h3 className="text-xl font-semibold text-white">Reviews ({reviews.length})</h3>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm shrink-0">
                      {getInitial(r.reviewer_name || r.reviewer_id)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h5 className="text-sm font-medium text-white">{r.reviewer_name || r.reviewer_id || 'Anonymous'}</h5>
                      <div className="flex gap-0.5">{renderStars(r.rating || 0)}</div>
                      <p className="text-sm text-zinc-400">{r.comment || '(No comment)'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 space-y-6 sticky top-6">
            <div className="text-center pb-6 border-b border-white/5">
              <p className="text-4xl font-bold text-white mb-2">₱{parseFloat(service.price || 0).toLocaleString()}</p>
              <p className="text-sm text-zinc-500">Starting price</p>
            </div>

            {userData?.role !== 'creator' && (
              <button className="w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors" onClick={() => setConfirmOpen(true)}>
                Order This Service
              </button>
            )}

            <button className="w-full px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 text-white font-medium flex items-center justify-center gap-2 transition-colors" onClick={() => navigate(`/messages?to=${service.creator_id}`)}>
              <MessageSquare size={16} /> Contact Creator
            </button>

            <div className="pt-6 border-t border-white/5 flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] p-3 rounded-lg transition-colors" onClick={() => navigate(`/creator-profile?uid=${service.creator_id}`)}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium shrink-0" style={{ background: getColor(creatorName) }}>
                {getInitial(creatorName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{creatorName}</div>
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  {avgRating ? (
                    <>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <span>{avgRating} ({reviews.length} reviews)</span>
                    </>
                  ) : (
                    <span>No reviews</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Place Order?"
        message={<>You are about to order <strong>"{service.title}"</strong> for <strong>₱{parseFloat(service.price || 0).toLocaleString()}</strong>. The creator will be notified and can accept your order.</>}
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
