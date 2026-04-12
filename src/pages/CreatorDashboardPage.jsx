import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyCreatorOrders as apiFetchOrders, fetchMyServices as apiFetchServices, fetchReviews, createService, deleteService, getUserData, fetchAnalytics } from '../api';
import { Eye, MousePointerClick, Briefcase, DollarSign, Clock, Star, Plus, X, Upload, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import './CreatorDashboardPage.css';

const CreatorDashboardPage = () => {
    const [tab, setTab] = useState('overview');
    const [orders, setOrders] = useState([]);
    const [services, setServices] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [serviceForm, setServiceForm] = useState({ title: '', price: '', category: 'Design & Creative', subcategory: 'Logo Design', description: '', image_url: '' });
    const [formMsg, setFormMsg] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, title: '' });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const userData = getUserData();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const [oRes, sRes, rRes] = await Promise.all([
                    apiFetchOrders(),
                    apiFetchServices(),
                    fetchReviews(),
                ]);
                if (oRes.ok) setOrders(oRes.data.results || oRes.data || []);
                if (sRes.ok) setServices(sRes.data.results || sRes.data || []);
                if (rRes.ok) {
                    const allReviews = rRes.data.results || rRes.data || [];
                    // Filter reviews for this creator
                    const uid = userData?.firebase_uid;
                    setReviews(uid ? allReviews.filter(r => r.reviewee_id === uid) : allReviews);
                }
            } catch (err) {
                console.error('Failed to load dashboard:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const completed = orders.filter(o => o.status === 'completed');
    const active = orders.filter(o => ['in_progress', 'accepted', 'delivered', 'pending'].includes(o.status));
    const revenue = completed.reduce((s, o) => s + parseFloat(o.price || 0), 0);
    const todayRevenue = completed.filter(o => {
        const d = new Date(o.updated_at || o.created_at);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    }).reduce((s, o) => s + parseFloat(o.price || 0), 0);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : '0.0';

    const handleCreateService = async (e) => {
        e.preventDefault();
        try {
            const { ok, data } = await createService({
                creator_id: userData?.firebase_uid,
                title: serviceForm.title,
                label: serviceForm.title,
                description: serviceForm.description,
                price: parseFloat(serviceForm.price) || 0,
                category: serviceForm.category,
                image_url: serviceForm.image_url || null,
                is_public: true,
                is_deleted: false,
            });
            if (ok) {
                setServices(prev => [...prev, data]);
                setServiceForm({ title: '', price: '', category: 'Design & Creative', subcategory: 'Logo Design', description: '', image_url: '' });
                setShowModal(false);
                setFormMsg('Service created successfully!');
                setTimeout(() => setFormMsg(''), 3000);
            }
        } catch {
            setFormMsg('Connection error.');
            setTimeout(() => setFormMsg(''), 3000);
        }
    };

    const handleDeleteService = async () => {
        if (!deleteConfirm.id) return;
        setDeleteLoading(true);
        try {
            await deleteService(deleteConfirm.id);
            setServices(prev => prev.filter(s => s.id !== deleteConfirm.id));
        } catch { /* ignore */ }
        setDeleteLoading(false);
        setDeleteConfirm({ open: false, id: null, title: '' });
    };

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
                    <button className={`studio-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}>My Services</button>
                    <button className={`studio-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>Reviews</button>
                </div>
                <div className="studio-actions">
                    <button className="studio-btn-outline" onClick={() => navigate('/creator-profile')}>
                        <Star size={14} /> View Public Profile
                    </button>
                    {tab === 'services' && (
                        <button className="studio-btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={14} /> Add Service
                        </button>
                    )}
                </div>
            </div>

            {formMsg && <div className="global-toast global-toast--success">{formMsg}</div>}

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
            {loading && tab === 'services' && (
                <div className="services-grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="service-card" style={{ pointerEvents: 'none' }}>
                            <div className="service-card-img"><div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }}></div></div>
                            <div className="service-card-body">
                                <div className="skeleton" style={{ width: '75%', height: 18, marginBottom: 8 }}></div>
                                <div className="skeleton" style={{ width: '90%', height: 14, marginBottom: 5 }}></div>
                                <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 14 }}></div>
                                <div className="skeleton-divider"></div>
                                <div className="skeleton-row" style={{ justifyContent: 'space-between' }}>
                                    <div className="skeleton" style={{ width: 70, height: 20 }}></div>
                                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
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
                            <div className="ic-top"><Eye size={20} className="ic-icon ic-icon--blue" /><span className="ic-badge ic-badge--green">→ +0%</span></div>
                            <p className="ic-value">{loading ? '...' : 0}</p>
                            <p className="ic-label">Views</p>
                        </div>
                        <div className="interaction-card">
                            <div className="ic-top"><MousePointerClick size={20} className="ic-icon ic-icon--orange" /><span className="ic-badge ic-badge--green">→ +0%</span></div>
                            <p className="ic-value">{loading ? '...' : 0}</p>
                            <p className="ic-label">Clicks</p>
                        </div>
                        <div className="interaction-card">
                            <div className="ic-top"><Briefcase size={20} className="ic-icon ic-icon--red" /><span className="ic-badge ic-badge--green">→ +0%</span></div>
                            <p className="ic-value">{loading ? '...' : active.length}</p>
                            <p className="ic-label">Active Jobs</p>
                        </div>
                        <div className="interaction-card">
                            <div className="ic-top"><DollarSign size={20} className="ic-icon ic-icon--purple" /><span className="ic-badge ic-badge--green">→ +0%</span></div>
                            <p className="ic-value">₱{loading ? '...' : (revenue / 1000).toFixed(1)}k</p>
                            <p className="ic-label">Total Revenue</p>
                        </div>
                    </div>

                    {/* Bottom Row: Ongoing Projects + Revenue Analytics */}
                    <div className="overview-bottom">
                        <div className="bottom-card">
                            <div className="bottom-card-header">
                                <h3>Ongoing Projects</h3>
                                <a onClick={(e) => { e.preventDefault(); navigate('/projects'); }} href="#" className="view-all-link">View All</a>
                            </div>
                            <div className="bottom-card-body">
                                {active.length > 0 ? active.slice(0, 3).map(o => (
                                    <div key={o.id} className="ongoing-item">
                                        <span className="ongoing-title">{o.service_title || `Order #${o.id}`}</span>
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

            {/* ─── MY SERVICES TAB ─── */}
            {!loading && tab === 'services' && (
                <div className="studio-services">
                    {services.length === 0 ? (
                        <p className="empty-text" style={{ marginTop: '3rem' }}>No services found. Create your first service to get started.</p>
                    ) : (
                        <div className="services-grid">
                            {services.map(svc => (
                                <div key={svc.id} className="service-card">
                                    <div className="service-card-img">
                                        {svc.image_url ? <img src={svc.image_url} alt={svc.title} /> : <div className="service-card-placeholder">{(svc.title || 'S').charAt(0)}</div>}
                                    </div>
                                    <div className="service-card-body">
                                        <h4>{svc.title || svc.label}</h4>
                                        {svc.description && <p className="service-desc">{svc.description.slice(0, 80)}{svc.description.length > 80 ? '...' : ''}</p>}
                                        <div className="service-card-footer">
                                            <span className="service-price">₱{parseFloat(svc.price || 0).toLocaleString()}</span>
                                            <button onClick={() => handleDeleteService(svc.id)} className="service-delete-btn"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                                    <div className="review-avatar">{(r.reviewer_name || r.reviewer_id || 'U').charAt(0).toUpperCase()}</div>
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

            {/* ─── CREATE SERVICE MODAL ─── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Service</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateService} className="modal-form">
                            <label className="modal-label">Cover Image URL</label>
                            <input type="url" placeholder="https://example.com/my-service-cover.jpg" value={serviceForm.image_url} onChange={e => setServiceForm(p => ({ ...p, image_url: e.target.value }))} style={{ marginBottom: '1rem' }} />

                            <div className="form-row">
                                <div className="form-col">
                                    <label className="modal-label">Service Title</label>
                                    <input type="text" placeholder="e.g. Professional Logo Design" required value={serviceForm.title} onChange={e => setServiceForm(p => ({ ...p, title: e.target.value }))} />
                                </div>
                                <div className="form-col">
                                    <label className="modal-label">Starting Price (₱)</label>
                                    <input type="number" placeholder="e.g. 5000" required min="1" value={serviceForm.price} onChange={e => setServiceForm(p => ({ ...p, price: e.target.value }))} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-col">
                                    <label className="modal-label">Category</label>
                                    <select value={serviceForm.category} onChange={e => setServiceForm(p => ({ ...p, category: e.target.value }))}>
                                        <option>Design & Creative</option>
                                        <option>Development & IT</option>
                                        <option>Digital Marketing</option>
                                        <option>Music & Audio</option>
                                        <option>Video & Animation</option>
                                        <option>Writing & Translation</option>
                                    </select>
                                </div>
                                <div className="form-col">
                                    <label className="modal-label">Subcategory</label>
                                    <select value={serviceForm.subcategory} onChange={e => setServiceForm(p => ({ ...p, subcategory: e.target.value }))}>
                                        <option>Logo Design</option>
                                        <option>Brand Identity</option>
                                        <option>Illustration</option>
                                        <option>UI/UX Design</option>
                                        <option>Print Design</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            <label className="modal-label">Description</label>
                            <textarea rows={4} placeholder="Describe what you will provide..." value={serviceForm.description} onChange={e => setServiceForm(p => ({ ...p, description: e.target.value }))} />

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-create">Create Service</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Service Confirm */}
            <ConfirmModal
                open={deleteConfirm.open}
                title="Delete Service?"
                message={<>Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This action cannot be undone.</>}
                variant="danger"
                confirmLabel="Delete"
                loading={deleteLoading}
                onConfirm={handleDeleteService}
                onCancel={() => setDeleteConfirm({ open: false, id: null, title: '' })}
            />
        </main>
    );
};

export default CreatorDashboardPage;
