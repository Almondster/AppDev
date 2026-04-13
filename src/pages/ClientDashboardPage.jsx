import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useNotification } from '../hooks/useNotification';
import { Target, CreditCard, Clock, Star, ArrowRight, ShoppingCart, Search } from 'lucide-react';
import '../styles/ClientDashboardPage.css';

const ClientDashboardPage = ({ firebaseUid }) => {
    const { services, orders, hireCreator, loading } = useProjects();
    const { notification, showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState('marketplace');
    const [searchTerm, setSearchTerm] = useState('');

    // Client's own orders from API
    const myOrders = orders;
    const activeHires = myOrders.filter(o => o.status === 'In Progress' || o.status === 'Pending');
    const completedHires = myOrders.filter(o => o.status === 'Completed');
    const totalSpent = completedHires.reduce((sum, o) => sum + (o.budget || 0), 0);

    // Available marketplace services
    const availableServices = services
        .filter(s => s.status === 'Active')
        .filter(s =>
            (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.creator || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

    const handleHire = async (serviceId) => {
        try {
            const result = await hireCreator(serviceId, 'Client');
            if (result) {
                showNotification(`Successfully hired! Order is now pending.`);
            }
        } catch (err) {
            showNotification(`Failed to create order: ${err.message}`);
        }
    };

    return (
        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            {notification && (
                <div className={`notification notification--${notification.type}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
                    {notification.message}
                </div>
            )}

            <header className="hero-gradient" style={{ padding: '3rem 2rem', background: 'linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome, Client!</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Browse the marketplace and hire top creators.</p>
            </header>

            {/* Stats from live data */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '1rem', borderRadius: '16px' }}>
                        <Target size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Hires</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{activeHires.length}</p>
                    </div>
                </div>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '16px' }}>
                        <CreditCard size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Spent</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>₱{totalSpent.toLocaleString()}</p>
                    </div>
                </div>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(250, 204, 21, 0.1)', color: '#facc15', padding: '1rem', borderRadius: '16px' }}>
                        <Clock size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Orders</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{orders.filter(o => o.status === 'Pending').length}</p>
                    </div>
                </div>
            </section>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
                <button className={`glass-tab ${activeTab === 'marketplace' ? 'glass-tab--active' : ''}`} onClick={() => setActiveTab('marketplace')}>
                    Browse Marketplace
                </button>
                <button className={`glass-tab ${activeTab === 'hires' ? 'glass-tab--active' : ''}`} onClick={() => setActiveTab('hires')}>
                    Active Hires ({activeHires.length})
                </button>
            </div>

            {/* Marketplace Tab */}
            {activeTab === 'marketplace' && (
                <section>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '0.5rem' }}>
                            <Search size={18} color="var(--text-secondary)" />
                            <label htmlFor="marketplaceSearch" className="sr-only">Search marketplace</label>
                            <input
                                id="marketplaceSearch"
                                type="text"
                                placeholder="Search services or creators..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {loading ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                                <p>Loading services...</p>
                            </div>
                        ) : availableServices.length > 0 ? availableServices.map(service => (
                            <div key={service.id} className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: 0, fontWeight: '600' }}>{service.title}</h3>
                                    <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '1.1rem', flexShrink: 0, marginLeft: '1rem' }}>₱{(service.budget || 0).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '0.6rem' }}>
                                        {(service.creator || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{service.creator || 'Unknown'}</span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: '1.4' }}>{service.description}</p>
                                <button
                                    onClick={() => handleHire(service.id)}
                                    style={{
                                        marginTop: '0.5rem',
                                        padding: '0.7rem 1.25rem',
                                        background: '#22c55e',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#16a34a'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#22c55e'}
                                >
                                    <ShoppingCart size={16} /> Hire Creator
                                </button>
                            </div>
                        )) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                                <p>No services available at the moment.</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Active Hires Tab */}
            {activeTab === 'hires' && (
                <section className="glass-card">
                    <div className="glass-card-header">
                        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Active Hires</h2>
                    </div>
                    <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {activeHires.length > 0 ? activeHires.map(order => (
                            <div key={order.id} style={{ padding: '1.25rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '4px' }}>{order.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Creator: {order.creator} • ₱{(order.budget || 0).toLocaleString()}</p>
                                </div>
                                <span style={{
                                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase',
                                    background: order.status === 'In Progress' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(250, 204, 21, 0.1)',
                                    color: order.status === 'In Progress' ? '#38bdf8' : '#facc15'
                                }}>
                                    {order.status}
                                </span>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                                <p>No active hires. Browse the marketplace to get started!</p>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </main>
    );
};

export default ClientDashboardPage;