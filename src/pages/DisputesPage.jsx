import React, { useState, useEffect } from 'react';
import { fetchSupportTickets as apiFetchTickets, fetchReports as apiFetchReports } from '../api';
import { AlertOctagon, Scale, MessageSquare, CheckCircle } from 'lucide-react';

const DisputesPage = () => {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [ticketsRes, reportsRes] = await Promise.all([apiFetchTickets(), apiFetchReports()]);
                const items = [];

                if (ticketsRes.ok) {
                    (ticketsRes.data.results || ticketsRes.data || []).forEach(t => {
                        items.push({
                            id: `TKT-${t.id}`,
                            client: t.user_id || 'Unknown',
                            creator: '—',
                            amount: '—',
                            status: t.status || 'open',
                            date: t.created_at ? new Date(t.created_at).toLocaleDateString() : '—',
                            issue: t.subject || t.description || 'No description',
                        });
                    });
                }
                if (reportsRes.ok) {
                    (reportsRes.data.results || reportsRes.data || []).forEach(r => {
                        items.push({
                            id: `RPT-${r.id}`,
                            client: r.reporter_id || 'Unknown',
                            creator: r.reported_id || 'Unknown',
                            amount: '—',
                            status: r.status || 'pending',
                            date: r.created_at ? new Date(r.created_at).toLocaleDateString() : '—',
                            issue: r.reason || 'No reason provided',
                        });
                    });
                }

                setDisputes(items);
            } catch (err) {
                console.error('Failed to load disputes:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <main className="dashboard-content page-fade" style={{ padding: '2rem 0' }}>
            <header className="glass-card" style={{ padding: '2.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(24, 24, 27, 0.6))', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: 0 }}>Active Disputes</h1>
                        <AlertOctagon size={28} color="#ef4444" />
                    </div>
                    <p style={{ color: '#fca5a5', fontSize: '1rem', margin: 0 }}>Arbitrate platform conflicts and review escrow claims.</p>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                    <p style={{ color: '#fca5a5', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Open Items</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: 0 }}>{disputes.length}</h2>
                </div>
            </header>

            {loading ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#a1a1aa' }}>Loading disputes...</div>
            ) : disputes.length === 0 ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>No disputes or support tickets found.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {disputes.map((dispute) => (
                        <div key={dispute.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>{dispute.id}</h3>
                                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>{dispute.status}</span>
                                    </div>
                                    <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Filed on {dispute.date}</p>
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                                <p style={{ color: '#d4d4d8', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>{dispute.issue}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
};

export default DisputesPage;
