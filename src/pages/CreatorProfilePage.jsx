import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchCreatorByUid, fetchServices, fetchReviews, fetchFollows, fetchBlocks, getUserData, createFollow, deleteFollow, createBlock, deleteBlock, createReport, createOrder, fetchUsers } from '../api';
import { ArrowLeft, MapPin, Star, MessageSquare, UserPlus, UserMinus, ShieldBan, Flag } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import './CreatorProfilePage.css';


const CreatorProfilePage = () => {
    const [creator, setCreator] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [services, setServices] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [followers, setFollowers] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followId, setFollowId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileTab, setProfileTab] = useState('services');
    const [confirmModal, setConfirmModal] = useState({ open: false, service: null });
    const [orderLoading, setOrderLoading] = useState(false);
    const [toast, setToast] = useState('');

    // Block & Report state
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockId, setBlockId] = useState(null);
    const [reportModal, setReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reporting, setReporting] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const userData = getUserData();
    const profileUid = searchParams.get('uid') || userData?.firebase_uid;
    const isOwnProfile = String(profileUid) === String(userData?.firebase_uid);
    const sameId = (a, b) => String(a) === String(b);
    const safeText = (value, fallback = '') => {
        if (value === null || value === undefined || value === '') return fallback;
        return String(value);
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [cRes, sRes, rRes, fRes, uRes] = await Promise.all([
                    fetchCreatorByUid(profileUid),
                    fetchServices(),
                    fetchReviews(),
                    fetchFollows(),
                    fetchUsers(),
                ]);

                if (cRes.ok) {
                    setCreator(cRes.data || null);
                }
                // Always try to find the user record as fallback
                if (uRes.ok) {
                    const users = uRes.data.results || uRes.data || [];
                    const foundUser = users.find(u => sameId(u.firebase_uid ?? u.id, profileUid));
                    if (foundUser) setUserProfile(foundUser);
                }
                if (sRes.ok) {
                    const allServices = sRes.data.results || sRes.data || [];
                    setServices(allServices.filter(s => sameId(s.creator_id, profileUid)));
                }
                if (rRes.ok) {
                    const allReviews = rRes.data.results || rRes.data || [];
                    setReviews(allReviews.filter(r => sameId(r.reviewee_id, profileUid)));
                }
                if (fRes.ok) {
                    const allFollows = fRes.data.results || fRes.data || [];
                    setFollowers(allFollows.filter(f => sameId(f.following_id, profileUid)).length);
                    const myFollow = allFollows.find(f => sameId(f.follower_id, userData?.firebase_uid) && sameId(f.following_id, profileUid));
                    if (myFollow) {
                        setIsFollowing(true);
                        setFollowId(myFollow.id);
                    } else {
                        setIsFollowing(false);
                        setFollowId(null);
                    }
                }

                // Check block status
                const bRes = await fetchBlocks();
                if (bRes.ok) {
                    const allBlocks = bRes.data.results || bRes.data || [];
                    const myBlock = allBlocks.find(b => b.blocker_id === userData?.firebase_uid && b.blocked_id === profileUid);
                    if (myBlock) {
                        setIsBlocked(true);
                        setBlockId(myBlock.id);
                    }
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [profileUid]);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : '5';

    // Safely parse skills — handles arrays, JSON, Python list strings, comma-separated, postgres text format
    const parseSkills = (raw) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            // Try JSON parse (handles ["a","b"])
            try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } catch (err) { console.error('Failed to parse skills JSON:', err); }
            // Handle Python-style list: ['a', 'b'] → convert single quotes to double quotes
            if (raw.startsWith('[')) {
                try { const parsed = JSON.parse(raw.replace(/'/g, '"')); if (Array.isArray(parsed)) return parsed; } catch (err) { console.error('Failed to parse skills Python list:', err); }
            }
            // Handle postgres text array format: {a,b,c}
            const trimmed = raw.replace(/^\[|\]$|^\{|\}$/g, '').trim();
            if (!trimmed) return [];
            return trimmed.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        }
        return [];
    };
    const skills = parseSkills(creator?.skills) || parseSkills(creator?.custom_skills) || [];
    const completedJobs = 0;

    // Use creator.user OR the fetched userProfile as fallback
    const creatorUser = creator?.user || userProfile || {};
    const displayName = safeText(
        creatorUser.display_name ||
        creatorUser.full_name ||
        creatorUser.username ||
        creatorUser.email ||
        creator?.display_name ||
        creator?.username,
        'Creator'
    );
    const avatarUrl = creatorUser.avatar_url || null;
    const userRole = creatorUser.role || userProfile?.role || (creator ? 'creator' : 'client');

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    const handleFollow = async () => {
        if (isFollowing && followId) {
            try {
                await deleteFollow(followId);
                setIsFollowing(false);
                setFollowId(null);
                setFollowers(prev => Math.max(0, prev - 1));
                showToast('Unfollowed');
            } catch { showToast('Failed to unfollow.'); }
        } else {
            try {
                const { ok, data } = await createFollow({
                    follower_id: userData?.firebase_uid,
                    following_id: profileUid,
                });
                if (ok) {
                    setIsFollowing(true);
                    setFollowId(data.id);
                    setFollowers(prev => prev + 1);
                    showToast('Following!');
                }
            } catch { showToast('Failed to follow.'); }
        }
    };

    const handleBlock = async () => {
        if (isBlocked && blockId) {
            try {
                await deleteBlock(blockId);
                setIsBlocked(false);
                setBlockId(null);
                showToast('User unblocked');
            } catch { showToast('Failed to unblock.'); }
        } else {
            try {
                const { ok, data } = await createBlock({ blocker_id: userData?.firebase_uid, blocked_id: profileUid });
                if (ok) { setIsBlocked(true); setBlockId(data.id); showToast('User blocked'); }
            } catch { showToast('Failed to block.'); }
        }
    };

    const handleReport = async (e) => {
        e.preventDefault();
        if (!reportReason.trim()) return;
        setReporting(true);
        try {
            const { ok } = await createReport({ reporter_id: userData?.firebase_uid, reported_id: profileUid, reason: reportReason });
            if (ok) { showToast('Report submitted. Our team will review it.'); setReportModal(false); setReportReason(''); }
            else showToast('Failed to submit report.');
        } catch { showToast('Connection error.'); }
        setReporting(false);
    };

    const handleOrderService = async () => {
        const service = confirmModal.service;
        if (!service) return;
        setOrderLoading(true);
        try {
            const { ok } = await createOrder({
                service_id: service.id,
            });
            if (ok) {
                showToast(`Order placed for "${service.title}"!`);
            } else {
                showToast('Failed to place order.');
            }
        } catch { showToast('Connection error.'); }
        setOrderLoading(false);
        setConfirmModal({ open: false, service: null });
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star key={i} size={14} fill={i < rating ? '#f59e0b' : 'transparent'} color={i < rating ? '#f59e0b' : '#52525b'} />
        ));
    };

    // Helper to render the profile sidebar card (reused for both creator and non-creator)
    const renderProfileCard = (showCreatorStats) => (
        <div className="cp-profile-card">
            <div className="cp-avatar">
                {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" />
                ) : (
                    <div className="cp-avatar-placeholder">
                        {safeText(displayName, 'U').charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <h2 className="cp-name">{displayName}</h2>
            <p className="cp-role" style={{ textTransform: 'capitalize' }}>{showCreatorStats ? (creator?.job_title || 'Creator') : userRole}</p>
            <p className="cp-location"><MapPin size={14} /> Remote</p>

            <div className="cp-stats-row">
                <div className="cp-stat">
                    <span className="cp-stat-value">{followers}</span>
                    <span className="cp-stat-label">FOLLOWERS</span>
                </div>
                {showCreatorStats && (
                    <div className="cp-stat">
                        <span className="cp-stat-value">{avgRating} <Star size={12} fill="#f59e0b" color="#f59e0b" /></span>
                        <span className="cp-stat-label">RATING</span>
                    </div>
                )}
            </div>

            {!isOwnProfile && (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: 16 }}>
                    <button
                        className="cp-cover-btn"
                        style={{ background: isFollowing ? 'rgba(239,68,68,0.15)' : '#6366f1', color: isFollowing ? '#f87171' : '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={handleFollow}
                    >
                        {isFollowing ? <><UserMinus size={14} /> Unfollow</> : <><UserPlus size={14} /> Follow</>}
                    </button>
                    <button
                        className="cp-cover-btn"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => navigate(`/messages?to=${profileUid}`)}
                    >
                        <MessageSquare size={14} /> Message
                    </button>
                    <button
                        className="cp-cover-btn"
                        style={{ background: isBlocked ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 6, color: isBlocked ? '#f87171' : 'inherit' }}
                        onClick={handleBlock}
                    >
                        <ShieldBan size={14} /> {isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                        className="cp-cover-btn"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: 6, color: '#f87171' }}
                        onClick={() => setReportModal(true)}
                    >
                        <Flag size={14} /> Report
                    </button>
                </div>
            )}
            {isOwnProfile && (
                <button className="cp-cover-btn" style={{ marginTop: 16 }} onClick={() => navigate('/settings')}>Edit Profile</button>
            )}
        </div>
    );

    return (
        <section className="creator-profile-page">
            {/* Breadcrumb */}
            <div className="cp-breadcrumb">
                <span className="cp-breadcrumb-muted">{userData?.role === 'client' ? 'Client Workspace' : 'Creator Workspace'}</span>
                <span className="cp-breadcrumb-sep">/</span>
                <span className="cp-breadcrumb-active">Profile</span>
            </div>

            {/* Back Button */}
            <button className="cp-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
            </button>

            {toast && <div className="global-toast global-toast--success">{toast}</div>}

            {loading ? (
                <>
                    {/* Skeleton Cover */}
                    <div className="cp-cover"><div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }}></div></div>
                    <div className="cp-layout">
                        <div className="cp-sidebar">
                            <div className="cp-profile-card">
                                <div className="skeleton" style={{ width: 90, height: 90, borderRadius: '50%', margin: '-45px auto 12px' }}></div>
                                <div className="skeleton" style={{ width: '55%', height: 22, margin: '0 auto 8px' }}></div>
                                <div className="skeleton" style={{ width: '30%', height: 16, margin: '0 auto 6px' }}></div>
                                <div className="skeleton" style={{ width: '40%', height: 14, margin: '0 auto 18px' }}></div>
                            </div>
                        </div>
                        <div className="cp-main">
                            <div className="skeleton" style={{ height: 200, borderRadius: 12 }}></div>
                        </div>
                    </div>
                </>
            ) : !creator && !isOwnProfile ? (
                /* ── Non-creator user fallback ── */
                <>
                    <div className="cp-cover"><div className="cp-cover-gradient"></div></div>
                    <div className="cp-layout">
                        <div className="cp-sidebar">
                            {renderProfileCard(false)}
                        </div>
                        <div className="cp-main">
                            <div className="cp-about">
                                <h3>About</h3>
                                <p style={{ color: '#71717a' }}>This user hasn't set up a creator profile yet.</p>
                            </div>
                            {reviews.length > 0 && (
                                <div className="cp-tab-content" style={{ marginTop: '1.5rem' }}>
                                    <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Reviews</h3>
                                    <div className="cp-reviews-list">
                                        {reviews.map(r => (
                                            <div key={r.id} className="cp-review-item">
                                                <div className="cp-review-avatar">{(r.reviewer_name || r.reviewer_id || 'U').charAt(0).toUpperCase()}</div>
                                                <div className="cp-review-body">
                                                    <div className="cp-review-top">
                                                        <div>
                                                            <h4>{r.reviewer_name || r.reviewer_id || 'Anonymous'}</h4>
                                                            <div className="cp-review-stars">{renderStars(r.rating || 0)}</div>
                                                        </div>
                                                        <span className="cp-review-date">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                                                    </div>
                                                    <p>{r.comment || '(No comment)'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                /* ── Full creator profile ── */
                <>
                    <div className="cp-cover"><div className="cp-cover-gradient"></div></div>
                    <div className="cp-layout">
                        <div className="cp-sidebar">
                            {renderProfileCard(true)}

                            {/* Stats Card */}
                            <div className="cp-info-card">
                                <h3>STATS</h3>
                                <div className="cp-info-row">
                                    <span>Response Time</span>
                                    <span className="cp-info-val">{creator?.response_time || '1 hour'}</span>
                                </div>
                                <div className="cp-info-row">
                                    <span>Completed Jobs</span>
                                    <span className="cp-info-val">{completedJobs}</span>
                                </div>
                                <div className="cp-info-row">
                                    <span>Hourly Rate</span>
                                    <span className="cp-info-val">₱{creator?.starting_price || '500'}/hr</span>
                                </div>
                            </div>

                            {/* Skills Card */}
                            <div className="cp-info-card">
                                <h3>SKILLS</h3>
                                <div className="cp-skills">
                                    {skills.length > 0 ? skills.map((s, i) => (
                                        <span key={i} className="cp-skill-tag">{s}</span>
                                    )) : (
                                        <p style={{ color: '#52525b', fontSize: '0.85rem', margin: 0 }}>No skills added yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Content */}
                        <div className="cp-main">
                            <div className="cp-about">
                                <h3>About</h3>
                                <p>{creator?.bio || 'No bio provided yet.'}</p>
                            </div>

                            <div className="cp-tabs">
                                <button className={`cp-tab ${profileTab === 'services' ? 'active' : ''}`} onClick={() => setProfileTab('services')}>Services</button>
                                <button className={`cp-tab ${profileTab === 'reviews' ? 'active' : ''}`} onClick={() => setProfileTab('reviews')}>Reviews</button>
                            </div>

                            {profileTab === 'services' && (
                                <div className="cp-tab-content">
                                    {services.length > 0 ? (
                                        <div className="cp-services-list">
                                            {services.map(svc => (
                                                <div key={svc.id} className="cp-service-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/services/${svc.id}`)}>
                                                    <div>
                                                        <h4>{svc.title || svc.label}</h4>
                                                        {svc.description && <p>{svc.description}</p>}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span className="cp-service-price">₱{parseFloat(svc.price || 0).toLocaleString()}</span>
                                                        {!isOwnProfile && userData?.role !== 'creator' && (
                                                            <button
                                                                style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                                                onClick={(e) => { e.stopPropagation(); setConfirmModal({ open: true, service: svc }); }}
                                                            >
                                                                Order
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="cp-empty">No services listed yet.</p>
                                    )}
                                </div>
                            )}

                            {profileTab === 'reviews' && (
                                <div className="cp-tab-content">
                                    {reviews.length > 0 ? (
                                        <div className="cp-reviews-list">
                                            {reviews.map(r => (
                                                <div key={r.id} className="cp-review-item">
                                                    <div className="cp-review-avatar">{(r.reviewer_name || r.reviewer_id || 'U').charAt(0).toUpperCase()}</div>
                                                    <div className="cp-review-body">
                                                        <div className="cp-review-top">
                                                            <div>
                                                                <h4>{r.reviewer_name || r.reviewer_id || 'Anonymous'}</h4>
                                                                <div className="cp-review-stars">{renderStars(r.rating || 0)}</div>
                                                            </div>
                                                            <span className="cp-review-date">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                                                        </div>
                                                        <p>{r.comment || '(No comment)'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="cp-empty">No reviews yet.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <ConfirmModal
                open={confirmModal.open}
                title="Place Order?"
                message={confirmModal.service ? <>Order <strong>"{confirmModal.service.title}"</strong> for <strong>₱{parseFloat(confirmModal.service?.price || 0).toLocaleString()}</strong>?</> : ''}
                variant="info"
                confirmLabel="Place Order"
                loading={orderLoading}
                onConfirm={handleOrderService}
                onCancel={() => setConfirmModal({ open: false, service: null })}
            />

            {/* Report Modal */}
            {reportModal && (
                <div className="confirm-overlay" onClick={() => setReportModal(false)}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="confirm-modal__title">Report User</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: '0 0 1rem' }}>Describe the issue. Our team will investigate.</p>
                        <form onSubmit={handleReport}>
                            <textarea
                                value={reportReason}
                                onChange={e => setReportReason(e.target.value)}
                                placeholder="Why are you reporting this user?"
                                required
                                style={{ width: '100%', minHeight: 100, padding: '0.75rem', borderRadius: 10, background: 'var(--bg-input, #18181b)', border: '1px solid var(--border, #27272a)', color: '#fff', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', marginBottom: '1rem' }}
                            />
                            <div className="confirm-modal__actions">
                                <button type="button" className="confirm-modal__btn confirm-modal__btn--cancel" onClick={() => setReportModal(false)}>Cancel</button>
                                <button type="submit" className="confirm-modal__btn confirm-modal__btn--confirm" style={{ background: '#ef4444' }} disabled={reporting}>{reporting ? 'Submitting...' : 'Submit Report'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CreatorProfilePage;
