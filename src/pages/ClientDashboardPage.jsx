
import { Target, CreditCard, Clock, Star, ArrowRight } from 'lucide-react';
import '../styles/ClientDashboardPage.css';

const ClientDashboardPage = () => {
    return (
        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            <header className="hero-gradient" style={{ padding: '3rem 2rem', background: 'linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome, Client!</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage your hired creators and active contracts.</p>
            </header>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '1rem', borderRadius: '16px' }}>
                        <Target size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projects Hired</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>12</p>
                    </div>
                </div>

                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '16px' }}>
                        <CreditCard size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Spent</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>₱45,200</p>
                    </div>
                </div>

                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(250, 204, 21, 0.1)', color: '#facc15', padding: '1rem', borderRadius: '16px' }}>
                        <Clock size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Approvals</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>2</p>
                    </div>
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <section className="glass-card">
                    <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Favorite Creators</h2>
                        <button className="glass-tab glass-tab--active" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            View All <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="glass-card-body" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '16px' }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} style={{ minWidth: '140px', background: 'var(--card-bg)', padding: '1.5rem 1rem', borderRadius: '12px', border: `1px solid var(--border-color)`, textAlign: 'center' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-tertiary)', margin: '0 auto 12px' }} />
                                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', margin: '0 0 4px' }}>Creator Name</h4>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', color: '#fbbf24', fontSize: '0.8rem' }}>
                                    <Star size={12} fill="currentColor" /> 4.9
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="glass-card">
                    <div className="glass-card-header">
                        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Active Hires</h2>
                    </div>
                    <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '1.25rem', background: 'var(--card-bg)', borderRadius: '12px', border: `1px solid var(--border-color)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '4px' }}>E-Commerce App UI</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Creator: Jane Doe • ₱15,000</p>
                            </div>
                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                                In Progress
                            </span>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default ClientDashboardPage;