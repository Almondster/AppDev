import React from 'react';
import { AlertOctagon, Scale, MessageSquare, CheckCircle } from 'lucide-react';

const mockDisputes = [
    { id: 'DSP-8842', client: 'TechFlow Solutions', creator: 'Alex Rivera', amount: '₱45,000', status: 'Requires Arbitration', date: 'Oct 24, 2026', issue: 'Client claims milestones were missed despite creator providing deliverable proof.' },
    { id: 'DSP-8843', client: 'Digital Studio V', creator: 'Sarah Chen', amount: '₱12,500', status: 'Pending Evidence', date: 'Oct 25, 2026', issue: 'Creator alleges client stopped responding after final files were transferred.' }
];

const DisputesPage = () => {
    return (
        <main className="dashboard-content page-fade" style={{ padding: '2rem 0' }}>
            {/* Header (Red Tinted for Alerts) */}
            <header className="glass-card" style={{
                padding: '2.5rem',
                marginBottom: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(24, 24, 27, 0.6))',
                border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: 0 }}>Active Disputes</h1>
                        <AlertOctagon size={28} color="#ef4444" />
                    </div>
                    <p style={{ color: '#fca5a5', fontSize: '1rem', margin: 0 }}>Arbitrate platform conflicts and review escrow claims.</p>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                    <p style={{ color: '#fca5a5', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Escrow in Dispute</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: 0 }}>₱57,500</h2>
                </div>
            </header>

            {/* Disputes Layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {mockDisputes.map((dispute) => (
                    <div key={dispute.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>{dispute.id}</h3>
                                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                                        {dispute.status}
                                    </span>
                                </div>
                                <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Filed on {dispute.date}</p>
                            </div>
                            <h3 style={{ color: '#fff', fontSize: '1.25rem', margin: 0 }}>{dispute.amount}</h3>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                                <div>
                                    <span style={{ display: 'block', color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Client</span>
                                    <span style={{ color: '#fff', fontWeight: '500' }}>{dispute.client}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Creator</span>
                                    <span style={{ color: '#fff', fontWeight: '500' }}>{dispute.creator}</span>
                                </div>
                            </div>
                            <div>
                                <span style={{ display: 'block', color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Reported Issue</span>
                                <p style={{ color: '#d4d4d8', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>{dispute.issue}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{ flex: 1, padding: '0.75rem', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <Scale size={18} /> Review Evidence
                            </button>
                            <button style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: '#d4d4d8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <MessageSquare size={18} /> Message Parties
                            </button>
                            <button style={{ padding: '0.75rem 1.5rem', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={18} /> Resolve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default DisputesPage;
