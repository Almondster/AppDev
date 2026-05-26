import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, Clock, Sparkles, Building2 } from 'lucide-react';
import { fetchMyOrders as apiFetchOrders, fetchServices, fetchCreators, createOrder, fetchReviews, fetchCategories } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import { CreatorSkeleton, ServiceSkeleton } from '../components/MarketplaceSkeletons';
import SmartMatchModal from '../components/SmartMatchModal';
import { readCollection } from '../utils/collections';
import {
    isMarketplaceCategoryVisible,
    isMarketplaceCreatorVisible,
    isMarketplaceServiceVisible,
} from '../utils/marketplaceContent';
import './ClientDashboardPage.css';

const ClientDashboardPage = () => {
    const [, setOrders] = useState([]);
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
    const [categories, setCategories] = useState([]);

    const navigate = useNavigate();

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState({ open: false, service: null });
    const [orderLoading, setOrderLoading] = useState(false);
    const [dueDateInput, setDueDateInput] = useState('');

    // Smart Match state
    const [matchModal, setMatchModal] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [oRes, sRes, cRes, rRes, catRes] = await Promise.all([
                    apiFetchOrders(), fetchServices(), fetchCreators(), fetchReviews(), fetchCategories()
                ]);
                const failedResponse = [oRes, sRes, cRes, rRes, catRes].find((response) => !response?.ok);

                if (failedResponse) {
                    setError(
                        failedResponse?.status === 401
                            ? 'Your session is no longer valid. Please sign in again.'
                            : failedResponse?.data?.detail || 'Failed to load marketplace data. Please try again.'
                    );
                }
                if (oRes.ok) setOrders(readCollection(oRes));
                if (sRes.ok) setServices(readCollection(sRes));
                if (cRes.ok) setCreators(readCollection(cRes));
                if (rRes.ok) setReviews(readCollection(rRes));
                if (catRes.ok) {
                    const catList = readCollection(catRes);
                    setCategories(
                        catList
                            .map(c => c.name || c.label || 'Other')
                            .filter(isMarketplaceCategoryVisible)
                    );
                }
            } catch (err) {
                console.error('Client dashboard error:', err);
                setError('Failed to load marketplace data. Please try again.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Safely parse skills — handles arrays, JSON, Python list strings, comma-separated, postgres text format
    const tryParseArrayString = (value) => {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    };

    const parseSkills = (raw) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            const parsedJson = tryParseArrayString(raw);
            if (parsedJson) return parsedJson;
            if (raw.startsWith('[')) {
                const parsedPythonStyle = tryParseArrayString(raw.replace(/'/g, '"'));
                if (parsedPythonStyle) return parsedPythonStyle;
            }
            const trimmed = raw.replace(/^\[|\]$|^\{|\}$/g, '').trim();
            if (!trimmed) return [];
            return trimmed.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        }
        return [];
    };

    const publicServices = services.filter(s => s.is_public !== false && isMarketplaceServiceVisible(s));

    // Build category filter list from backend data (with 'All' prepended)
    const CATEGORIES = ['All', ...categories];

    // Map old/missing categories to canonical ones based on label or category value
    const inferCategory = (svc) => {
        const cat = (svc.category || '').toLowerCase().trim();
        const label = (svc.label || '').toLowerCase().trim();
        const title = (svc.title || '').toLowerCase().trim();
        const combined = `${cat} ${label} ${title}`;

        // Check if category already matches a canonical one
        const canonical = CATEGORIES.find(c => c !== 'All' && c.toLowerCase() === cat);
        if (canonical) return canonical;

        // Map by keywords
        if (/logo|brand|illustration|design|graphic|ui\/ux|mockup|figma|print|banner|poster|flyer|social media/i.test(combined)) return 'Design & Creative';
        if (/web|app|mobile|software|develop|code|programming|support & it/i.test(combined)) return 'Development & IT';
        if (/market|seo|ads|advertising|social media market|campaign/i.test(combined)) return 'Digital Marketing';
        if (/music|audio|sing|vocal|sound|beat|podcast|mix|master/i.test(combined)) return 'Music & Audio';
        if (/video|animation|motion|edit|film|youtube|short/i.test(combined)) return 'Video & Animation';
        if (/writ|translat|copy|content|blog|article|script/i.test(combined)) return 'Writing & Translation';

        return 'Design & Creative'; // default fallback
    };

    const filteredServices = publicServices.filter(s => {
        const safe = v => (typeof v === 'string' ? v : (v ? String(v) : ''));
        const matchSearch = safe(s.title).toLowerCase().includes(searchTerm.toLowerCase()) ||
            safe(s.label).toLowerCase().includes(searchTerm.toLowerCase()) ||
            safe(s.description).toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = activeCategory === 'All' || inferCategory(s) === activeCategory;
        return matchSearch && matchCat;
    });

    // Sort services
    const sortedServices = [...filteredServices].sort((a, b) => {
        if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        return 0; // recommended = default
    });

    const safeText = (value, fallback = '') => {
        if (value === null || value === undefined || value === '') return fallback;
        return String(value);
    };

    const getCreatorUid = (creator) => creator?.user_id ?? creator?.user?.id ?? null;
    const getCreatorUser = (creator) => creator?.user || {};
    const getCreatorName = (creator) => {
        const user = getCreatorUser(creator);
        return safeText(
            user.display_name ||
            user.full_name ||
            user.username ||
            user.email ||
            creator?.display_name ||
            creator?.username,
            'Creator'
        );
    };

    const filteredCreators = creators.filter(c => {
        const skillsArr = parseSkills(c.skills);
        const creatorName = getCreatorName(c);
        if (!isMarketplaceCreatorVisible(c, skillsArr)) return false;
        return (
            safeText(creatorName).toLowerCase().includes(searchTerm.toLowerCase()) ||
            safeText(c.bio).toLowerCase().includes(searchTerm.toLowerCase()) ||
            skillsArr.some(s => safeText(s).toLowerCase().includes(searchTerm.toLowerCase()))
        );
    });

    const getCreatorReviews = (uid) => reviews.filter(r => String(r.reviewee_id) === String(uid));
    const getAvgRating = (uid) => {
        const cr = getCreatorReviews(uid);
        return cr.length > 0 ? (cr.reduce((s, r) => s + (r.rating || 0), 0) / cr.length).toFixed(1) : null;
    };

    const openOrderConfirm = (service) => {
        setConfirmModal({ open: true, service });
    };

    const buildDueDatePayload = (dateValue) => {
        if (!dateValue) return null;
        return new Date(`${dateValue}T23:59:59`).toISOString();
    };

    const handlePlaceOrder = async () => {
        const service = confirmModal.service;
        if (!service) return;
        if (!dueDateInput) {
            setOrderMsg('Please set the due date before placing the order.');
            setOrderMsgType('error');
            setTimeout(() => setOrderMsg(''), 4000);
            return;
        }
        setOrderLoading(true);
        try {
            const { ok, data } = await createOrder({
                service_id: service.id,
                due_date: buildDueDatePayload(dueDateInput),
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
        setOrderLoading(false);
        setConfirmModal({ open: false, service: null });
        setDueDateInput('');
    };

    const getInitial = (name) => safeText(name, 'U').charAt(0).toUpperCase();
    const getAvatarColor = (name) => {
        const colors = ['#6366f1', '#f97316', '#10b981', '#ef4444', '#a855f7', '#3b82f6', '#f59e0b', '#ec4899'];
        const text = safeText(name);
        let hash = 0;
        for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };


    // Get full creator object for a service
    const getCreator = (creatorId) => creators.find(cr => String(getCreatorUid(cr)) === String(creatorId) && isMarketplaceCreatorVisible(cr, parseSkills(cr.skills))) || {};

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
                    <button className="cm-hero-btn cm-hero-btn--purple" onClick={() => setMatchModal(true)}><Sparkles size={14} /> Use Smart Match</button>
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
                <button className="cm-cta-btn" onClick={() => navigate('/become-creator')}>Become a Creator</button>
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
                            sortedServices.map(svc => {
                                const creator = getCreator(svc.creator_id);
                                const user = getCreatorUser(creator);
                                const creatorName = getCreatorName(creator);
                                const rating = getAvgRating(svc.creator_id);
                                return (
                                    <div key={svc.id} className="cm-service-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/services/${svc.id}`)}>
                                        <div className="cm-service-thumb" style={{ position: 'relative', minHeight: 120 }}>
                                            {svc.image_url ? (
                                                <img src={svc.image_url} alt={svc.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, borderRadius: '10px 10px 0 0' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 32, fontWeight: 700, letterSpacing: 2 }}>
                                                    No Image
                                                </div>
                                            )}
                                            <span className="cm-service-cat" style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>{inferCategory(svc)}</span>
                                        </div>
                                        <div className="cm-service-info" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div className="cm-service-creator" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                {user.avatar_url ? (
                                                    <img className="cm-service-creator-avatar" src={user.avatar_url} alt={creatorName} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #23272f' }} />
                                                ) : (
                                                    <div className="cm-service-creator-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: getAvatarColor(creatorName), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, border: '2px solid var(--bg-secondary)' }}>
                                                        {getInitial(creatorName)}
                                                    </div>
                                                )}
                                                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{creatorName}</span>
                                            </div>
                                            <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{svc.title || svc.label}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 24 }}>
                                                {rating ? (
                                                    <>
                                                        <Star size={14} fill="#f59e0b" color="#f59e0b" style={{ marginRight: 2 }} />
                                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rating}</span>
                                                    </>
                                                ) : (
                                                    <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>No rating</span>
                                                )}
                                            </div>
                                            <div className="cm-service-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                                <span className="cm-service-delivery"><Clock size={12} /> {svc.delivery_time || 'N/A'}</span>
                                                <span className="cm-service-price">₱{parseFloat(svc.price || 0).toLocaleString()}</span>
                                            </div>
                                            <button className="cm-order-btn" style={{ marginTop: 10, padding: '8px 0', borderRadius: 6, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }} onClick={(e) => { e.stopPropagation(); openOrderConfirm(svc); }}>
                                                Order
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="cm-empty-full">{searchTerm ? 'No services match your search.' : 'No services available yet.'}</p>
                        )}
                    </div>
                </>
            )}

            {/* Confirm Order Modal */}
            <ConfirmModal
                open={confirmModal.open}
                title="Place Order?"
                message={confirmModal.service ? (
                    <>
                        <p style={{ margin: '0 0 0.9rem' }}>
                            You are about to order <strong>"{confirmModal.service.title || confirmModal.service.label}"</strong> for{' '}
                            <strong>₱{parseFloat(confirmModal.service.price || 0).toLocaleString()}</strong>.
                            Set the date you need the output delivered.
                        </p>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            <span style={{ color: '#a1a1aa', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                                Required By
                            </span>
                            <input
                                type="date"
                                value={dueDateInput}
                                min={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setDueDateInput(e.target.value)}
                                style={{ width: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: '#fff', padding: '0.7rem 0.8rem', font: 'inherit', outline: 'none' }}
                            />
                        </label>
                    </>
                ) : ''}
                variant="info"
                confirmLabel="Place Order"
                loading={orderLoading}
                onConfirm={handlePlaceOrder}
                onCancel={() => {
                    setConfirmModal({ open: false, service: null });
                    setDueDateInput('');
                }}
            />

            <SmartMatchModal isOpen={matchModal} onClose={() => setMatchModal(false)} />

            {viewMode === 'creators' && (
                <>
                {/* Top Creators Section */}
                {(() => {
                    const topCreators = filteredCreators
                        .map(c => ({ ...c, _uid: getCreatorUid(c), _name: getCreatorName(c), _rating: parseFloat(getAvgRating(getCreatorUid(c))) || 0 }))
                        .sort((a, b) => b._rating - a._rating)
                        .slice(0, 3)
                        .filter(c => c._rating > 0);

                    if (topCreators.length === 0) return null;

                    return (
                        <div style={{ marginBottom: 32 }}>
                            <h3 className="cm-section-heading">Top Creators</h3>
                            <div className="cm-creators-grid">
                                {topCreators.map(c => {
                                    const creatorUid = c._uid;
                                    const creatorName = c._name;
                                    const revCount = getCreatorReviews(creatorUid).length;
                                    const skills = parseSkills(c.skills);
                                    const user = getCreatorUser(c);
                                    return (
                                        <div key={`top-${creatorUid || c.id}`} className="cm-creator-card" style={{ cursor: 'pointer' }} onClick={() => creatorUid && navigate(`/creator-profile?uid=${creatorUid}`)}>
                                            <div className="cm-creator-header">
                                                {user.avatar_url ? (
                                                    <img className="cm-creator-avatar-lg" src={user.avatar_url} alt={creatorName} style={{ objectFit: 'cover' }} />
                                                ) : (
                                                    <div className="cm-creator-avatar-lg" style={{ background: getAvatarColor(creatorName) }}>
                                                        {getInitial(creatorName)}
                                                    </div>
                                                )}
                                                <div className="cm-creator-meta">
                                                    <h4>{creatorName}</h4>
                                                    <span className="cm-creator-location"><MapPin size={12} /> Remote</span>
                                                </div>
                                                <div className="cm-creator-rating">
                                                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                                    <span>{c._rating.toFixed(1)}</span>
                                                    <span className="cm-creator-rev-count">({revCount} reviews)</span>
                                                </div>
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
                                                    <span className="cm-creator-rate">{c.starting_price ? `₱${c.starting_price}/hr` : 'Contact'}</span>
                                                </div>
                                                <button className="cm-view-profile-btn" onClick={(e) => { e.stopPropagation(); creatorUid && navigate(`/creator-profile?uid=${creatorUid}`); }}>View Profile</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* All Creators Section */}
                <h3 className="cm-section-heading">All Creators</h3>
                <div className="cm-creators-grid">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => <CreatorSkeleton key={i} />)
                    ) : filteredCreators.length > 0 ? (
                        filteredCreators.map(c => {
                            const creatorUid = getCreatorUid(c);
                            const creatorName = getCreatorName(c);
                            const rating = getAvgRating(creatorUid);
                            const revCount = getCreatorReviews(creatorUid).length;
                            const skills = parseSkills(c.skills);
                            const user = getCreatorUser(c);
                            return (
                                <div key={creatorUid || c.id} className="cm-creator-card" style={{ cursor: 'pointer' }} onClick={() => creatorUid && navigate(`/creator-profile?uid=${creatorUid}`)}>
                                    <div className="cm-creator-header">
                                        {user.avatar_url ? (
                                            <img className="cm-creator-avatar-lg" src={user.avatar_url} alt={creatorName} style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <div className="cm-creator-avatar-lg" style={{ background: getAvatarColor(creatorName) }}>
                                                {getInitial(creatorName)}
                                            </div>
                                        )}
                                        <div className="cm-creator-meta">
                                            <h4>{creatorName}</h4>
                                            <span className="cm-creator-location"><MapPin size={12} /> Remote</span>
                                        </div>
                                        <div className="cm-creator-rating">
                                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                            <span>{rating || '0.0'}</span>
                                            <span className="cm-creator-rev-count">({revCount} reviews)</span>
                                        </div>
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
                                            <span className="cm-creator-rate">{c.starting_price ? `₱${c.starting_price}/hr` : 'Contact'}</span>
                                        </div>
                                        <button className="cm-view-profile-btn" onClick={(e) => { e.stopPropagation(); creatorUid && navigate(`/creator-profile?uid=${creatorUid}`); }}>View Profile</button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="cm-empty-full">No creators found.</p>
                    )}
                </div>
                </>
            )}
        </main>
    );
};

export default ClientDashboardPage;
