import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Send, Star, MapPin, Clock, Sparkles, Building2, ChevronDown } from 'lucide-react';
import { fetchMyOrders as apiFetchOrders, fetchServices, fetchCreators, createOrder, getUserData, fetchReviews } from '../api';
import './ClientDashboardPage.css';

const CATEGORIES = ['All', 'Design & Creative', 'Development & IT', 'Digital Marketing', 'Music & Audio', 'Video & Animation', 'Writing & Translation'];

const ServiceSkeleton = () => (
    <div className="cm-service-card" style={{ pointerEvents: 'none' }}>
        <div className="cm-service-thumb skeleton" style={{ position: 'relative' }}>
            <div className="skeleton-badge" style={{ position: 'absolute', top: 12, right: 12, width: 72 }}></div>
        </div>
        <div className="cm-service-info">
            <div className="skeleton-row" style={{ marginBottom: 8 }}>
                <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }}></div>
                <div className="skeleton" style={{ width: 100, height: 16 }}></div>
            </div>
            <div className="skeleton" style={{ width: '92%', height: 18, marginBottom: 6 }}></div>
            <div className="skeleton" style={{ width: '70%', height: 16, marginBottom: 14 }}></div>
            <div className="skeleton-divider"></div>
            <div className="skeleton-row" style={{ justifyContent: 'space-between' }}>
                <div className="skeleton" style={{ width: 80, height: 16 }}></div>
                <div className="skeleton" style={{ width: 65, height: 22, borderRadius: 6 }}></div>
            </div>
        </div>
    </div>
);

const CreatorSkeleton = () => (
    <div className="cm-creator-card" style={{ pointerEvents: 'none' }}>
        <div className="cm-creator-header">
            <div className="skeleton skeleton-avatar--lg"></div>
            <div className="skeleton-col" style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '55%', height: 18 }}></div>
                <div className="skeleton" style={{ width: '80%', height: 14 }}></div>
                <div className="skeleton" style={{ width: '35%', height: 14 }}></div>
            </div>
            <div className="skeleton-col" style={{ flex: 0, alignItems: 'flex-end' }}>
                <div className="skeleton" style={{ width: 55, height: 18 }}></div>
                <div className="skeleton" style={{ width: 75, height: 14 }}></div>
            </div>
        </div>
        <div className="skeleton" style={{ width: '92%', height: 16, marginTop: 6 }}></div>
        <div className="skeleton" style={{ width: '70%', height: 16 }}></div>
        <div className="skeleton-row" style={{ gap: 6, marginTop: 6 }}>
            <div className="skeleton" style={{ width: 90, height: 26, borderRadius: 6 }}></div>
            <div className="skeleton" style={{ width: 110, height: 26, borderRadius: 6 }}></div>
            <div className="skeleton" style={{ width: 80, height: 26, borderRadius: 6 }}></div>
        </div>
        <div className="skeleton-divider" style={{ margin: '14px 0' }}></div>
        <div className="skeleton-row" style={{ justifyContent: 'space-between' }}>
            <div className="skeleton-col" style={{ gap: 5 }}>
                <div className="skeleton" style={{ width: 70, height: 14 }}></div>
                <div className="skeleton" style={{ width: 85, height: 20, borderRadius: 4 }}></div>
            </div>
            <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 8 }}></div>
        </div>
    </div>
);

const ClientDashboardPage = () => {
    const [orders, setOrders] = useState([]);
    const [services, setServices] = useState([]);
    const [creators, setCreators] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orderMsg, setOrderMsg] = useState('');
    const [orderMsgType, setOrderMsgType] = useState('success');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [viewMode, setViewMode] = useState('services');
    const [sortBy, setSortBy] = useState('recommended');

    const userData = getUserData();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const [oRes, sRes, cRes, rRes] = await Promise.all([apiFetchOrders(), fetchServices(), fetchCreators(), fetchReviews()]);
                if (oRes.ok) setOrders(oRes.data.results || oRes.data || []);
                if (sRes.ok) setServices(sRes.data.results || sRes.data || []);
                if (cRes.ok) setCreators(cRes.data.results || cRes.data || []);
                if (rRes.ok) setReviews(rRes.data.results || rRes.data || []);
            } catch (err) {
                console.error('Client dashboard error:', err);
                setError('Failed to load marketplace data. Please try again.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const publicServices = services.filter(s => s.is_public !== false);
    const filteredServices = publicServices.filter(s => {
        const matchSearch = (s.title || s.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = activeCategory === 'All' || (s.category || '').toLowerCase().includes(activeCategory.toLowerCase());
        return matchSearch && matchCat;
    });

    // Sort services
    const sortedServices = [...filteredServices].sort((a, b) => {
        if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        return 0; // recommended = default
    });

    const filteredCreators = creators.filter(c =>
        (c.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.bio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.skills || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getCreatorReviews = (uid) => reviews.filter(r => r.reviewee_id === uid);
    const getAvgRating = (uid) => {
        const cr = getCreatorReviews(uid);
        return cr.length > 0 ? (cr.reduce((s, r) => s + (r.rating || 0), 0) / cr.length).toFixed(1) : null;
    };

    const handlePlaceOrder = async (service) => {
        try {
            const { ok, data } = await createOrder({
                client_id: userData?.firebase_uid,
                creator_id: service.creator_id,
                service_title: service.title || service.label,
                price: service.price,
                status: 'pending',
                client_name: userData?.full_name || userData?.email,
            });
            if (ok) {
                setOrderMsg(`Order placed for "${service.title || service.label}"!`);
                setOrderMsgType('success');
                setOrders(prev => [...prev, data]);
            } else {
                setOrderMsg(data?.detail || 'Failed to place order.');
                setOrderMsgType('error');
            }
            setTimeout(() => setOrderMsg(''), 4000);
        } catch {
            setOrderMsg('Connection error. Please try again.');
            setOrderMsgType('error');
            setTimeout(() => setOrderMsg(''), 4000);
        }
    };

    const getInitial = (name) => (name || 'U').charAt(0).toUpperCase();
    const getAvatarColor = (name) => {
        const colors = ['#6366f1', '#f97316', '#10b981', '#ef4444', '#a855f7', '#3b82f6', '#f59e0b', '#ec4899'];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const getCreatorName = (creatorId) => {
        const c = creators.find(cr => cr.user_id === creatorId);
        return c?.display_name || creatorId;
    };

    return (
        <main className="client-marketplace">
            <div className="cm-breadcrumb">
                <span className="cm-bc-muted">Client Workspace</span>
                <span className="cm-bc-sep">/</span>
                <span className="cm-bc-active">Home</span>
            </div>

            {/* Hero */}
            <div className="cm-hero">
                <h1>Information at the <span>speed</span> of <em>thought.</em></h1>
                <p>Discover competent creators to hire for your next project.<br />Secure, fast, and uncompromisingly professional.</p>

                <div className="cm-hero-buttons">
                    <button className={`cm-hero-btn ${viewMode === 'services' ? 'active' : ''}`} onClick={() => { setViewMode('services'); setSearchTerm(''); }}>Find Services</button>
                    <button className={`cm-hero-btn ${viewMode === 'creators' ? 'active' : ''}`} onClick={() => { setViewMode('creators'); setSearchTerm(''); }}>Find Creators</button>
                    <button className="cm-hero-btn cm-hero-btn--purple"><Sparkles size={14} /> Use Smart Match</button>
                </div>

                <div className="cm-search-bar">
                    <Search size={16} className="cm-search-icon" />
                    <input type="text" placeholder={viewMode === 'services' ? 'Search for services (e.g. Logo Design)...' : 'Search for creators (e.g. 3D Artist)...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {orderMsg && <div className={`global-toast global-toast--${orderMsgType}`}>{orderMsg}</div>}
            {error && <div className="global-toast global-toast--error">{error}</div>}

            {/* CTA Banner */}
            <div className="cm-cta-banner">
                <div className="cm-cta-left">
                    <Building2 size={24} />
                    <div>
                        <h3>Are you a creative pro?</h3>
                        <p>Join the marketplace and start selling your services today.</p>
                    </div>
                </div>
                <button className="cm-cta-btn" onClick={() => navigate('/settings')}>Become a Creator</button>
            </div>

            {viewMode === 'services' && (
                <>
                    <div className="cm-filter-row">
                        <div className="cm-filters">
                            {CATEGORIES.map(cat => (
                                <button key={cat} className={`cm-filter-chip ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <select className="cm-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option value="recommended">Recommended</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="newest">Newest</option>
                        </select>
                    </div>

                    <div className="cm-services-grid">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => <ServiceSkeleton key={i} />)
                        ) : sortedServices.length > 0 ? (
                            sortedServices.map(svc => (
                                <div key={svc.id} className="cm-service-card" onClick={() => handlePlaceOrder(svc)}>
                                    <div className="cm-service-thumb">
                                        {svc.image && <img src={svc.image} alt={svc.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
                                        <span className="cm-service-cat">{svc.category || 'Service'}</span>
                                    </div>
                                    <div className="cm-service-info">
                                        <div className="cm-service-creator">
                                            <div className="cm-service-creator-avatar" style={{ background: getAvatarColor(getCreatorName(svc.creator_id)) }}>
                                                {getInitial(getCreatorName(svc.creator_id))}
                                            </div>
                                            <span>{getCreatorName(svc.creator_id)}</span>
                                        </div>
                                        <h4>{svc.title || svc.label}</h4>
                                        <div className="cm-service-footer">
                                            <span className="cm-service-delivery"><Clock size={12} /> {svc.delivery_time || '3 days'}</span>
                                            <span className="cm-service-price">₱{parseFloat(svc.price || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="cm-empty-full">{searchTerm ? 'No services match your search.' : 'No services available yet.'}</p>
                        )}
                    </div>
                </>
            )}

            {viewMode === 'creators' && (
                <div className="cm-creators-grid">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => <CreatorSkeleton key={i} />)
                    ) : filteredCreators.length > 0 ? (
                        filteredCreators.map(c => {
                            const rating = getAvgRating(c.user_id);
                            const revCount = getCreatorReviews(c.user_id).length;
                            const skills = c.skills || [];
                            return (
                                <div key={c.user_id} className="cm-creator-card">
                                    <div className="cm-creator-header">
                                        <div className="cm-creator-avatar-lg" style={{ background: getAvatarColor(c.display_name) }}>
                                            {getInitial(c.display_name)}
                                        </div>
                                        <div className="cm-creator-meta">
                                            <h4>{c.display_name}</h4>
                                            <p className="cm-creator-bio-short">{c.bio || c.job_title || 'Creator'}</p>
                                            <span className="cm-creator-location"><MapPin size={12} /> Remote</span>
                                        </div>
                                        {rating && (
                                            <div className="cm-creator-rating">
                                                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                                <span>{rating}</span>
                                                <span className="cm-creator-rev-count">({revCount} reviews)</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="cm-creator-bio-full">{c.bio || ''}</p>
                                    {skills.length > 0 && (
                                        <div className="cm-creator-skills">
                                            {skills.slice(0, 4).map((s, i) => <span key={i} className="cm-skill-chip">{s}</span>)}
                                        </div>
                                    )}
                                    <div className="cm-creator-footer">
                                        <div>
                                            <span className="cm-creator-rate-label">HOURLY RATE</span>
                                            <span className="cm-creator-rate">₱{c.starting_price || '500'}/hr</span>
                                        </div>
                                        <button className="cm-view-profile-btn" onClick={() => navigate(`/creator-profile?uid=${c.user_id}`)}>View Profile</button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="cm-empty-full">No creators found.</p>
                    )}
                </div>
            )}
        </main>
    );
};

export default ClientDashboardPage;
