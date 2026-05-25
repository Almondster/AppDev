import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchReviews } from '../api';
import { Eye, MousePointerClick, Briefcase, DollarSign, Clock, Star } from 'lucide-react';
import { readCollection } from '../utils/collections';
import { getCurrentUserUid } from '../utils/currentUser';
import { getOrderFetcherForRole, isActiveCreatorOrderStatus } from '../utils/orders';
import './CreatorDashboardPage.css';

const sameId = (a, b) => String(a) === String(b);

const CreatorDashboardPage = () => {
    const [tab, setTab] = useState('overview');
    const [orders, setOrders] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const userUid = getCurrentUserUid();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const [oRes, rRes] = await Promise.all([
                    getOrderFetcherForRole('creator')(),
                    fetchReviews(),
                ]);
                if (oRes.ok) setOrders(readCollection(oRes));
                if (rRes.ok) {
                    const allReviews = readCollection(rRes);
                    // Filter reviews for this creator
                    setReviews(userUid ? allReviews.filter((review) => sameId(review.reviewee_id, userUid)) : allReviews);
                }
            } catch (err) {
                console.error('Failed to load dashboard:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [userUid]);

    const completed = orders.filter(o => o.status === 'completed');
    const active = orders.filter(o => o.status === 'pending' || isActiveCreatorOrderStatus(o.status));
    const revenue = completed.reduce((s, o) => s + parseFloat(o.price || 0), 0);
    const todayRevenue = completed.filter(o => {
        const d = new Date(o.updated_at || o.created_at);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    }).reduce((s, o) => s + parseFloat(o.price || 0), 0);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : '0.0';

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star key={i} size={14} fill={i < rating ? '#f59e0b' : 'transparent'} color={i < rating ? '#f59e0b' : '#52525b'} />
        ));
    };

    return (
        <main className="creator-studio">
            {/* Breadcrumb */}
            <div className="studio-breadcrumb">
                <span className="breadcrumb-muted">Creator Workspace</span>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-active">Studio</span>
            </div>

            {/* Tab Bar */}
            <div className="studio-tab-bar">
                <div className="studio-tabs">
                    <button className={`studio-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
                    <button className={`studio-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>Reviews</button>
                </div>
                <div className="studio-actions">
                    <button className="studio-btn-outline" onClick={() => navigate('/creator-profile')}>
                        <Star size={14} /> View Public Profile
                    </button>
                    <button className="studio-btn-outline" onClick={() => navigate('/my-gigs')}>
                        <Briefcase size={14} /> Manage Gigs
                    </button>
                </div>
            </div>

            {/* ─── LOADING SKELETON ─── */}
            {loading && tab === 'overview' && (
                <div className="studio-overview">
                    <div className="overview-top">
                        <div className="earnings-card" style={{ minHeight: 180 }}>
                            <div className="skeleton skeleton--light" style={{ width: 140, height: 16, marginBottom: 16 }}></div>
                            <div className="skeleton skeleton--light" style={{ height: 42, width: 200, marginBottom: 8, borderRadius: 6 }}></div>
                            <div className="skeleton skeleton--light" style={{ width: 100, height: 14, marginBottom: 20 }}></div>
                            <div className="skeleton-divider" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
                            <div className="skeleton-row" style={{ justifyContent: 'space-between', paddingTop: 8 }}>
                                <div className="skeleton-col" style={{ gap: 6 }}>
                                    <div className="skeleton skeleton--light" style={{ width: 65, height: 14 }}></div>
                                    <div className="skeleton skeleton--light" style={{ width: 50, height: 18 }}></div>
                                </div>
                                <div className="skeleton-col" style={{ gap: 6, alignItems: 'flex-end' }}>
                                    <div className="skeleton skeleton--light" style={{ width: 75, height: 14 }}></div>
                                    <div className="skeleton skeleton--light" style={{ width: 60, height: 18 }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="quick-stats">
                            {[0,1].map(i => (
                                <div key={i} className="quick-stat-card">
                                    <div className="skeleton-row">
                                        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }}></div>
                                        <div className="skeleton-col" style={{ gap: 6 }}>
                                            <div className="skeleton" style={{ width: 55, height: 22 }}></div>
                                            <div className="skeleton" style={{ width: 90, height: 14 }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="skeleton" style={{ marginTop: 24, width: 110, height: 20, marginBottom: 14 }}></div>
                    <div className="interactions-grid">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="interaction-card">
                                <div className="skeleton-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
                                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }}></div>
                                    <div className="skeleton" style={{ width: 52, height: 22, borderRadius: 6 }}></div>
                                </div>
                                <div className="skeleton" style={{ width: 65, height: 26, marginBottom: 6 }}></div>
                                <div className="skeleton" style={{ width: 55, height: 14 }}></div>
                            </div>
                        ))}
                    </div>
                    <div className="overview-bottom" style={{ marginTop: 16 }}>
                        <div className="bottom-card">
                            <div className="skeleton-row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
                                <div className="skeleton" style={{ width: 140, height: 20 }}></div>
                                <div className="skeleton" style={{ width: 60, height: 16 }}></div>
                            </div>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="skeleton-row" style={{ justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div className="skeleton" style={{ width: `${50 + i*12}%`, height: 16 }}></div>
                                    <div className="skeleton" style={{ width: 65, height: 22, borderRadius: 6 }}></div>
                                </div>
                            ))}
                        </div>
                        <div className="bottom-card">
                            <div className="skeleton" style={{ width: 150, height: 20, marginBottom: 18 }}></div>
                            <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 8 }}></div>
                        </div>
                    </div>
                </div>
            )}
            {loading && tab === 'reviews' && (
                <div className="reviews-list">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="review-card" style={{ pointerEvents: 'none' }}>
                            <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }}></div>
                            <div className="review-body" style={{ flex: 1 }}>
                                <div className="skeleton-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div className="skeleton" style={{ width: 120, height: 18 }}></div>
                                    <div className="skeleton" style={{ width: 75, height: 14 }}></div>
                                </div>
                                <div className="skeleton-row" style={{ gap: 4, marginBottom: 10 }}>
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <div key={j} className="skeleton" style={{ width: 16, height: 16, borderRadius: 3 }}></div>
                                    ))}
                                </div>
                                <div className="skeleton" style={{ width: '95%', height: 16, marginBottom: 5 }}></div>
                                <div className="skeleton" style={{ width: '70%', height: 16 }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── OVERVIEW TAB ─── */}
            {!loading && tab === 'overview' && (
                <div className="studio-overview">
                    {/* Top Row: Earnings + Quick Stats */}
                    <div className="overview-top">
                        <div className="earnings-card">
                            <div className="earnings-header">
                                <span className="earnings-label">Today's Earnings</span>
                                <span className="earnings-badge">→ +0%</span>
                            </div>
                            <p className="earnings-amount">₱{loading ? '...' : todayRevenue.toLocaleString()}</p>
                            <div className="earnings-compare">
                                <div><span className="compare-label">Yesterday</span><span className="compare-value">₱0</span></div>
                                <div><span className="compare-label">Last Month</span><span className="compare-value">₱{revenue.toLocaleString()}</span></div>
                            </div>
                        </div>
                        <div className="quick-stats">
                            <div className="quick-stat-card">
                                <Clock size={18} className="qs-icon qs-icon--blue" />
                                <div>
                                    <p className="qs-value">~1 hr</p>
                                    <p className="qs-label">Avg Response</p>
                                </div>
                            </div>
                            <div className="quick-stat-card">
                                <Star size={18} className="qs-icon qs-icon--yellow" />
                                <div>
                                    <p className="qs-value">{avgRating} <span className="qs-sub">/ 5.0</span></p>
                                    <p className="qs-label">Rating</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactions Row */}
                    <h3 className="section-label">Interactions</h3>
                    <div className="interactions-grid">
                        <div className="interaction-card">
                            <div className="ic-top"><Eye size={18} className="ic-icon ic-icon--blue" /><span className="ic-badge ic-badge--green">→ +0%</span></div>
                            <p className="ic-value">{loading ? '...' : 0}</p>
                            <p className="ic-label">Views</p>
                        </div>
                        <div className="interaction-card">
                            <div className="ic-top"><MousePointerClick size={18} className="ic-icon ic-icon--orange" /><span className="ic-badge ic-badge--green">→ +0%</span></div>
                            <p className="ic-value">{loading ? '...' : 0}</p>
                            <p className="ic-label">Clicks</p>
                        </div>
                        <div className="interaction-card">
                            <div className="ic-top"><Briefcase size={18} className="ic-icon ic-icon--red" /><span className="ic-badge ic-badge--green">→ +0%</span></div>
                            <p className="ic-value">{loading ? '...' : active.length}</p>
                            <p className="ic-label">Active Jobs</p>
                        </div>
                        <div className="interaction-card">
                            <div className="ic-top"><DollarSign size={18} className="ic-icon ic-icon--purple" /><span className="ic-badge ic-badge--green">→ +0%</span></div>
                            <p className="ic-value">₱{loading ? '...' : (revenue / 1000).toFixed(1)}k</p>
                            <p className="ic-label">Total Revenue</p>
                        </div>
                    </div>

                    {/* Bottom Row: Ongoing Projects + Revenue Analytics */}
                    <div className="overview-bottom">
                        <div className="bottom-card">
                            <div className="bottom-card-header">
                                <h3>Ongoing Projects</h3>
                                <a onClick={(e) => { e.preventDefault(); navigate('/orders'); }} href="#" className="view-all-link">View All</a>
                            </div>
                            <div className="bottom-card-body">
                                {active.length > 0 ? active.slice(0, 3).map(o => (
                                    <div key={o.id} className="ongoing-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${o.id}`)}>
                                        <span className="ongoing-title">{o.service_title || 'Untitled service'}</span>
                                        <span className="ongoing-status">{o.status?.replace('_', ' ')}</span>
                                    </div>
                                )) : (
                                    <p className="empty-text">No active projects</p>
                                )}
                            </div>
                        </div>
                        <div className="bottom-card">
                            <div className="bottom-card-header"><h3>Revenue Analytics</h3></div>
                            <div className="bottom-card-body revenue-chart">
                                <div className="chart-bar-row"><span className="chart-label">₱4</span><div className="chart-bar" style={{ width: '0%' }}></div></div>
                                <div className="chart-bar-row"><span className="chart-label">₱3</span><div className="chart-bar" style={{ width: '0%' }}></div></div>
                                <div className="chart-bar-row"><span className="chart-label">₱2</span><div className="chart-bar" style={{ width: '0%' }}></div></div>
                                <div className="chart-bar-row"><span className="chart-label">₱1</span><div className="chart-bar" style={{ width: `${Math.min(revenue / 10000 * 100, 100)}%` }}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── REVIEWS TAB ─── */}
            {!loading && tab === 'reviews' && (
                <div className="studio-reviews">
                    {reviews.length === 0 ? (
                        <p className="empty-text" style={{ marginTop: '3rem' }}>No reviews yet.</p>
                    ) : (
                        <div className="reviews-list">
                            {reviews.map(r => (
                                <div key={r.id} className="review-card">
                                    <div className="review-avatar">
                                        {r.reviewer_avatar_url ? (
                                            <img src={r.reviewer_avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                                        ) : (
                                            (r.reviewer_name || r.reviewer_id || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="review-body">
                                        <div className="review-header">
                                            <div>
                                                <h4 className="review-name">{r.reviewer_name || r.reviewer_id || 'Anonymous'}</h4>
                                                <div className="review-stars">{renderStars(r.rating || 0)}</div>
                                            </div>
                                            <span className="review-date">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                                        </div>
                                        <p className="review-comment">{r.comment || '(No comment)'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </main>
    );
};

export default CreatorDashboardPage;
