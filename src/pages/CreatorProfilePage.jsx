import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    fetchCreatorByUid,
    fetchServices,
    fetchReviews,
    fetchFollows,
    fetchBlocks,
    getUserData,
    createFollow,
    deleteFollow,
    createBlock,
    deleteBlock,
    createReport,
    createOrder,
    fetchUsers,
    fetchOrders,
} from '../api';
import {
    ArrowLeft,
    MapPin,
    Star,
    MessageSquare,
    UserPlus,
    UserMinus,
    ShieldBan,
    Flag,
    Briefcase,
    Clock3,
    Sparkles,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { readCollection } from '../utils/collections';
import './CreatorProfilePage.css';

const DEFAULT_EMPTY_MESSAGE = 'No reviews yet.';

const sameId = (a, b) => String(a) === String(b);

const safeText = (value, fallback = '') => {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
};

const formatCurrency = (value) => `PHP ${Number(value || 0).toLocaleString()}`;

const parseSkills = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;

    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch (error) {
            void error;
        }

        if (raw.startsWith('[')) {
            try {
                const parsed = JSON.parse(raw.replace(/'/g, '"'));
                if (Array.isArray(parsed)) return parsed;
            } catch (error) {
                void error;
            }
        }

        const trimmed = raw.replace(/^\[|\]$|^\{|\}$/g, '').trim();
        if (!trimmed) return [];
        return trimmed
            .split(',')
            .map((skill) => skill.trim().replace(/^['"]|['"]$/g, ''))
            .filter(Boolean);
    }

    return [];
};

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
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockId, setBlockId] = useState(null);
    const [reportModal, setReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reporting, setReporting] = useState(false);
    const [unfollowConfirm, setUnfollowConfirm] = useState(false);
    const [blockConfirm, setBlockConfirm] = useState(false);
    const [existingOrders, setExistingOrders] = useState([]);
    const [duplicateModal, setDuplicateModal] = useState({ open: false, service: null });
    const [dueDateInput, setDueDateInput] = useState('');

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const userData = getUserData();
    const currentUid = userData?.firebase_uid;
    const profileUid = searchParams.get('uid') || userData?.firebase_uid;
    const isOwnProfile = sameId(profileUid, userData?.firebase_uid);

    useEffect(() => {
        (async () => {
            setLoading(true);

            try {
                const [creatorRes, servicesRes, reviewsRes, followsRes, usersRes, blocksRes] = await Promise.all([
                    fetchCreatorByUid(profileUid),
                    fetchServices(),
                    fetchReviews(),
                    fetchFollows(),
                    fetchUsers(),
                    fetchBlocks(),
                ]);

                if (creatorRes.ok) {
                    setCreator(creatorRes.data || null);
                } else {
                    setCreator(null);
                }

                if (usersRes.ok) {
                    const users = readCollection(usersRes);
                    const foundUser = users.find((user) => sameId(user.firebase_uid ?? user.id, profileUid));
                    setUserProfile(foundUser || null);
                }

                if (servicesRes.ok) {
                    const allServices = readCollection(servicesRes);
                    setServices(allServices.filter((service) => sameId(service.creator_id, profileUid)));
                }

                if (reviewsRes.ok) {
                    const allReviews = readCollection(reviewsRes);
                    setReviews(allReviews.filter((review) => sameId(review.reviewee_id, profileUid)));
                }

                if (followsRes.ok) {
                    const allFollows = readCollection(followsRes);
                    setFollowers(allFollows.filter((follow) => sameId(follow.following_id, profileUid)).length);
                    const myFollow = allFollows.find(
                        (follow) => sameId(follow.follower_id, currentUid) && sameId(follow.following_id, profileUid),
                    );
                    setIsFollowing(Boolean(myFollow));
                    setFollowId(myFollow?.id || null);
                }

                if (blocksRes.ok) {
                    const allBlocks = readCollection(blocksRes);
                    const myBlock = allBlocks.find(
                        (block) => sameId(block.blocker_id, currentUid) && sameId(block.blocked_id, profileUid),
                    );
                    setIsBlocked(Boolean(myBlock));
                    setBlockId(myBlock?.id || null);
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        })();

        // Fetch existing orders for duplicate detection
        (async () => {
            try {
                const res = await fetchOrders();
                if (res.ok) {
                    const all = res.data?.results || res.data || [];
                    setExistingOrders(all);
                }
            } catch { /* ignore */ }
        })();
    }, [profileUid, currentUid]);

    const creatorUser = creator?.user || userProfile || {};
    const displayName = safeText(
        creatorUser.display_name ||
            creatorUser.full_name ||
            creatorUser.username ||
            creatorUser.email ||
            creator?.display_name ||
            creator?.username,
        'Creator',
    );
    const avatarUrl = creatorUser.avatar_url || null;
    const userRole = creatorUser.role || userProfile?.role || (creator ? 'creator' : 'client');
    const skills = parseSkills(creator?.skills) || parseSkills(creator?.custom_skills) || [];
    const completedJobs = 0;
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1)
        : '5.0';
    const hourlyRate = formatCurrency(creator?.starting_price || 500);
    const responseTime = creator?.response_time || '1 hour';

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 3500);
    };

    const buildDueDatePayload = (dateValue) => {
        if (!dateValue) return null;
        return new Date(`${dateValue}T23:59:59`).toISOString();
    };

    const handleFollow = async () => {
        if (isFollowing && followId) {
            setUnfollowConfirm(true);
            return;
        }

        try {
            const { ok, data } = await createFollow({
                follower_id: currentUid,
                following_id: profileUid,
            });
            if (ok) {
                setIsFollowing(true);
                setFollowId(data.id);
                setFollowers((prev) => prev + 1);
                showToast('Following!');
            }
        } catch {
            showToast('Failed to follow.');
        }
    };

    const confirmUnfollow = async () => {
        setUnfollowConfirm(false);
        try {
            await deleteFollow(followId);
            setIsFollowing(false);
            setFollowId(null);
            setFollowers((prev) => Math.max(0, prev - 1));
            showToast('Unfollowed');
        } catch {
            showToast('Failed to unfollow.');
        }
    };

    const handleBlock = async () => {
        setBlockConfirm(true);
    };

    const confirmBlock = async () => {
        setBlockConfirm(false);
        if (isBlocked && blockId) {
            try {
                await deleteBlock(blockId);
                setIsBlocked(false);
                setBlockId(null);
                showToast('User unblocked');
            } catch {
                showToast('Failed to unblock.');
            }
            return;
        }

        try {
            const { ok, data } = await createBlock({
                blocker_id: currentUid,
                blocked_id: profileUid,
            });
            if (ok) {
                setIsBlocked(true);
                setBlockId(data.id);
                showToast('User blocked');
            }
        } catch {
            showToast('Failed to block.');
        }
    };

    const handleReport = async (event) => {
        event.preventDefault();
        if (!reportReason.trim()) return;

        setReporting(true);
        try {
            const { ok } = await createReport({
                reporter_id: currentUid,
                reported_id: profileUid,
                reason: reportReason,
            });
            if (ok) {
                showToast('Report submitted. Our team will review it.');
                setReportModal(false);
                setReportReason('');
            } else {
                showToast('Failed to submit report.');
            }
        } catch {
            showToast('Connection error.');
        }
        setReporting(false);
    };

    const handleOrderService = async () => {
        const service = confirmModal.service || duplicateModal.service;
        if (!service) return;
        if (!dueDateInput) {
            showToast('Please set the due date before placing the order.');
            return;
        }

        setOrderLoading(true);
        try {
            const { ok } = await createOrder({
                service_id: service.id,
                due_date: buildDueDatePayload(dueDateInput),
            });
            showToast(ok ? `Order placed for "${service.title}"!` : 'Failed to place order.');
        } catch {
            showToast('Connection error.');
        }
        setOrderLoading(false);
        setConfirmModal({ open: false, service: null });
        setDuplicateModal({ open: false, service: null });
        setDueDateInput('');
    };

    const initiateOrder = (service) => {
        const hasDuplicate = existingOrders.some(
            (o) => String(o.service_id) === String(service.id) &&
                   ['Pending', 'In_progress'].includes(o.status)
        );
        if (hasDuplicate) {
            setDuplicateModal({ open: true, service });
        } else {
            setConfirmModal({ open: true, service });
        }
    };

    const renderStars = (rating) =>
        [...Array(5)].map((_, index) => (
            <Star
                key={index}
                size={14}
                fill={index < rating ? '#f59e0b' : 'transparent'}
                color={index < rating ? '#f59e0b' : '#71717a'}
            />
        ));

    const renderReviewList = (emptyMessage = DEFAULT_EMPTY_MESSAGE) => (
        reviews.length > 0 ? (
            <div className="cp-reviews-list">
                {reviews.map((review) => (
                    <article key={review.id} className="cp-review-item">
                        <div className="cp-review-avatar">
                            {review.reviewer_avatar_url ? (
                                <img src={review.reviewer_avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                            ) : (
                                safeText(review.reviewer_name || review.reviewer_id, 'U').charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="cp-review-body">
                            <div className="cp-review-top">
                                <div>
                                    <h4>{review.reviewer_name || review.reviewer_id || 'Anonymous'}</h4>
                                    <div className="cp-review-stars">{renderStars(review.rating || 0)}</div>
                                </div>
                                <span className="cp-review-date">
                                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                                </span>
                            </div>
                            <p>{review.comment || '(No comment)'}</p>
                        </div>
                    </article>
                ))}
            </div>
        ) : (
            <p className="cp-empty">{emptyMessage}</p>
        )
    );

    const renderServices = () => (
        services.length > 0 ? (
            <div className="cp-services-list">
                {services.map((service) => (
                    <article
                        key={service.id}
                        className="cp-service-item"
                        onClick={() => navigate(`/services/${service.id}`)}
                    >
                        <div className="cp-service-copy">
                            <div className="cp-service-meta">
                                <span className="cp-service-badge">{service.category || service.label || 'Service'}</span>
                                <span className="cp-service-turnaround">{service.turnaround_time || '3 days'}</span>
                            </div>
                            <h4>{service.title || service.label}</h4>
                            {service.description && <p>{service.description}</p>}
                        </div>
                        <div className="cp-service-actions">
                            <span className="cp-service-price">{formatCurrency(service.price)}</span>
                            {!isOwnProfile && userData?.role !== 'creator' && (
                                <button
                                    type="button"
                                    className="cp-service-order-btn"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        initiateOrder(service);
                                    }}
                                >
                                    Order
                                </button>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        ) : (
            <p className="cp-empty">No services listed yet.</p>
        )
    );

    const renderProfileCard = (showCreatorStats) => (
        <div className="cp-profile-card">
            <div className="cp-avatar">
                {avatarUrl ? (
                    <img src={avatarUrl} alt={`${displayName} avatar`} />
                ) : (
                    <div className="cp-avatar-placeholder">
                        {safeText(displayName, 'U').charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            <div className="cp-identity">
                <span className="cp-role-chip">{showCreatorStats ? 'Creator Profile' : 'Community Member'}</span>
                <h2 className="cp-name">{displayName}</h2>
                <p className="cp-role" style={{ textTransform: 'capitalize' }}>
                    {showCreatorStats ? creator?.job_title || 'Independent creator' : userRole}
                </p>
                <p className="cp-location">
                    <MapPin size={14} />
                    Remote
                </p>
            </div>

            <div className={`cp-stats-row ${showCreatorStats ? 'cp-stats-row--triple' : ''}`}>
                <div className="cp-stat">
                    <span className="cp-stat-value">{followers}</span>
                    <span className="cp-stat-label">Followers</span>
                </div>
                {showCreatorStats && (
                    <>
                        <div className="cp-stat">
                            <span className="cp-stat-value">{avgRating}</span>
                            <span className="cp-stat-label">Rating</span>
                        </div>
                        <div className="cp-stat">
                            <span className="cp-stat-value">{services.length}</span>
                            <span className="cp-stat-label">Services</span>
                        </div>
                    </>
                )}
            </div>

            {!isOwnProfile ? (
                <div className="cp-action-grid">
                    <button
                        type="button"
                        className={`cp-action-btn cp-action-btn--primary ${isFollowing ? 'cp-action-btn--danger' : ''}`}
                        onClick={handleFollow}
                    >
                        {isFollowing ? <UserMinus size={15} /> : <UserPlus size={15} />}
                        {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    <button
                        type="button"
                        className="cp-action-btn"
                        onClick={() => navigate(`/messages?to=${profileUid}`)}
                    >
                        <MessageSquare size={15} />
                        Message
                    </button>
                    <button
                        type="button"
                        className={`cp-action-btn ${isBlocked ? 'cp-action-btn--danger-soft' : ''}`}
                        onClick={handleBlock}
                    >
                        <ShieldBan size={15} />
                        {isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                        type="button"
                        className="cp-action-btn cp-action-btn--danger-soft"
                        onClick={() => setReportModal(true)}
                    >
                        <Flag size={15} />
                        Report
                    </button>
                </div>
            ) : (
                <button type="button" className="cp-action-btn cp-action-btn--primary cp-action-btn--full" onClick={() => navigate('/settings')}>
                    Edit Profile
                </button>
            )}
        </div>
    );

    const renderCreatorOverview = () => (
        <div className="cp-overview-grid">
            <div className="cp-highlight-card">
                <div className="cp-highlight-icon">
                    <Clock3 size={18} />
                </div>
                <div>
                    <span className="cp-highlight-label">Response Time</span>
                    <strong>{responseTime}</strong>
                </div>
            </div>
            <div className="cp-highlight-card">
                <div className="cp-highlight-icon">
                    <Briefcase size={18} />
                </div>
                <div>
                    <span className="cp-highlight-label">Completed Jobs</span>
                    <strong>{completedJobs}</strong>
                </div>
            </div>
            <div className="cp-highlight-card">
                <div className="cp-highlight-icon">
                    <Sparkles size={18} />
                </div>
                <div>
                    <span className="cp-highlight-label">Starting Rate</span>
                    <strong>{hourlyRate}/hr</strong>
                </div>
            </div>
        </div>
    );

    return (
        <section className="creator-profile-page">
            <div className="cp-topbar">
                <div className="cp-breadcrumb">
                    <span className="cp-breadcrumb-muted">
                        {userData?.role === 'client' ? 'Client Workspace' : 'Creator Workspace'}
                    </span>
                    <span className="cp-breadcrumb-sep">/</span>
                    <span className="cp-breadcrumb-active">Profile</span>
                </div>
                <button type="button" className="cp-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                    Back
                </button>
            </div>

            {toast && <div className="global-toast global-toast--success">{toast}</div>}

            {loading ? (
                <>
                    <div className="cp-cover">
                        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }}></div>
                    </div>
                    <div className="cp-layout">
                        <aside className="cp-sidebar">
                            <div className="cp-profile-card">
                                <div className="skeleton" style={{ width: 110, height: 110, borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                                <div className="skeleton" style={{ width: '60%', height: 22, margin: '0 auto 0.75rem' }}></div>
                                <div className="skeleton" style={{ width: '38%', height: 16, margin: '0 auto 1rem' }}></div>
                                <div className="skeleton" style={{ width: '100%', height: 52, borderRadius: 16 }}></div>
                            </div>
                        </aside>
                        <div className="cp-main">
                            <div className="skeleton" style={{ height: 132, borderRadius: 20 }}></div>
                            <div className="skeleton" style={{ height: 260, borderRadius: 20 }}></div>
                        </div>
                    </div>
                </>
            ) : !creator && !isOwnProfile ? (
                <>
                    <div className="cp-cover">
                        <div className="cp-cover-gradient"></div>
                        <div className="cp-cover-content">
                            <span className="cp-cover-kicker">Community profile</span>
                            <h1>{displayName}</h1>
                            <p>This user has not published a creator profile yet.</p>
                        </div>
                    </div>

                    <div className="cp-layout">
                        <aside className="cp-sidebar">
                            {renderProfileCard(false)}
                        </aside>

                        <div className="cp-main">
                            <section className="cp-panel cp-panel--soft">
                                <div className="cp-section-heading">
                                    <h3>About</h3>
                                    <p>This account can still receive reviews and profile interactions.</p>
                                </div>
                                <p className="cp-body-copy">This user has not set up a creator profile yet.</p>
                            </section>

                            <section className="cp-panel">
                                <div className="cp-section-heading">
                                    <h3>Reviews</h3>
                                    <p>Community feedback left on this profile.</p>
                                </div>
                                {renderReviewList()}
                            </section>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="cp-cover">
                        <div className="cp-cover-gradient"></div>
                        <div className="cp-cover-content">
                            <span className="cp-cover-kicker">Creator spotlight</span>
                            <h1>{displayName}</h1>
                            <p>{creator?.bio || 'Independent creator available for custom work and project-based collaboration.'}</p>
                        </div>
                    </div>

                    <div className="cp-layout">
                        <aside className="cp-sidebar">
                            {renderProfileCard(true)}

                            <div className="cp-info-card">
                                <h3>Stats</h3>
                                <div className="cp-info-row">
                                    <span>Response Time</span>
                                    <span className="cp-info-val">{responseTime}</span>
                                </div>
                                <div className="cp-info-row">
                                    <span>Completed Jobs</span>
                                    <span className="cp-info-val">{completedJobs}</span>
                                </div>
                                <div className="cp-info-row">
                                    <span>Starting Rate</span>
                                    <span className="cp-info-val">{hourlyRate}/hr</span>
                                </div>
                            </div>

                            <div className="cp-info-card">
                                <h3>Skills</h3>
                                <div className="cp-skills">
                                    {skills.length > 0 ? (
                                        skills.map((skill, index) => (
                                            <span key={`${skill}-${index}`} className="cp-skill-tag">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="cp-empty-note">No skills added yet.</p>
                                    )}
                                </div>
                            </div>
                        </aside>

                        <div className="cp-main">
                            {renderCreatorOverview()}

                            <section className="cp-panel cp-panel--soft">
                                <div className="cp-section-heading">
                                    <h3>About</h3>
                                    <p>Profile summary and working style.</p>
                                </div>
                                <p className="cp-body-copy">{creator?.bio || 'No bio provided yet.'}</p>
                            </section>

                            <section className="cp-panel">
                                <div className="cp-tabs">
                                    <button
                                        type="button"
                                        className={`cp-tab ${profileTab === 'services' ? 'active' : ''}`}
                                        onClick={() => setProfileTab('services')}
                                    >
                                        Services
                                    </button>
                                    <button
                                        type="button"
                                        className={`cp-tab ${profileTab === 'reviews' ? 'active' : ''}`}
                                        onClick={() => setProfileTab('reviews')}
                                    >
                                        Reviews
                                    </button>
                                </div>

                                <div className="cp-tab-content">
                                    {profileTab === 'services' ? renderServices() : renderReviewList()}
                                </div>
                            </section>
                        </div>
                    </div>
                </>
            )}

            <ConfirmModal
                open={confirmModal.open}
                title="Place Order?"
                message={
                    confirmModal.service ? (
                        <>
                            <p style={{ margin: '0 0 0.9rem' }}>
                                Order <strong>{confirmModal.service.title}</strong> for{' '}
                                <strong>{formatCurrency(confirmModal.service?.price)}</strong>? Set the date you
                                need the completed output.
                            </p>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                <span style={{ color: '#a1a1aa', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                                    Required By
                                </span>
                                <input
                                    type="date"
                                    value={dueDateInput}
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={(event) => setDueDateInput(event.target.value)}
                                    style={{ width: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: '#fff', padding: '0.7rem 0.8rem', font: 'inherit', outline: 'none' }}
                                />
                            </label>
                        </>
                    ) : (
                        ''
                    )
                }
                variant="info"
                confirmLabel="Place Order"
                loading={orderLoading}
                onConfirm={handleOrderService}
                onCancel={() => {
                    setConfirmModal({ open: false, service: null });
                    setDueDateInput('');
                }}
            />

            {reportModal && (
                <div className="confirm-overlay" onClick={() => setReportModal(false)}>
                    <div className="confirm-modal" onClick={(event) => event.stopPropagation()}>
                        <h3 className="confirm-modal__title">Report User</h3>
                        <p className="cp-report-copy">Describe the issue. Our team will investigate.</p>
                        <form onSubmit={handleReport}>
                            <textarea
                                value={reportReason}
                                onChange={(event) => setReportReason(event.target.value)}
                                placeholder="Why are you reporting this user?"
                                required
                                className="cp-report-textarea"
                            />
                            <div className="confirm-modal__actions">
                                <button
                                    type="button"
                                    className="confirm-modal__btn confirm-modal__btn--cancel"
                                    onClick={() => setReportModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="confirm-modal__btn confirm-modal__btn--confirm cp-report-submit"
                                    disabled={reporting}
                                >
                                    {reporting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={unfollowConfirm}
                title="Unfollow?"
                message={<>Are you sure you want to unfollow <strong>{displayName}</strong>?</>}
                variant="warning"
                confirmLabel="Unfollow"
                onConfirm={confirmUnfollow}
                onCancel={() => setUnfollowConfirm(false)}
            />

            <ConfirmModal
                open={blockConfirm}
                title={isBlocked ? 'Unblock User?' : 'Block User?'}
                message={isBlocked
                    ? <><strong>{displayName}</strong> will be able to interact with you again.</>  
                    : <><strong>{displayName}</strong> will no longer be able to interact with you.</>}
                variant={isBlocked ? 'info' : 'danger'}
                confirmLabel={isBlocked ? 'Unblock' : 'Block'}
                onConfirm={confirmBlock}
                onCancel={() => setBlockConfirm(false)}
            />

            <ConfirmModal
                open={duplicateModal.open}
                title="Duplicate Order"
                message={duplicateModal.service ? (
                    <>
                        <p style={{ margin: '0 0 0.9rem' }}>
                            You already have an active order for <strong>"{duplicateModal.service.title}"</strong>.
                            You can still place another one, but set a separate due date for it.
                        </p>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            <span style={{ color: '#a1a1aa', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                                Required By
                            </span>
                            <input
                                type="date"
                                value={dueDateInput}
                                min={new Date().toISOString().slice(0, 10)}
                                onChange={(event) => setDueDateInput(event.target.value)}
                                style={{ width: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: '#fff', padding: '0.7rem 0.8rem', font: 'inherit', outline: 'none' }}
                            />
                        </label>
                    </>
                ) : ''}
                variant="warning"
                confirmLabel="Order Anyway"
                loading={orderLoading}
                onConfirm={handleOrderService}
                onCancel={() => {
                    setDuplicateModal({ open: false, service: null });
                    setDueDateInput('');
                }}
            />
        </section>
    );
};

export default CreatorProfilePage;
