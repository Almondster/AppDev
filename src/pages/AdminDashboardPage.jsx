import React from 'react';
import { Users, BarChart3, AlertTriangle, ShieldCheck } from 'lucide-react';

const AdminDashboardPage = () => {
    return (
        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            <header className="hero-gradient" style={{ padding: '3rem 2rem', background: 'linear-gradient(to right, rgba(244, 63, 94, 0.2), rgba(168, 85, 247, 0.2))' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={36} color="#f43f5e" /> Admin Command
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Platform health, active disputes, and user metrics.</p>
            </header>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '1rem', borderRadius: '16px' }}>
                        <Users size={28} />
                    </div>
                    <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>1,245</p>
                    </div>
                </div>

                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '1rem', borderRadius: '16px' }}>
                        <BarChart3 size={28} />
                    </div>
                    <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Revenue</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>₱124,500</p>
                    </div>
                </div>

                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '1rem', borderRadius: '16px' }}>
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <p style={{ color: '#fca5a5', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Disputes</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f87171', margin: 0 }}>5</p>
                    </div>
                </div>
            </section>

            <section className="glass-card">
                <div className="glass-card-header">
                    <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Platform Activity Alerts</h2>
                </div>
                <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '4px' }}>Dispute Raised: Order #ORD-789</h3>
                                <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Client flagged an issue with recent delivery.</p>
                            </div>
                        </div>
                        <button style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>
                            Review Case
                        </button>
                    </div>

                    <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '4px' }}>Registration Spike</h3>
                                <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Unusual volume of new Creator registrations (50+ in last hour).</p>
                            </div>
                        </div>
                        <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>1hr ago</span>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default AdminDashboardPage;
