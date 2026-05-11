import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyCreatorOrders as apiFetchOrders, fetchReviews, getUserData, fetchUsers } from '../api';
import { Eye, Briefcase, DollarSign, Star } from 'lucide-react';

const CreatorDashboardPage = () => {
    const userData = getUserData();
    const [tab, setTab] = useState('overview');
    const [orders, setOrders] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewerUsers, setReviewerUsers] = useState({}); // Map of reviewer_id -> user data
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const userId = userData?.id || userData?.firebase_uid;
                const [oRes, rRes, uRes] = await Promise.all([
                    apiFetchOrders(), 
                    fetchReviews({ reviewee_id: userId }),
                    fetchUsers()
                ]);
                if (oRes.ok) setOrders(oRes.data.results || oRes.data || []);
                
                if (rRes.ok) {
                    const reviewsData = rRes.data.results || rRes.data || [];
                    setReviews(reviewsData);
                    
                    // Build reviewer user map
                    if (uRes.ok && reviewsData.length > 0) {
                        const allUsers = uRes.data.results || uRes.data || [];
                        const userMap = {};
                        allUsers.forEach(u => {
                            userMap[u.id] = u;
                        });
                        setReviewerUsers(userMap);
                    }
                }
            } catch (err) {
                console.error('Creator dashboard error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const active = orders.filter(o => ['pending', 'in_progress', 'in_review'].includes(o.status));
    const completed = orders.filter(o => o.status === 'completed');
    const revenue = completed.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0);

    return (
        <div className="flex-1 min-h-full overflow-y-auto">
            <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-8 pb-20">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-400">Creator Workspace</span>
                    <span className="text-zinc-700">/</span>
                    <span className="text-white font-semibold">Studio</span>
                </div>

                {/* Tab Bar */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setTab('overview')}
                            className={`pb-3 text-sm font-medium transition-colors relative ${
                                tab === 'overview' ? 'text-white' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            Overview
                            {tab === 'overview' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setTab('reviews')}
                            className={`pb-3 text-sm font-medium transition-colors relative ${
                                tab === 'reviews' ? 'text-white' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            Reviews
                            {tab === 'reviews' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                            )}
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/creator-profile')}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 rounded-lg text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                            <Star size={14} /> View Public Profile
                        </button>
                        <button
                            onClick={() => navigate('/my-gigs')}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 rounded-lg text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                            <Briefcase size={14} /> Manage Gigs
                        </button>
                    </div>
                </div>

                {/* Overview Tab */}
                {tab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <Eye size={24} className="text-blue-400" />
                                    </div>
                                    <span className="text-xs text-green-400 font-medium">→ +0%</span>
                                </div>
                                <p className="text-3xl font-bold text-white mb-1">{loading ? '...' : orders.length}</p>
                                <p className="text-sm text-zinc-400">Total Orders</p>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                                        <Briefcase size={24} className="text-red-400" />
                                    </div>
                                    <span className="text-xs text-green-400 font-medium">→ +0%</span>
                                </div>
                                <p className="text-3xl font-bold text-white mb-1">{loading ? '...' : active.length}</p>
                                <p className="text-sm text-zinc-400">Active Jobs</p>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <DollarSign size={24} className="text-purple-400" />
                                    </div>
                                    <span className="text-xs text-green-400 font-medium">→ +0%</span>
                                </div>
                                <p className="text-3xl font-bold text-white mb-1">₱{loading ? '...' : (revenue / 1000).toFixed(1)}k</p>
                                <p className="text-sm text-zinc-400">Total Revenue</p>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Ongoing Projects */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-white">Ongoing Projects</h3>
                                    <button
                                        onClick={() => navigate('/orders')}
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        View All
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {active.length > 0 ? (
                                        active.slice(0, 3).map(o => (
                                            <div
                                                key={o.id}
                                                onClick={() => navigate(`/orders/${o.id}`)}
                                                className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors border border-white/5"
                                            >
                                                <span className="text-white font-medium text-sm">{o.service_title || 'Untitled service'}</span>
                                                <span className="text-xs text-zinc-400 capitalize">{o.status?.replace('_', ' ')}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-zinc-500 py-8">No active projects</p>
                                    )}
                                </div>
                            </div>

                            {/* Revenue Analytics */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-6">Revenue Analytics</h3>
                                <div className="h-48 flex items-center justify-center text-zinc-500">
                                    <p>Chart placeholder</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reviews Tab */}
                {tab === 'reviews' && (
                    <div className="space-y-6">
                        {reviews.length > 0 ? (
                            reviews.map(r => {
                                const reviewer = reviewerUsers[r.reviewer_id];
                                const reviewerName = reviewer?.username || reviewer?.full_name || reviewer?.email || r.reviewer_name || 'Anonymous';
                                return (
                                    <div key={r.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {String(reviewerName).charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-white font-semibold">{reviewerName}</h4>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                className={i < r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-600'}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-zinc-400 text-sm">{r.comment || 'No comment provided.'}</p>
                                                <p className="text-xs text-zinc-600 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-20 text-zinc-500">
                                No reviews yet
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreatorDashboardPage;
