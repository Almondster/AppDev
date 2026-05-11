import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Building2, Star, Clock, MapPin } from 'lucide-react';
import { fetchMyOrders as apiFetchOrders, fetchServices, fetchCreators, createOrder, getUserData, fetchReviews, fetchCategories } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import { CreatorOnboardingModal } from '../components/CreatorOnboardingModal';

const ClientDashboardPage = () => {
    const [services, setServices] = useState([]);
    const [creators, setCreators] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [viewMode, setViewMode] = useState('services');
    const [sortBy, setSortBy] = useState('recommended');
    const [categories, setCategories] = useState([]);
    const [orderMsg, setOrderMsg] = useState('');
    const [orderMsgType, setOrderMsgType] = useState('success');
    const [confirmModal, setConfirmModal] = useState({ open: false, service: null });
    const [orderLoading, setOrderLoading] = useState(false);
    const [creatorModalOpen, setCreatorModalOpen] = useState(false);
    const [smartMatchOpen, setSmartMatchOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const [sRes, cRes, rRes, catRes] = await Promise.all([
                    fetchServices(), fetchCreators(), fetchReviews(), fetchCategories()
                ]);
                if (sRes.ok) setServices(sRes.data.results || sRes.data || []);
                if (cRes.ok) setCreators(cRes.data.results || cRes.data || []);
                if (rRes.ok) setReviews(rRes.data.results || rRes.data || []);
                if (catRes.ok) {
                    const catList = catRes.data.results || catRes.data || [];
                    setCategories(catList.map(c => c.name || c.label || 'Other'));
                }
            } catch (err) {
                console.error('Client dashboard error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const CATEGORIES = ['All', ...categories];

    const filteredServices = services.filter(s => {
        const matchSearch = (s.title || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = activeCategory === 'All' || (s.category || 'Design & Creative') === activeCategory;
        return matchSearch && matchCat && s.is_public !== false;
    });

    const sortedServices = [...filteredServices].sort((a, b) => {
        if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
        return 0;
    });

    const openOrderConfirm = (service) => {
        setConfirmModal({ open: true, service });
    };

    const handlePlaceOrder = async () => {
        const service = confirmModal.service;
        if (!service) return;
        setOrderLoading(true);
        try {
            const { ok } = await createOrder({
                service_id: service.id,
                creator_id: Number(service.creator_id),
                service_title: service.title || service.label,
                price: Number(service.price || 0),
            });
            if (ok) {
                setOrderMsg(`Order placed for "${service.title}"!`);
                setOrderMsgType('success');
            } else {
                setOrderMsg('Failed to place order.');
                setOrderMsgType('error');
            }
            setTimeout(() => setOrderMsg(''), 4000);
        } catch {
            setOrderMsg('Connection error. Please try again.');
            setOrderMsgType('error');
            setTimeout(() => setOrderMsg(''), 4000);
        }
        setOrderLoading(false);
        setConfirmModal({ open: false, service: null });
    };

    return (
        <div className="flex-1 min-h-full overflow-y-auto">
            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-8 pb-20">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-400">Client Workspace</span>
                    <span className="text-zinc-700">/</span>
                    <span className="text-white font-semibold">Home</span>
                </div>

                {/* Hero Section */}
                <section className="relative h-[320px] rounded-2xl overflow-hidden glass-panel flex flex-col justify-center px-10 border border-white/10 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl opacity-50 transition-opacity duration-700 group-hover:opacity-70" />
                    <div className="relative z-10 max-w-2xl">
                        <h1 className="text-4xl font-semibold text-white mb-4 tracking-tight">
                            Information at the <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">speed of thought.</span>
                        </h1>
                        <p className="text-lg text-zinc-400 mb-8 font-light max-w-lg">
                            Discover competent creators to hire for your next project.
                            Secure, fast, and uncompromisingly professional.
                        </p>

                        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center">
                            <div className="bg-black/40 backdrop-blur-md p-1 rounded-lg inline-flex border border-white/10">
                                <button
                                    onClick={() => setViewMode('services')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'services' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Find Services
                                </button>
                                <button
                                    onClick={() => setViewMode('creators')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'creators' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Find Creators
                                </button>
                            </div>
                            <button 
                                onClick={() => setSmartMatchOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                <Sparkles size={14} /> Use Smart Match
                            </button>
                        </div>

                        <div className="relative max-w-md">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder={viewMode === 'services' ? 'Search for services...' : 'Search for creators...'}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                    </div>
                </section>

                {/* Toast Message */}
                {orderMsg && (
                    <div className={`fixed top-6 right-6 px-4 py-3 rounded-lg backdrop-blur-md z-50 ${
                        orderMsgType === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
                        orderMsgType === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
                        'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                    }`}>
                        {orderMsg}
                    </div>
                )}

                {/* CTA Banner */}
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <Building2 size={24} className="text-zinc-400" />
                        <div>
                            <h3 className="text-white font-semibold mb-1">Are you a creative pro?</h3>
                            <p className="text-zinc-400 text-sm">Join the marketplace and start selling your services today.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setCreatorModalOpen(true)}
                        className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 rounded-lg text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                        Become a Creator
                    </button>
                </div>

                {/* Filters */}
                {viewMode === 'services' && (
                    <>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            activeCategory === cat
                                                ? 'bg-white text-black shadow-lg'
                                                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 rounded-lg text-sm focus:outline-none focus:border-white/20"
                            >
                                <option value="recommended">Recommended</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                        </div>

                        {/* Services Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden animate-pulse">
                                        <div className="h-48 bg-white/5" />
                                        <div className="p-5 space-y-3">
                                            <div className="h-4 bg-white/5 rounded w-3/4" />
                                            <div className="h-3 bg-white/5 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))
                            ) : sortedServices.length > 0 ? (
                                sortedServices.map(svc => {
                                    // Get reviews for this service's creator
                                    const serviceReviews = reviews.filter(r => 
                                        String(r.reviewee_id) === String(svc.creator_id)
                                    );
                                    const avgRating = serviceReviews.length > 0
                                        ? (serviceReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / serviceReviews.length).toFixed(1)
                                        : null;

                                    return (
                                        <div
                                            key={svc.id}
                                            onClick={() => navigate(`/services/${svc.id}`)}
                                            className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:bg-white/[0.03] hover:border-white/20 transition-all cursor-pointer group"
                                        >
                                            <div className="h-48 bg-gradient-to-br from-purple-600/20 to-blue-600/20 relative overflow-hidden">
                                                {svc.image_url ? (
                                                    <img 
                                                        src={svc.image_url} 
                                                        alt={svc.title} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-700 text-5xl font-bold">
                                                        {(svc.title || 'S').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="absolute top-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-medium rounded-lg">
                                                    {svc.category || 'Design'}
                                                </span>
                                            </div>
                                            <div className="p-5 space-y-3">
                                                <h4 className="text-white font-semibold text-base line-clamp-2 min-h-[3rem] group-hover:text-purple-400 transition-colors">
                                                    {svc.title || 'Untitled Service'}
                                                </h4>
                                                
                                                {svc.description && (
                                                    <p className="text-sm text-zinc-500 line-clamp-2 min-h-[2.5rem]">
                                                        {svc.description}
                                                    </p>
                                                )}
                                                
                                                <div className="flex items-center gap-2 text-sm pt-2 border-t border-white/5">
                                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                    <span className="text-white font-medium">
                                                        {avgRating || 'New'}
                                                    </span>
                                                    <span className="text-zinc-600">•</span>
                                                    <span className="text-zinc-500">
                                                        {serviceReviews.length} {serviceReviews.length === 1 ? 'review' : 'reviews'}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                    <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                                                        <Clock size={14} />
                                                        <span>{svc.delivery_time || '3 days'}</span>
                                                    </div>
                                                    <span className="text-lg font-bold text-purple-400">
                                                        ₱{parseFloat(svc.price || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                                
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openOrderConfirm(svc); }}
                                                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm transition-colors mt-3"
                                                >
                                                    Order Now
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full text-center py-20">
                                    <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Search size={32} className="text-purple-400" />
                                    </div>
                                    <p className="text-zinc-400 text-lg mb-2">
                                        {searchTerm ? 'No services match your search' : 'No services available yet'}
                                    </p>
                                    <p className="text-zinc-600 text-sm">
                                        {searchTerm ? 'Try a different search term or category' : 'Check back soon for new services'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Creators Grid */}
                {viewMode === 'creators' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 animate-pulse">
                                    <div className="w-20 h-20 bg-white/5 rounded-full mx-auto mb-4" />
                                    <div className="h-4 bg-white/5 rounded w-3/4 mx-auto mb-2" />
                                    <div className="h-3 bg-white/5 rounded w-1/2 mx-auto" />
                                </div>
                            ))
                        ) : creators.length > 0 ? (
                            creators
                                .filter(c => {
                                    // FastAPI structure: creator.user.username, creator.bio
                                    const name = c.user?.username || c.username || '';
                                    const bio = c.bio || '';
                                    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                           bio.toLowerCase().includes(searchTerm.toLowerCase());
                                })
                                .map(creator => {
                                    // FastAPI returns: { id, user_id, bio, skills, experience_years, portfolio_url, user: { id, username, email, role, avatar_url } }
                                    
                                    // Get reviews for this creator (match by user_id)
                                    const creatorReviews = reviews.filter(r => 
                                        String(r.reviewee_id) === String(creator.user_id) || 
                                        String(r.reviewee_id) === String(creator.user?.id)
                                    );
                                    
                                    // Calculate average rating
                                    const avgRating = creatorReviews.length > 0
                                        ? (creatorReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / creatorReviews.length)
                                        : null;
                                    
                                    // Get display name from nested user object
                                    const displayName = creator.user?.username || 
                                                       creator.username || 
                                                       'Creator';
                                    
                                    // Get avatar from nested user object
                                    const avatarUrl = creator.user?.avatar_url || creator.avatar_url;
                                    
                                    // Get bio (truncate if too long)
                                    const jobTitle = creator.bio && creator.bio.length > 50 
                                                    ? creator.bio.substring(0, 50) + '...' 
                                                    : creator.bio || 'Creative Professional';
                                    
                                    return (
                                        <div
                                            key={creator.id}
                                            onClick={() => navigate(`/creator-profile?uid=${creator.user_id}`)}
                                            className="bg-white/[0.02] border border-white/5 hover:border-white/20 rounded-2xl p-5 transition-all cursor-pointer group text-center"
                                        >
                                            {/* Avatar with TOP badge for highly rated creators */}
                                            <div className="relative mb-3 inline-block">
                                                <div className="w-20 h-20 rounded-full border-2 border-white/10 overflow-hidden mx-auto group-hover:scale-105 transition-transform duration-300">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                                                            {displayName.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* TOP badge for creators with rating >= 4.5 and reviews >= 5 */}
                                                {avgRating && avgRating >= 4.5 && creatorReviews.length >= 5 && (
                                                    <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-[#080808] flex items-center gap-1">
                                                        <Star size={10} fill="currentColor" /> TOP
                                                    </div>
                                                )}
                                            </div>

                                            {/* Name */}
                                            <h4 className="text-base font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">
                                                {displayName}
                                            </h4>
                                            
                                            {/* Bio */}
                                            <p className="text-xs text-zinc-500 line-clamp-1 mb-3">{jobTitle}</p>

                                            {/* Rating and Reviews */}
                                            <div className="flex items-center justify-center gap-3 text-xs text-zinc-400 mb-4 w-full border-t border-white/5 pt-3">
                                                <span className="flex items-center gap-1">
                                                    <Star size={10} className="text-amber-400" fill="currentColor" />
                                                    {avgRating != null ? avgRating.toFixed(1) : 'New'}
                                                </span>
                                                <span>{creatorReviews.length} {creatorReviews.length === 1 ? 'review' : 'reviews'}</span>
                                            </div>

                                            {/* View Portfolio Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/creator-profile?uid=${creator.user_id}`); }}
                                                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-semibold text-xs transition-colors"
                                            >
                                                View Portfolio
                                            </button>
                                        </div>
                                    );
                                })
                        ) : (
                            <div className="col-span-full text-center py-20 text-zinc-500">
                                {searchTerm ? 'No creators match your search.' : 'No creators available yet.'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <ConfirmModal
                open={confirmModal.open}
                title="Place Order?"
                message={confirmModal.service ? `You are about to order "${confirmModal.service.title}" for ₱${parseFloat(confirmModal.service.price || 0).toLocaleString()}.` : ''}
                variant="info"
                confirmLabel="Place Order"
                loading={orderLoading}
                onConfirm={handlePlaceOrder}
                onCancel={() => setConfirmModal({ open: false, service: null })}
            />

            <CreatorOnboardingModal
                isOpen={creatorModalOpen}
                onClose={() => setCreatorModalOpen(false)}
                onComplete={() => {
                    setCreatorModalOpen(false);
                    setOrderMsg('Creator application submitted!');
                    setOrderMsgType('success');
                    setTimeout(() => setOrderMsg(''), 4000);
                }}
            />

            {/* Smart Match Modal */}
            {smartMatchOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSmartMatchOpen(false)}>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-2xl w-full p-8" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Sparkles size={24} className="text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">Smart Match AI</h3>
                                <p className="text-zinc-400 text-sm">Find the perfect creator for your project</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Project Description</label>
                                <textarea
                                    placeholder="Describe your project requirements..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Budget Range</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="number"
                                        placeholder="Min (₱)"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max (₱)"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
                                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/20">
                                    <option value="">Select a category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSmartMatchOpen(false)}
                                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setSmartMatchOpen(false);
                                    setOrderMsg('Smart Match is analyzing your requirements...');
                                    setOrderMsgType('info');
                                    setTimeout(() => {
                                        setOrderMsg('3 perfect matches found! Check your notifications.');
                                        setOrderMsgType('success');
                                    }, 2000);
                                    setTimeout(() => setOrderMsg(''), 6000);
                                }}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                            >
                                Find Matches
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboardPage;
