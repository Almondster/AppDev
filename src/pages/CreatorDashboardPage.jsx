import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/useProjects';
import { useOrders } from '../context/useOrders';
import { CheckCircle2, Briefcase, Banknote, Clock } from 'lucide-react';
import '../styles/CreatorDashboardPage.css';

const CreatorDashboardPage = () => {
    const navigate = useNavigate();
    const { projects, completedProjects, activeProjects } = useProjects();
    const { orders, completedOrders, activeOrders, totalEarnings } = useOrders();

    return (
        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            <header className="hero-gradient" style={{ padding: '3rem 2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Creator Hub</h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Manage your services and track your freelance business.</p>
            </header>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer' }} onClick={() => navigate('/my-gigs')}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '1rem', borderRadius: '16px' }}>
                        <CheckCircle2 size={28} />
                    </div>
                    <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Gigs</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>{projects.length}</p>
                    </div>
                </div>

                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '1rem', borderRadius: '16px' }}>
                        <Briefcase size={28} />
                    </div>
                    <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Orders</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>{activeOrders.length}</p>
                    </div>
                </div>

                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '1rem', borderRadius: '16px' }}>
                        <Banknote size={28} />
                    </div>
                    <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earnings</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>₱{totalEarnings.toLocaleString()}</p>
                    </div>
                </div>
            </section>

            <section className="glass-card">
                <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Active Orders</h2>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>{activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={() => navigate('/orders')} style={{ padding: '8px 16px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                        View All Orders →
                    </button>
                </div>

                <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activeOrders.length > 0 ? (
                        activeOrders.slice(0, 3).map((order) => (
                            <div key={order.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '4px' }}>{order.service}</h3>
                                    <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Client: {order.client} • ₱{(order.amount || 0).toLocaleString()}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={14} color="#a1a1aa" />
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        background: order.status === 'In Progress' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(250, 204, 21, 0.1)',
                                        color: order.status === 'In Progress' ? '#38bdf8' : '#facc15'
                                    }}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#71717a' }}>
                            <p style={{ fontSize: '2rem', margin: '0 0 1rem' }}>🎯</p>
                            <p>No active orders found. Create gigs and wait for clients to place orders!</p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
};

export default CreatorDashboardPage;
