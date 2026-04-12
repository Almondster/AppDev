import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCreators, fetchMyServices, fetchReviews, fetchFollows, getUserData } from '../api';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import './CreatorProfilePage.css';

const CreatorProfilePage = () => {
    const [creator, setCreator] = useState(null);
    const [services, setServices] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [followers, setFollowers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [profileTab, setProfileTab] = useState('services');
    const navigate = useNavigate();

    const userData = getUserData();

    useEffect(() => {
        (async () => {
            try {
                const [cRes, sRes, rRes, fRes] = await Promise.all([
                    fetchCreators(),
                    fetchMyServices(),
                    fetchReviews(),
                    fetchFollows(),
                ]);

                // Find the creator profile for the logged-in user
                if (cRes.ok) {
                    const allCreators = cRes.data.results || cRes.data || [];
                    const myCreator = allCreators.find(c => c.user_id === userData?.firebase_uid);
                    setCreator(myCreator || null);
                }
                if (sRes.ok) setServices(sRes.data.results || sRes.data || []);
                if (rRes.ok) {
                    const allReviews = rRes.data.results || rRes.data || [];
                    setReviews(allReviews.filter(r => r.reviewee_id === userData?.firebase_uid));
                }
                if (fRes.ok) {
                    const allFollows = fRes.data.results || fRes.data || [];
                    setFollowers(allFollows.filter(f => f.following_id === userData?.firebase_uid).length);
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : '5';

    const skills = creator?.skills || creator?.custom_skills || [];
    const completedJobs = 0; // Could be computed from orders

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star key={i} size={14} fill={i < rating ? '#f59e0b' : 'transparent'} color={i < rating ? '#f59e0b' : '#52525b'} />
        ));
    };


    return (
        <section className="creator-profile-page">
            {/* Breadcrumb */}
            <div className="cp-breadcrumb">
                <span className="cp-breadcrumb-muted">{userData?.role === 'client' ? 'Client Workspace' : 'Creator Workspace'}</span>
                <span className="cp-breadcrumb-sep">/</span>
                <span className="cp-breadcrumb-active">Creator Profile</span>
            </div>

            {/* Back Button */}
            <button className="cp-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
            </button>

            {loading ? (
                <>
                    {/* Skeleton Cover */}
                    <div className="cp-cover"><div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }}></div></div>
                    {/* Skeleton Layout */}
                    <div className="cp-layout">
                        <div className="cp-sidebar">
                            <div className="cp-profile-card">
                                <div className="skeleton" style={{ width: 90, height: 90, borderRadius: '50%', margin: '-45px auto 12px' }}></div>
                                <div className="skeleton" style={{ width: '55%', height: 22, margin: '0 auto 8px' }}></div>
                                <div className="skeleton" style={{ width: '30%', height: 16, margin: '0 auto 6px' }}></div>
                                <div className="skeleton" style={{ width: '40%', height: 14, margin: '0 auto 18px' }}></div>

                                <div className="cp-stats-row">
                                    {[0,1,2].map(j => (
                                        <div key={j} className="cp-stat" style={{ alignItems: 'center' }}>
                                            <div className="skeleton" style={{ width: 35, height: 20, marginBottom: 4 }}></div>
                                            <div className="skeleton" style={{ width: 55, height: 14 }}></div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: 16 }}>
                                    <div className="skeleton" style={{ width: 100, height: 38, borderRadius: 8 }}></div>
                                    <div className="skeleton" style={{ width: 100, height: 38, borderRadius: 8 }}></div>
                                </div>

                                <div className="skeleton-divider" style={{ marginTop: 20 }}></div>
                                {/* Detail rows */}
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="skeleton-row" style={{ justifyContent: 'space-between', padding: '10px 0' }}>
                                        <div className="skeleton" style={{ width: `${65 + (i%3)*12}px`, height: 16 }}></div>
                                        <div className="skeleton" style={{ width: `${75 + (i%2)*20}px`, height: 16 }}></div>
                                    </div>
                                ))}
                                <div className="skeleton-divider" style={{ margin: '10px 0' }}></div>
                                {/* Skill chips */}
                                <div className="skeleton" style={{ width: 55, height: 14, marginBottom: 10 }}></div>
                                <div className="skeleton-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                                    {[85, 100, 70, 95].map((w, i) => (
                                        <div key={i} className="skeleton" style={{ width: w, height: 28, borderRadius: 6 }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="cp-main">
                            {/* Tabs skeleton */}
                            <div className="skeleton-row" style={{ gap: 20, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 12 }}>
                                <div className="skeleton" style={{ width: 75, height: 18 }}></div>
                                <div className="skeleton" style={{ width: 65, height: 18 }}></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} style={{ background: '#141417', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, overflow: 'hidden' }}>
                                        <div className="skeleton" style={{ height: 160, borderRadius: 0 }}></div>
                                        <div style={{ padding: '1rem' }}>
                                            <div className="skeleton" style={{ width: `${60 + (i%3)*12}%`, height: 18, marginBottom: 8 }}></div>
                                            <div className="skeleton" style={{ width: `${80 + (i%2)*10}%`, height: 16, marginBottom: 5 }}></div>
                                            <div className="skeleton" style={{ width: `${40 + (i%3)*10}%`, height: 16, marginBottom: 12 }}></div>
                                            <div className="skeleton-divider"></div>
                                            <div className="skeleton-row" style={{ justifyContent: 'space-between' }}>
                                                <div className="skeleton" style={{ width: 60, height: 18 }}></div>
                                                <div className="skeleton-row" style={{ gap: 4 }}>
                                                    <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 3 }}></div>
                                                    <div className="skeleton" style={{ width: 30, height: 14 }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Cover Photo */}
                    <div className="cp-cover">
                        <div className="cp-cover-gradient"></div>
                    </div>

                    {/* Profile Layout */}
                    <div className="cp-layout">
                {/* Left Column - Profile Card */}
                <div className="cp-sidebar">
                    <div className="cp-profile-card">
                        <div className="cp-avatar">
                            {userData?.avatar_url ? (
                                <img src={userData.avatar_url} alt="Avatar" />
                            ) : (
                                <div className="cp-avatar-placeholder">
                                    {(userData?.full_name || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <h2 className="cp-name">{userData?.full_name || 'Creator'}</h2>
                        <p className="cp-role">Creator</p>
                        <p className="cp-location"><MapPin size={14} /> Remote</p>

                        <div className="cp-stats-row">
                            <div className="cp-stat">
                                <span className="cp-stat-value">{followers}</span>
                                <span className="cp-stat-label">FOLLOWERS</span>
                            </div>
                            <div className="cp-stat">
                                <span className="cp-stat-value">{avgRating} <Star size={12} fill="#f59e0b" color="#f59e0b" /></span>
                                <span className="cp-stat-label">RATING</span>
                            </div>
                        </div>

                        <button className="cp-cover-btn">Edit Cover Photo</button>
                    </div>

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
                    {/* About */}
                    <div className="cp-about">
                        <h3>About</h3>
                        <p>{creator?.bio || 'No bio provided yet.'}</p>
                    </div>

                    {/* Tabs */}
                    <div className="cp-tabs">
                        <button className={`cp-tab ${profileTab === 'services' ? 'active' : ''}`} onClick={() => setProfileTab('services')}>Services</button>
                        <button className={`cp-tab ${profileTab === 'reviews' ? 'active' : ''}`} onClick={() => setProfileTab('reviews')}>Reviews</button>
                    </div>

                    {/* Tab Content */}
                    {profileTab === 'services' && (
                        <div className="cp-tab-content">
                            {services.length > 0 ? (
                                <div className="cp-services-list">
                                    {services.map(svc => (
                                        <div key={svc.id} className="cp-service-item">
                                            <div>
                                                <h4>{svc.title || svc.label}</h4>
                                                {svc.description && <p>{svc.description}</p>}
                                            </div>
                                            <span className="cp-service-price">₱{parseFloat(svc.price || 0).toLocaleString()}</span>
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
        </section>
    );
};

export default CreatorProfilePage;
