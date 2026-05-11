import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, BarChart3, AlertTriangle, Package, FileText, CheckCircle, XCircle, X, Briefcase } from 'lucide-react';
import { getToken } from '../api';

const ICON_MAP = {
    Users: Users,
    BarChart3: BarChart3,
    AlertTriangle: AlertTriangle,
    Package: Package,
    ShieldCheck: ShieldCheck,
    FileText: FileText,
    Briefcase: Briefcase,
};

const AdminDashboardPage = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Creator Applications state
    const [applications, setApplications] = useState([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [reviewModal, setReviewModal] = useState({ open: false, id: null, status: null });
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewing, setReviewing] = useState(false);

    useEffect(() => {
        loadDashboardData();
        loadApplications();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            console.log('Loading admin dashboard, token exists:', !!token);
            
            const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/dashboard/admin-stats`;
            console.log('Fetching from:', url);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Dashboard data loaded:', data);
                setDashboardData(data);
            } else {
                const errorText = await response.text();
                console.error('Failed to load dashboard data:', response.status, response.statusText, errorText);
                setError(`Failed to load dashboard: ${response.status} ${response.statusText}`);
            }
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const loadApplications = async () => {
        setApplicationsLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/creator-applications/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setApplications(data);
            }
        } catch (err) {
            console.error('Failed to load applications:', err);
        } finally {
            setApplicationsLoading(false);
        }
    };

    const handleReviewApplication = async () => {
        setReviewing(true);
        try {
            const token = getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/creator-applications/${reviewModal.id}/review/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: reviewModal.status,
                    admin_notes: reviewNotes
                })
            });
            if (response.ok) {
                await loadApplications();
                setReviewModal({ open: false, id: null, status: null });
                setReviewNotes('');
                setSelectedApplication(null);
            }
        } catch (err) {
            console.error('Failed to review application:', err);
        } finally {
            setReviewing(false);
        }
    };

    const statusColor = (status) => {
        const map = {
            completed: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
            in_progress: { bg: 'rgba(56,189,248,0.1)', text: '#38bdf8' },
            pending: { bg: 'rgba(250,204,21,0.1)', text: '#facc15' },
            accepted: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
            delivered: { bg: 'rgba(168,85,247,0.1)', text: '#a855f7' },
            disputed: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
            cancelled: { bg: 'rgba(113,113,122,0.1)', text: '#71717a' },
        };
        return map[status] || { bg: 'rgba(113,113,122,0.1)', text: '#71717a' };
    };

    const formatValue = (value, format) => {
        if (format === 'currency') {
            return `₱${parseFloat(value || 0).toLocaleString()}`;
        }
        return value;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm">Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <AlertTriangle size={48} className="text-red-500" />
                <p className="text-red-400">{error}</p>
                <button 
                    onClick={loadDashboardData}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <AlertTriangle size={48} className="text-zinc-500" />
                <p className="text-zinc-500">No dashboard data available</p>
                <button 
                    onClick={loadDashboardData}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full pb-20">
            {/* Header */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8" style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(168,85,247,0.08))' }}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <ShieldCheck size={22} className="text-rose-400" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Command</h1>
                </div>
                <p className="text-zinc-400 text-sm">Platform health, creator applications, and user metrics.</p>
            </div>

            {/* Stats Grid - Completely Dynamic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardData.stat_cards.map((card, i) => {
                    const IconComponent = ICON_MAP[card.icon] || Package;
                    return (
                        <div key={i} className={`bg-white/[0.02] border ${card.alert ? 'border-red-500/30' : 'border-white/5'} rounded-xl p-5 flex items-center gap-4 hover:bg-white/[0.03] transition-all`}>
                            <div className="p-3 rounded-2xl" style={{ background: card.bg, color: card.color }}>
                                <IconComponent size={24} />
                            </div>
                            <div>
                                <p className="text-[11px] text-zinc-500 uppercase tracking-wider">{card.label}</p>
                                <p className="text-2xl font-bold text-white">{formatValue(card.value, card.format)}</p>
                                <p className="text-[11px] text-zinc-500">{card.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Creator Applications */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <FileText size={20} className="text-zinc-400" />
                        <h2 className="text-lg font-semibold text-white">Creator Applications</h2>
                        {applications.filter(a => a.status === 'pending').length > 0 && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                                {applications.filter(a => a.status === 'pending').length} pending
                            </span>
                        )}
                    </div>
                </div>
                <div className="divide-y divide-white/5">
                    {applicationsLoading ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">Loading applications...</div>
                    ) : applications.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">No applications yet.</div>
                    ) : (
                        applications.map(app => (
                            <div key={app.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors gap-4 flex-wrap">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium text-white">{app.first_name} {app.last_name}</p>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                                            style={{
                                                background: app.status === 'pending' ? 'rgba(234,179,8,0.2)' : app.status === 'approved' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                                color: app.status === 'pending' ? '#fbbf24' : app.status === 'approved' ? '#4ade80' : '#f87171'
                                            }}>
                                            {app.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500">{app.category} • {app.experience_years} years • ₱{app.starting_price}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedApplication(app)}
                                        className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors"
                                    >
                                        View Details
                                    </button>
                                    {app.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => setReviewModal({ open: true, id: app.id, status: 'approved' })}
                                                className="p-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors"
                                                title="Approve"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                            <button
                                                onClick={() => setReviewModal({ open: true, id: app.id, status: 'rejected' })}
                                                className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
                                                title="Reject"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Recent Orders - Dynamic from Backend */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Briefcase size={20} className="text-zinc-400" />
                        <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
                    </div>
                    <span className="text-zinc-500 text-sm">{dashboardData.total_orders} total</span>
                </div>
                <div className="divide-y divide-white/5">
                    {dashboardData.recent_orders.length > 0 ? dashboardData.recent_orders.map(order => {
                        const sc = statusColor(order.status);
                        return (
                            <div key={order.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-white truncate">{order.service_title || `Order #${order.id}`}</p>
                                    <p className="text-xs text-zinc-500">₱{parseFloat(order.price || 0).toLocaleString()}</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase whitespace-nowrap ml-3"
                                    style={{ background: sc.bg, color: sc.text }}>
                                    {order.status?.replace('_', ' ')}
                                </span>
                            </div>
                        );
                    }) : (
                        <div className="p-8 text-center text-zinc-500 text-sm">No orders yet.</div>
                    )}
                </div>
            </div>

            {/* Application Details Modal */}
            {selectedApplication && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0F0F0F] z-10">
                            <h2 className="text-xl font-semibold text-white">Application Details</h2>
                            <button onClick={() => setSelectedApplication(null)} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Personal Info */}
                            <div>
                                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Full Name</p>
                                        <p className="text-sm text-white">{selectedApplication.first_name} {selectedApplication.middle_name} {selectedApplication.last_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Phone</p>
                                        <p className="text-sm text-white">{selectedApplication.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">ID Number</p>
                                        <p className="text-sm text-white">{selectedApplication.id_number || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Address</h3>
                                <p className="text-sm text-white">
                                    {selectedApplication.street_address}, {selectedApplication.barangay}, {selectedApplication.city}, {selectedApplication.province} {selectedApplication.postal_code}
                                </p>
                            </div>

                            {/* Professional Info */}
                            <div>
                                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Professional Profile</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Category</p>
                                        <p className="text-sm text-white">{selectedApplication.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Experience</p>
                                        <p className="text-sm text-white">{selectedApplication.experience_years} years</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Starting Price</p>
                                        <p className="text-sm text-white">₱{selectedApplication.starting_price}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Turnaround</p>
                                        <p className="text-sm text-white">{selectedApplication.turnaround_time}</p>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <p className="text-xs text-zinc-500 mb-1">Bio</p>
                                    <p className="text-sm text-white leading-relaxed">{selectedApplication.bio}</p>
                                </div>
                                {selectedApplication.skills && selectedApplication.skills.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs text-zinc-500 mb-2">Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedApplication.skills.map((skill, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full text-xs">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedApplication.portfolio_url && (
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Portfolio</p>
                                        <a href={selectedApplication.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300">
                                            {selectedApplication.portfolio_url}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* ID Verification */}
                            <div>
                                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">ID Verification</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {selectedApplication.id_front_url && (
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-2">Front of ID</p>
                                            <img src={selectedApplication.id_front_url} alt="ID Front" className="w-full rounded-lg border border-white/10" />
                                        </div>
                                    )}
                                    {selectedApplication.id_back_url && (
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-2">Back of ID</p>
                                            <img src={selectedApplication.id_back_url} alt="ID Back" className="w-full rounded-lg border border-white/10" />
                                        </div>
                                    )}
                                    {selectedApplication.id_selfie_url && (
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-2">Selfie with ID</p>
                                            <img src={selectedApplication.id_selfie_url} alt="Selfie" className="w-full rounded-lg border border-white/10" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedApplication.admin_notes && (
                                <div>
                                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Admin Notes</h3>
                                    <p className="text-sm text-white">{selectedApplication.admin_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {reviewModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-semibold text-white mb-2">
                            {reviewModal.status === 'approved' ? 'Approve Application' : 'Reject Application'}
                        </h2>
                        <p className="text-sm text-zinc-400 mb-4">
                            {reviewModal.status === 'approved'
                                ? 'This will convert the user to a creator and create their profile.'
                                : 'Please provide a reason for rejection.'}
                        </p>
                        <textarea
                            placeholder="Admin notes (optional)"
                            value={reviewNotes}
                            onChange={e => setReviewNotes(e.target.value)}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setReviewModal({ open: false, id: null, status: null }); setReviewNotes(''); }}
                                disabled={reviewing}
                                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReviewApplication}
                                disabled={reviewing}
                                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                                    reviewModal.status === 'approved'
                                        ? 'bg-green-500 hover:bg-green-600 text-white'
                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                            >
                                {reviewing ? 'Processing...' : (reviewModal.status === 'approved' ? 'Approve' : 'Reject')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;
