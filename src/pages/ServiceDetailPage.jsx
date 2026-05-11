import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchService, fetchCreators, fetchReviews, createOrder, getUserData } from '../api';
import { ArrowLeft, Star, MessageSquare, Clock, Package, Shield, Award } from 'lucide-react';
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
  const [toast, setToast] = useState(null);

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

  const showToast = (msg, type = 'success') => { 
    setToast({ msg, type }); 
    setTimeout(() => setToast(null), 4000); 
  };

  const handleOrder = async () => {
    setOrdering(true);
    try {
      const { ok } = await createOrder({
        service_id: Number(service.id),
        client_id: userData?.firebase_uid || userData?.id,
        creator_id: service.creator_id,
        service_title: service.title || service.label,
        price: service.price,
        status: 'pending',
        client_name: userData?.full_name || userData?.username || userData?.email,
      });
      if (ok) {
        showToast(`Order placed for "${service.title}"! Redirecting...`, 'success');
        setTimeout(() => navigate('/projects'), 1500);
      } else {
        showToast('Failed to place order.', 'error');
      }
    } catch (err) {
      console.error('Order error:', err);
      showToast('Connection error.', 'error');
    }
    setOrdering(false);
    setConfirmOpen(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={14} 
        fill={i < rating ? '#fbbf24' : 'transparent'} 
        className={i < rating ? 'text-yellow-400' : 'text-zinc-700'} 
      />
    ));

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm mb-6">
            <span className="text-zinc-400">Marketplace</span>
            <span className="text-zinc-700">/</span>
            <span className="text-white">Loading...</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                <div className="h-96 bg-white/5 animate-pulse" />
                <div className="p-8 space-y-4">
                  <div className="h-8 bg-white/5 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
                  <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                <div className="h-12 bg-white/5 rounded animate-pulse mb-4" />
                <div className="h-10 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
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
            <p className="text-zinc-500 text-lg">Service not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const creatorUser = creator?.user || {};
  const creatorName = creatorUser.username || creator?.username || 'Unknown Creator';
  const creatorAvatar = creatorUser.avatar_url || creator?.avatar_url;

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
          <span className="text-zinc-400">Marketplace</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-400">{service.category || 'Services'}</span>
          <span className="text-zinc-700">/</span>
          <span className="text-white font-medium">{service.title || service.label}</span>
        </div>

        {/* Back Button */}
        <button 
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors mb-6" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} /> Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              {/* Image */}
              <div className="relative h-96 bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                {service.image_url ? (
                  <img 
                    src={service.image_url} 
                    alt={service.title} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700 text-6xl font-bold">
                    {(service.title || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Category Badge */}
                {service.category && (
                  <div className="absolute top-4 left-4 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg">
                    <span className="text-white text-sm font-medium">{service.category}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-3">{service.title || service.label}</h1>
                  <p className="text-zinc-400 leading-relaxed text-base">
                    {service.description || 'No description provided for this service.'}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/5">
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package size={16} className="text-purple-400" />
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Price</span>
                    </div>
                    <span className="text-xl font-bold text-white">₱{parseFloat(service.price || 0).toLocaleString()}</span>
                  </div>
                  
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-blue-400" />
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Delivery</span>
                    </div>
                    <span className="text-xl font-bold text-white">{service.delivery_time || '3 days'}</span>
                  </div>
                  
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={16} className="text-yellow-400" />
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Rating</span>
                    </div>
                    {avgRating ? (
                      <span className="text-xl font-bold text-white">{avgRating}</span>
                    ) : (
                      <span className="text-sm text-zinc-500">No ratings</span>
                    )}
                  </div>
                  
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award size={16} className="text-green-400" />
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Reviews</span>
                    </div>
                    <span className="text-xl font-bold text-white">{reviews.length}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">What's Included</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Shield size={16} className="text-green-400" />
                      <span className="text-sm">Secure payment</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Clock size={16} className="text-blue-400" />
                      <span className="text-sm">On-time delivery</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <MessageSquare size={16} className="text-purple-400" />
                      <span className="text-sm">Direct communication</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Award size={16} className="text-yellow-400" />
                      <span className="text-sm">Quality guaranteed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-white mb-6">
                Customer Reviews ({reviews.length})
              </h3>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {String(r.reviewer_name || r.reviewer_id || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-white">
                              {r.reviewer_name || 'Anonymous'}
                            </h5>
                            <span className="text-xs text-zinc-500">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <div className="flex gap-0.5">{renderStars(r.rating || 0)}</div>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            {r.comment || 'No comment provided.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                    <Star size={24} className="text-zinc-600" />
                  </div>
                  <p className="text-zinc-500">No reviews yet. Be the first to order!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6 sticky top-6">
              <div className="text-center pb-6 border-b border-white/5">
                <p className="text-4xl font-bold text-white mb-2">
                  ₱{parseFloat(service.price || 0).toLocaleString()}
                </p>
                <p className="text-sm text-zinc-500">Starting price</p>
              </div>

              {userData?.role !== 'creator' && (
                <button 
                  className="w-full px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors flex items-center justify-center gap-2" 
                  onClick={() => setConfirmOpen(true)}
                >
                  <Package size={18} />
                  Order This Service
                </button>
              )}

              <button 
                className="w-full px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 text-white font-medium flex items-center justify-center gap-2 transition-colors" 
                onClick={() => navigate(`/messages?to=${service.creator_id}`)}
              >
                <MessageSquare size={18} />
                Contact Creator
              </button>
            </div>

            {/* Creator Card */}
            <div 
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 cursor-pointer hover:bg-white/[0.03] transition-colors"
              onClick={() => navigate(`/creator-profile?uid=${service.creator_id}`)}
            >
              <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                About the Creator
              </h4>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full border-2 border-white/10 overflow-hidden shrink-0">
                  {creatorAvatar ? (
                    <img src={creatorAvatar} alt={creatorName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                      {creatorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h5 className="text-base font-semibold text-white truncate mb-1">
                    {creatorName}
                  </h5>
                  <div className="flex items-center gap-1 text-sm text-zinc-400">
                    {avgRating ? (
                      <>
                        <Star size={14} fill="#fbbf24" className="text-yellow-400" />
                        <span>{avgRating}</span>
                        <span className="text-zinc-600">•</span>
                        <span>{reviews.length} reviews</span>
                      </>
                    ) : (
                      <span>New creator</span>
                    )}
                  </div>
                </div>
              </div>

              {creator?.bio && (
                <p className="text-sm text-zinc-400 line-clamp-3 mb-4">
                  {creator.bio}
                </p>
              )}

              <button className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium transition-colors">
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Place Order?"
        message={
          <>
            You are about to order <strong className="text-white">"{service.title}"</strong> for{' '}
            <strong className="text-white">₱{parseFloat(service.price || 0).toLocaleString()}</strong>. 
            The creator will be notified and can accept your order.
          </>
        }
        variant="info"
        confirmLabel="Place Order"
        loading={ordering}
        onConfirm={handleOrder}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default ServiceDetailPage;
