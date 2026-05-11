import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchCreatorByUid, fetchServices, fetchReviews, fetchFollows, fetchBlocks, getUserData, createFollow, deleteFollow, createBlock, deleteBlock, createReport, createOrder, fetchUsers, updateCreator, patchUser } from '../api';
import { ArrowLeft, MapPin, Star, MessageSquare, UserPlus, UserMinus, ShieldBan, Flag } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';


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
    const [editProfile, setEditProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        full_name: '',
        avatar_url: '',
        bio: '',
        skills: '',
        experience_years: '',
        portfolio_url: '',
    });

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
                // Fetch creator profile
                const cRes = await fetchCreatorByUid(profileUid);
                if (cRes.ok && cRes.data) {
                    setCreator(cRes.data);
                    // FastAPI returns nested user in creator.user
                    if (cRes.data.user) {
                        setUserProfile(cRes.data.user);
                    }
                }

                // Fetch user profile as fallback if creator doesn't have nested user
                if (!cRes.data?.user) {
                    const uRes = await fetchUsers();
                    if (uRes.ok) {
                        const users = uRes.data.results || uRes.data || [];
                        const foundUser = users.find(u => sameId(u.firebase_uid ?? u.id, profileUid));
                        if (foundUser) setUserProfile(foundUser);
                    }
                }

                // Fetch services
                const sRes = await fetchServices();
                if (sRes.ok) {
                    const allServices = sRes.data.results || sRes.data || [];
                    setServices(allServices.filter(s => sameId(s.creator_id, profileUid)));
                }

                // Fetch reviews
                const rRes = await fetchReviews();
                if (rRes.ok) {
                    const allReviews = rRes.data.results || rRes.data || [];
                    setReviews(allReviews.filter(r => sameId(r.reviewee_id, profileUid)));
                }

                // Fetch follows
                const fRes = await fetchFollows();
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
        : null; // Return null instead of '5' when no reviews

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

    useEffect(() => {
        if (!isOwnProfile) return;
        setProfileForm({
            full_name: safeText(creatorUser.display_name || creatorUser.full_name || creatorUser.username, ''),
            avatar_url: safeText(creatorUser.avatar_url, ''),
            bio: safeText(creator?.bio, ''),
            skills: skills.join(', '),
            experience_years: safeText(creator?.experience_years, ''),
            portfolio_url: safeText(creator?.portfolio_url, ''),
        });
    }, [isOwnProfile, creator?.bio, creator?.experience_years, creator?.portfolio_url, creatorUser.display_name, creatorUser.full_name, creatorUser.username, creatorUser.avatar_url]);

    const handleSaveProfile = async () => {
        if (!isOwnProfile || !creator?.id) return;
        setSavingProfile(true);
        try {
            const creatorPayload = {
                bio: profileForm.bio.trim() || null,
                skills: profileForm.skills.trim() || null,
                experience_years: profileForm.experience_years ? Number(profileForm.experience_years) : null,
                portfolio_url: profileForm.portfolio_url.trim() || null,
            };
            const userPayload = {
                username: profileForm.full_name.trim() || creatorUser.username,
                avatar_url: profileForm.avatar_url.trim() || null,
            };

            const [creatorRes, userRes] = await Promise.all([
                updateCreator(creator.id, creatorPayload),
                patchUser(userData?.firebase_uid, userPayload),
            ]);

            if (!creatorRes.ok || !userRes.ok) {
                showToast('Failed to save profile changes.');
                return;
            }

            setCreator(creatorRes.data);
            setUserProfile((prev) => ({ ...(prev || {}), ...userRes.data }));
            const updatedUser = { ...(getUserData() || {}), full_name: userPayload.username, avatar_url: userPayload.avatar_url };
            localStorage.setItem('createch_user', JSON.stringify(updatedUser));
            setEditProfile(false);
            showToast('Profile updated successfully.');
        } catch {
            showToast('Failed to save profile changes.');
        } finally {
            setSavingProfile(false);
        }
    };

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
                creator_id: Number(service.creator_id || profileUid),
                service_title: service.title || service.label,
                price: Number(service.price || 0),
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
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 pt-16 text-center relative">
            <div className="w-28 h-28 mx-auto absolute left-1/2 -translate-x-1/2 -top-14">
                {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-[#080808] shadow-xl" />
                ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-[#080808] shadow-xl">
                        {safeText(displayName, 'U').charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <h2 className="text-xl font-bold text-white mb-1 mt-2">{displayName}</h2>
            <p className="text-zinc-400 text-sm mb-2 capitalize">{showCreatorStats ? (creator?.job_title || 'Creator') : userRole}</p>
            <p className="flex items-center justify-center gap-1 text-zinc-500 text-xs mb-4"><MapPin size={12} /> Remote</p>

            <div className="flex justify-center gap-8 py-4 border-y border-white/5 mb-4">
                <div className="text-center">
                    <span className="block text-2xl font-bold text-white mb-1">{followers}</span>
                    <span className="text-xs text-zinc-400 uppercase tracking-wide">Followers</span>
                </div>
                {showCreatorStats && (
                    <div className="text-center">
                        <span className="flex items-center justify-center gap-1 text-2xl font-bold text-white mb-1">
                            {avgRating ? avgRating : 'New'} 
                            {avgRating && <Star size={14} fill="#f59e0b" color="#f59e0b" />}
                        </span>
                        <span className="text-xs text-zinc-400 uppercase tracking-wide">Rating</span>
                    </div>
                )}
            </div>

            {!isOwnProfile && (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isFollowing ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-indigo-600 text-white border-none hover:bg-indigo-700'}`}
                            onClick={handleFollow}
                        >
                            {isFollowing ? <><UserMinus size={14} /> Unfollow</> : <><UserPlus size={14} /> Follow</>}
                        </button>
                        <button
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-colors"
                            onClick={() => navigate(`/messages?to=${profileUid}`)}
                        >
                            <MessageSquare size={14} /> Message
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isBlocked ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'}`}
                            onClick={handleBlock}
                        >
                            <ShieldBan size={14} /> {isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        <button
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/15 transition-colors"
                            onClick={() => setReportModal(true)}
                        >
                            <Flag size={14} /> Report
                        </button>
                    </div>
                </div>
            )}
            {isOwnProfile && (
                <button className="w-full mt-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors" onClick={() => setEditProfile(prev => !prev)}>
                    {editProfile ? 'Close Editor' : 'Edit Creator Profile'}
                </button>
            )}
        </div>
    );

    return (
        <section className="min-h-screen bg-[#080808] pb-20">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm px-6 lg:px-8 pt-6 pb-4">
                <span className="text-zinc-400">{userData?.role === 'client' ? 'Client Workspace' : 'Creator Workspace'}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-white font-medium">Profile</span>
            </div>

            {/* Back Button */}
            <div className="px-6 lg:px-8 mb-6">
                <button 
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors inline-flex items-center gap-2" 
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back</span>
                </button>
            </div>

            {toast && (
                <div className="fixed top-6 right-6 bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-3 rounded-xl z-50 backdrop-blur-md shadow-lg">
                    {toast}
                </div>
            )}

            {loading ? (
                <>
                    {/* Skeleton Cover */}
                    <div className="h-64 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer"></div>
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-24 relative z-10">
                        <div className="lg:col-span-1">
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 pt-16 relative">
                                <div className="w-28 h-28 mx-auto absolute left-1/2 -translate-x-1/2 -top-14 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded-full border-4 border-[#080808]"></div>
                                <div className="h-6 w-3/5 mx-auto mb-2 mt-2 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded"></div>
                                <div className="h-4 w-2/5 mx-auto mb-2 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded"></div>
                                <div className="h-4 w-2/5 mx-auto mb-6 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded"></div>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <div className="h-64 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded-2xl"></div>
                        </div>
                    </div>
                </>
            ) : !creator && !isOwnProfile ? (
                /* ── Non-creator user fallback ── */
                <>
                    <div className="h-64 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080808]"></div>
                    </div>
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-24 relative z-10">
                        <div className="lg:col-span-1">
                            {renderProfileCard(false)}
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-3">About</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">This user hasn't set up a creator profile yet.</p>
                            </div>
                            {reviews.length > 0 && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Reviews</h3>
                                    <div className="flex flex-col gap-4">
                                        {reviews.map(r => (
                                            <div key={r.id} className="flex gap-4 p-4 bg-white/5 rounded-xl">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                    {(r.reviewer_name || r.reviewer_id || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2 gap-4">
                                                        <div className="min-w-0">
                                                            <h4 className="text-white font-medium text-sm truncate">{r.reviewer_name || r.reviewer_id || 'Anonymous'}</h4>
                                                            <div className="flex gap-0.5 mt-1">{renderStars(r.rating || 0)}</div>
                                                        </div>
                                                        <span className="text-zinc-500 text-xs whitespace-nowrap">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                                                    </div>
                                                    <p className="text-zinc-400 text-sm leading-relaxed">{r.comment || '(No comment)'}</p>
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
                    <div className="h-64 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080808]"></div>
                    </div>
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-24 relative z-10">
                        <div className="lg:col-span-1 space-y-6">
                            {renderProfileCard(true)}

                            {/* Stats Card */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-zinc-400 text-sm">Response Time</span>
                                        <span className="text-white font-medium text-sm">~1 hour</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-zinc-400 text-sm">Completed Jobs</span>
                                        <span className="text-white font-medium text-sm">{completedJobs}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-zinc-400 text-sm">Starting Price</span>
                                        <span className="text-white font-medium text-sm">₱{creator?.starting_price || '500'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Skills Card */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {skills.length > 0 ? skills.map((s, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium">{s}</span>
                                    )) : (
                                        <p className="text-zinc-500 text-sm">No skills added yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {isOwnProfile && editProfile && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-white mb-6">Edit Profile</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Display Name</label>
                                            <input
                                                value={profileForm.full_name}
                                                onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                                                placeholder="Your display name"
                                                className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Avatar URL</label>
                                            <input
                                                value={profileForm.avatar_url}
                                                onChange={(e) => setProfileForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                                                placeholder="https://example.com/avatar.jpg"
                                                className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Bio</label>
                                            <textarea
                                                rows={4}
                                                value={profileForm.bio}
                                                onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                                                placeholder="Describe your expertise"
                                                className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white/20 resize-none transition-colors"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Skills (comma-separated)</label>
                                            <input
                                                value={profileForm.skills}
                                                onChange={(e) => setProfileForm(prev => ({ ...prev, skills: e.target.value }))}
                                                placeholder="Logo Design, Branding, UI/UX"
                                                className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Years of Experience</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={profileForm.experience_years}
                                                onChange={(e) => setProfileForm(prev => ({ ...prev, experience_years: e.target.value }))}
                                                placeholder="3"
                                                className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Portfolio URL</label>
                                            <input
                                                value={profileForm.portfolio_url}
                                                onChange={(e) => setProfileForm(prev => ({ ...prev, portfolio_url: e.target.value }))}
                                                placeholder="https://portfolio.example.com"
                                                className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-semibold transition-colors" onClick={() => setEditProfile(false)}>Cancel</button>
                                        <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50" onClick={handleSaveProfile} disabled={savingProfile}>
                                            {savingProfile ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-3">About</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">{creator?.bio || 'No bio provided yet.'}</p>
                            </div>

                            <div className="flex gap-2 border-b border-white/5">
                                <button className={`px-6 py-3 text-sm font-semibold transition-colors ${profileTab === 'services' ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-400 hover:text-white'}`} onClick={() => setProfileTab('services')}>Services</button>
                                <button className={`px-6 py-3 text-sm font-semibold transition-colors ${profileTab === 'reviews' ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-400 hover:text-white'}`} onClick={() => setProfileTab('reviews')}>Reviews</button>
                            </div>

                            {profileTab === 'services' && (
                                <div>
                                    {services.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {services.map(svc => (
                                                <div key={svc.id} className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-6 cursor-pointer transition-all" onClick={() => navigate(`/services/${svc.id}`)}>
                                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-base font-semibold text-white mb-2">{svc.title || svc.label}</h4>
                                                            {svc.description && <p className="text-zinc-400 text-sm line-clamp-2">{svc.description}</p>}
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className="text-lg font-bold text-white">₱{parseFloat(svc.price || 0).toLocaleString()}</span>
                                                            {!isOwnProfile && userData?.role !== 'creator' && (
                                                                <button
                                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                                                    onClick={(e) => { e.stopPropagation(); setConfirmModal({ open: true, service: svc }); }}
                                                                >
                                                                    Order
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-zinc-500 py-12 text-sm">No services listed yet.</p>
                                    )}
                                </div>
                            )}

                            {profileTab === 'reviews' && (
                                <div>
                                    {reviews.length > 0 ? (
                                        <div className="flex flex-col gap-4">
                                            {reviews.map(r => (
                                                <div key={r.id} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                        {(r.reviewer_name || r.reviewer_id || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-2 gap-4">
                                                            <div className="min-w-0">
                                                                <h4 className="text-white font-medium text-sm truncate">{r.reviewer_name || r.reviewer_id || 'Anonymous'}</h4>
                                                                <div className="flex gap-0.5 mt-1">{renderStars(r.rating || 0)}</div>
                                                            </div>
                                                            <span className="text-zinc-500 text-xs whitespace-nowrap">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                                                        </div>
                                                        <p className="text-zinc-400 text-sm leading-relaxed">{r.comment || '(No comment)'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-zinc-500 py-12 text-sm">No reviews yet.</p>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setReportModal(false)}>
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">Report User</h3>
                        <p className="text-zinc-400 text-sm mb-4">Describe the issue. Our team will investigate.</p>
                        <form onSubmit={handleReport}>
                            <textarea
                                value={reportReason}
                                onChange={e => setReportReason(e.target.value)}
                                placeholder="Why are you reporting this user?"
                                required
                                className="w-full min-h-[100px] px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 resize-vertical mb-4"
                            />
                            <div className="flex gap-3">
                                <button type="button" className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-colors" onClick={() => setReportModal(false)}>Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50" disabled={reporting}>{reporting ? 'Submitting...' : 'Submit Report'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CreatorProfilePage;
