import React, { useState, useEffect } from 'react';
import { Users, BarChart3, AlertTriangle, ShieldCheck, Tag, Plus, Trash2, Package } from 'lucide-react';
import { fetchUsers as apiFetchUsers, fetchOrders as apiFetchOrders, fetchSupportTickets as apiFetchTickets, fetchCategories, createCategory, deleteCategory, fetchServices } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const AdminDashboardPage = () => {
    const [userCount, setUserCount] = useState(0);
    const [orderCount, setOrderCount] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [ticketCount, setTicketCount] = useState(0);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Categories state
    const [categories, setCategories] = useState([]);
    const [catForm, setCatForm] = useState({ name: '', description: '' });
    const [catLoading, setCatLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
    const [deleting, setDeleting] = useState(false);
    const [serviceCount, setServiceCount] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const [uRes, oRes, tRes, cRes, sRes] = await Promise.all([
                    apiFetchUsers({ includeInactive: true }),
                    apiFetchOrders(),
                    apiFetchTickets(),
                    fetchCategories(),
                    fetchServices({ include_deleted: true }),
                ]);
                if (uRes.ok) {
                    const users = uRes.data.results || uRes.data || [];
                    setUserCount(users.length);
                }
                if (oRes.ok) {
                    const orders = oRes.data.results || oRes.data || [];
                    setOrderCount(orders.length);
                    setTotalRevenue(orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + parseFloat(o.price || 0), 0));
                    setRecentOrders(orders.slice(0, 3));
                }
                if (tRes.ok) {
                    const tickets = tRes.data.results || tRes.data || [];
                    setTicketCount(tickets.length);
                }
                if (cRes.ok) setCategories(cRes.data.results || cRes.data || []);
                if (sRes.ok) setServiceCount((sRes.data.results || sRes.data || []).length);
            } catch (err) {
                console.error('Admin dashboard error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        setCatLoading(true);
        try {
            const { ok, data } = await createCategory({ label: catForm.name, icon: catForm.description });
            if (ok) {
                setCategories(prev => [...prev, data]);
                setCatForm({ name: '', description: '' });
            }
        } catch (err) {
            console.error('Failed to add category:', err);
        }
        setCatLoading(false);
    };

    const handleDeleteCategory = async () => {
        setDeleting(true);
        try {
            const { ok } = await deleteCategory(deleteConfirm.id);
            if (ok) setCategories(prev => prev.filter(c => c.id !== deleteConfirm.id));
        } catch (err) {
                console.error('Failed to delete category:', err);
            }
            setDeleting(false);
            setDeleteConfirm({ open: false, id: null, name: '' });
        };

    return (
        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            <header className="hero-gradient" style={{ padding: '3rem 2rem', background: 'linear-gradient(to right, rgba(244, 63, 94, 0.2), rgba(168, 85, 247, 0.2))' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={36} color="#f43f5e" /> Admin Command
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Platform health, active disputes, and user metrics.</p>
            </header>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '1rem', borderRadius: '16px' }}><Users size={28} /></div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{loading ? '...' : userCount}</p>
                    </div>
                </div>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '1rem', borderRadius: '16px' }}><BarChart3 size={28} /></div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Revenue</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>₱{loading ? '...' : totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '1rem', borderRadius: '16px' }}><Package size={28} /></div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Listings</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{loading ? '...' : serviceCount}</p>
                    </div>
                </div>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'var(--bg-secondary)' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '1rem', borderRadius: '16px' }}><AlertTriangle size={28} /></div>
                    <div>
                        <p style={{ color: '#fca5a5', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support Tickets</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f87171', margin: 0 }}>{loading ? '...' : ticketCount}</p>
                    </div>
                </div>
            </section>

            <section className="glass-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="glass-card-header">
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Recent Orders ({orderCount} total)</h2>
                </div>
                <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {recentOrders.map(order => (
                        <div key={order.id} style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '4px' }}>{order.service_title || `Order #${order.id}`}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>₱{parseFloat(order.price || 0).toLocaleString()} • {order.status}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {recentOrders.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No orders found.</div>
                    )}
                </div>
            </section>

            {/* Categories Management */}
            <section className="glass-card">
                <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Tag size={20} /> Manage Categories ({categories.length})</h2>
                </div>
                <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="Category label" required
                            style={{ flex: 1, padding: '0.6rem 0.9rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', minWidth: 150 }} />
                        <input value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} placeholder="Icon (optional)"
                            style={{ flex: 2, padding: '0.6rem 0.9rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', minWidth: 200 }} />
                        <button type="submit" disabled={catLoading} style={{ padding: '0.6rem 1.2rem', borderRadius: 10, background: '#6366f1', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Plus size={16} /> {catLoading ? 'Adding...' : 'Add'}
                        </button>
                    </form>
                    {categories.length === 0 ? (
                        <p style={{ color: '#52525b', textAlign: 'center', padding: '1.5rem' }}>No categories yet. Add one above.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
                            {categories.map(c => (
                                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <p style={{ color: '#fff', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{c.label || c.name}</p>
                                        {(c.icon || c.description) && <p style={{ color: '#71717a', fontSize: '0.8rem', margin: '2px 0 0' }}>{c.icon || c.description}</p>}
                                    </div>
                                    <button onClick={() => setDeleteConfirm({ open: true, id: c.id, name: c.name })} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <ConfirmModal
                open={deleteConfirm.open}
                title="Delete Category?"
                message={<>Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?</>}
                variant="danger"
                confirmLabel="Delete"
                loading={deleting}
                onConfirm={handleDeleteCategory}
                onCancel={() => setDeleteConfirm({ open: false, id: null, name: '' })}
            />
        </main>
    );
};

export default AdminDashboardPage;
