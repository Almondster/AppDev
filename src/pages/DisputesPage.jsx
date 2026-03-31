import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, Scale, MessageSquare, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import '../styles/DisputesPage.css';

const initialDisputes = [
    { id: 'DSP-8842', client: 'TechFlow Solutions', creator: 'Alex Rivera', amount: 45000, status: 'Requires Arbitration', date: 'Oct 24, 2026', issue: 'Client claims milestones were missed despite creator providing deliverable proof.', showEvidence: false },
    { id: 'DSP-8843', client: 'Digital Studio V', creator: 'Sarah Chen', amount: 12500, status: 'Pending Evidence', date: 'Oct 25, 2026', issue: 'Creator alleges client stopped responding after final files were transferred.', showEvidence: false },
    { id: 'DSP-8844', client: 'GreenCo', creator: 'You', amount: 500, status: 'Pending Evidence', date: 'Nov 01, 2026', issue: 'Client unsatisfied with logo direction. Requesting revision beyond agreed scope.', showEvidence: false },
];

const DisputesPage = () => {
    const navigate = useNavigate();
    const [disputes, setDisputes] = useState(initialDisputes);
    const { notification, showNotification } = useNotification();

    const activeDisputes = disputes.filter(d => d.status !== 'Resolved');
    const totalEscrow = activeDisputes.reduce((sum, d) => sum + d.amount, 0);

    const handleResolve = (id) => {
        setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: 'Resolved' } : d));
        showNotification(`Dispute ${id} has been resolved.`);
    };

    const toggleEvidence = (id) => {
        setDisputes(prev => prev.map(d => d.id === id ? { ...d, showEvidence: !d.showEvidence } : d));
    };

    const statusColor = (status) => {
        if (status === 'Resolved') return { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' };
        if (status === 'Requires Arbitration') return { bg: 'rgba(239,68,68,0.1)', color: '#f87171' };
        return { bg: 'rgba(250,204,21,0.1)', color: '#fbbf24' };
    };

    return (
        <main className="dashboard-content page-fade" style={{ padding: '2rem 0' }}>
            {notification && (
                <div className={`notification notification--${notification.type}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <header className="glass-card" style={{
                padding: '2.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), var(--dispute-gradient-end))', border: '1px solid rgba(239,68,68,0.2)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Active Disputes</h1>
                        <AlertOctagon size={28} color="#ef4444" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>Arbitrate platform conflicts and review escrow claims.</p>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                    <p style={{ color: '#fca5a5', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Escrow in Dispute</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>₱{totalEscrow.toLocaleString()}</h2>
                </div>
            </header>

            {/* Disputes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {disputes.map((dispute) => {
                    const sc = statusColor(dispute.status);
                    return (
                        <div key={dispute.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: dispute.status === 'Resolved' ? '4px solid #22c55e' : '4px solid #ef4444', opacity: dispute.status === 'Resolved' ? 0.7 : 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: 0 }}>{dispute.id}</h3>
                                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: sc.bg, color: sc.color }}>
                                            {dispute.status}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Filed on {dispute.date}</p>
                                </div>
                                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', margin: 0 }}>₱{dispute.amount.toLocaleString()}</h3>
                            </div>

                            <div style={{ background: 'var(--card-bg)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                                    <div>
                                        <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Client</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{dispute.client}</span>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Creator</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{dispute.creator}</span>
                                    </div>
                                </div>
                                <div>
                                    <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Reported Issue</span>
                                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>{dispute.issue}</p>
                                </div>
                            </div>

                            {/* Evidence Panel */}
                            {dispute.showEvidence && (
                                <div className="page-fade" style={{ background: 'var(--input-bg)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                                    <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.75rem', fontSize: '0.95rem' }}>📎 Submitted Evidence</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'var(--card-bg)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            📄 <strong>deliverables_final.zip</strong> — Uploaded by {dispute.creator} on {dispute.date}
                                        </div>
                                        <div style={{ padding: '0.75rem', background: 'var(--card-bg)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            📄 <strong>contract_agreement.pdf</strong> — Uploaded by {dispute.client} on {dispute.date}
                                        </div>
                                        <div style={{ padding: '0.75rem', background: 'var(--card-bg)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            💬 <strong>Chat transcript</strong> — 47 messages between parties
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => toggleEvidence(dispute.id)}
                                    style={{ flex: 1, padding: '0.75rem', background: dispute.showEvidence ? '#7c3aed' : '#e11d48', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {dispute.showEvidence ? <><ChevronUp size={18} /> Hide Evidence</> : <><Scale size={18} /> Review Evidence</>}
                                </button>
                                <button
                                    onClick={() => navigate('/messages')}
                                    style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <MessageSquare size={18} /> Message Parties
                                </button>
                                {dispute.status !== 'Resolved' && (
                                    <button
                                        onClick={() => handleResolve(dispute.id)}
                                        style={{ padding: '0.75rem 1.5rem', background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <CheckCircle size={18} /> Resolve
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </main>
    );
};

export default DisputesPage;
