import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { Users, BarChart3, AlertTriangle, ShieldCheck, ArrowRight, Briefcase, Settings as SettingsIcon } from 'lucide-react';

const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const { orders, services, projects, totalRevenue } = useProjects();

    const activeOrders = orders.filter(o => o.status === 'In Progress' || o.status === 'Pending');
    const suspendedOrders = orders.filter(o => o.status === 'Suspended');
    const platformRevenue = Math.round(totalRevenue * 0.15);
    const recentOrders = orders.slice(0, 5);

    return (
        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            <header className="hero-gradient" style={{ padding: '3rem 2rem', background: 'linear-gradient(to right, rgba(244, 63, 94, 0.2), rgba(168, 85, 247, 0.2))' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={36} color="#f43f5e" /> Admin Command
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Platform health, active disputes, and user metrics.</p>
            </header>

            {/* Live Stats */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer' }} onClick={() => navigate('/users')}>
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '1rem', borderRadius: '16px' }}>
                        <Users size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Projects</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{projects.length}</p>
                    </div>
                </div>

                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer' }} onClick={() => navigate('/projects')}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '1rem', borderRadius: '16px' }}>
                        <BarChart3 size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Revenue</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>₱{platformRevenue.toLocaleString()}</p>
                    </div>
                </div>

                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.3)' }} onClick={() => navigate('/disputes')}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '1rem', borderRadius: '16px' }}>
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <p style={{ color: '#fca5a5', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suspended Orders</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f87171', margin: 0 }}>{suspendedOrders.length}</p>
                    </div>
                </div>

                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer' }} onClick={() => navigate('/projects')}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '1rem', borderRadius: '16px' }}>
                        <Briefcase size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Orders</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{activeOrders.length}</p>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/users')} style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} /> Manage Users
                </button>
                <button onClick={() => navigate('/projects')} style={{ padding: '0.75rem 1.5rem', background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Briefcase size={16} /> All Projects
                </button>
                <button onClick={() => navigate('/disputes')} style={{ padding: '0.75rem 1.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} /> View Disputes
                </button>
                <button onClick={() => navigate('/settings')} style={{ padding: '0.75rem 1.5rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <SettingsIcon size={16} /> Platform Settings
                </button>
            </section>

            {/* Recent Orders Table */}
            <section className="glass-card">
                <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Recent Orders</h2>
                    <button onClick={() => navigate('/projects')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                        View All <ArrowRight size={14} />
                    </button>
                </div>
                <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {recentOrders.length > 0 ? recentOrders.map(order => (
                        <div key={order.id} style={{ padding: '1rem 1.25rem', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', margin: '0 0 2px' }}>{order.title}</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                                    {order.creator} → {order.clientName} • ₱{(order.budget || 0).toLocaleString()}
                                </p>
                            </div>
                            <span style={{
                                padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase',
                                background: order.status === 'Completed' ? 'rgba(34,197,94,0.1)' : order.status === 'In Progress' ? 'rgba(56,189,248,0.1)' : order.status === 'Suspended' ? 'rgba(239,68,68,0.1)' : 'rgba(250,204,21,0.1)',
                                color: order.status === 'Completed' ? '#22c55e' : order.status === 'In Progress' ? '#38bdf8' : order.status === 'Suspended' ? '#ef4444' : '#facc15'
                            }}>
                                {order.status}
                            </span>
                        </div>
                    )) : (
                        <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem' }}>No orders yet.</p>
                    )}
                </div>
            </section>

            {/* Marketplace Services Overview */}
            <section className="glass-card">
                <div className="glass-card-header">
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Active Marketplace Services</h2>
                </div>
                <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {services.filter(s => s.status === 'Active').map(service => (
                        <div key={service.id} style={{ padding: '1rem 1.25rem', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', margin: '0 0 2px' }}>{service.title}</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>by {service.creator} • ₱{service.budget.toLocaleString()}</p>
                            </div>
                            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>ACTIVE</span>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
};

export default AdminDashboardPage;