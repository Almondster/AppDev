import React, { useState, useEffect } from 'react';
import { fetchSupportTickets as apiFetchTickets, fetchReports as apiFetchReports, updateSupportTicket, updateReport } from '../api';
import { AlertOctagon, CheckCircle, MessageSquare, Send } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const DisputesPage = () => {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');

    // Response modal state
    const [responseModal, setResponseModal] = useState({ open: false, id: null, type: '' });
    const [responseText, setResponseText] = useState('');
    const [responding, setResponding] = useState(false);

    // Resolve confirm
    const [resolveConfirm, setResolveConfirm] = useState({ open: false, id: null, type: '' });
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [ticketsRes, reportsRes] = await Promise.all([apiFetchTickets(), apiFetchReports()]);
                const items = [];

                if (ticketsRes.ok) {
                    (ticketsRes.data.results || ticketsRes.data || []).forEach(t => {
                        items.push({
                            id: t.id,
                            rawId: `TKT-${t.id}`,
                            type: 'ticket',
                            client: t.user_id || 'Unknown',
                            creator: '—',
                            status: t.status || 'open',
                            date: t.created_at ? new Date(t.created_at).toLocaleDateString() : '—',
                            issue: t.message || t.subject || t.description || 'No description',
                            adminResponse: t.admin_response || '',
                        });
                    });
                }
                if (reportsRes.ok) {
                    (reportsRes.data.results || reportsRes.data || []).forEach(r => {
                        items.push({
                            id: r.id,
                            rawId: `RPT-${r.id}`,
                            type: 'report',
                            client: r.reporter_id || 'Unknown',
                            creator: r.reported_id || 'Unknown',
                            status: r.status || 'pending',
                            date: r.created_at ? new Date(r.created_at).toLocaleDateString() : '—',
                            issue: r.reason || 'No reason provided',
                            adminResponse: '',
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

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    const handleResolve = async () => {
        setResolving(true);
        const { id, type } = resolveConfirm;
        try {
            if (type === 'ticket') {
                const { ok } = await updateSupportTicket(id, { status: 'resolved', resolved_at: new Date().toISOString() });
                if (ok) {
                    setDisputes(prev => prev.map(d => d.id === id && d.type === 'ticket' ? { ...d, status: 'resolved' } : d));
                    showToast('Ticket resolved.');
                }
            } else {
                const { ok } = await updateReport(id, {
                    status: 'resolved',
                    admin_notes: 'Resolved by admin',
                });
                if (ok) {
                    setDisputes(prev => prev.map(d => d.id === id && d.type === 'report' ? { ...d, status: 'resolved' } : d));
                    showToast('Report marked as resolved.');
                } else {
                    showToast('Failed to resolve report.');
                }
            }
        } catch { showToast('Failed to resolve.'); }
        setResolving(false);
        setResolveConfirm({ open: false, id: null, type: '' });
    };

    const handleSendResponse = async () => {
        if (!responseText.trim()) return;
        setResponding(true);
        const { id } = responseModal;
        try {
            const { ok } = await updateSupportTicket(id, { admin_response: responseText.trim() });
            if (ok) {
                setDisputes(prev => prev.map(d => d.id === id && d.type === 'ticket' ? { ...d, adminResponse: responseText.trim() } : d));
                showToast('Response sent.');
                setResponseModal({ open: false, id: null, type: '' });
                setResponseText('');
            }
        } catch { showToast('Failed to send response.'); }
        setResponding(false);
    };

    const getStatusStyle = (status) => {
        if (status === 'resolved') return { bg: 'rgba(16,185,129,0.1)', color: '#10b981' };
        if (status === 'closed') return { bg: 'rgba(113,113,122,0.1)', color: '#71717a' };
        return { bg: 'rgba(239,68,68,0.1)', color: '#f87171' };
    };

    return (
        <main className="dashboard-content page-fade role-page">
            {toast && <div className="global-toast global-toast--success">{toast}</div>}

            <header className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(24, 24, 27, 0.6))', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Active Disputes</h1>
                        <AlertOctagon size={28} color="#ef4444" />
                    </div>
                    <p style={{ color: '#fca5a5', fontSize: '1rem', margin: 0 }}>Arbitrate platform conflicts and review escrow claims.</p>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                    <p style={{ color: '#fca5a5', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Open Items</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{disputes.filter(d => d.status !== 'resolved').length}</h2>
                </div>
            </header>

            {loading ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading disputes...</div>
            ) : disputes.length === 0 ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No disputes or support tickets found.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {disputes.map((dispute) => {
                        const st = getStatusStyle(dispute.status);
                        return (
                            <div key={dispute.rawId} className="glass-card" style={{ padding: '1.5rem', borderLeft: `4px solid ${st.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: 0 }}>{dispute.rawId}</h3>
                                            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: st.bg, color: st.color }}>{dispute.status}</span>
                                        </div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Filed on {dispute.date} • From: {dispute.client}</p>
                                    </div>
                                    {/* Action buttons */}
                                    {dispute.status !== 'resolved' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {dispute.type === 'ticket' && (
                                                <button onClick={() => { setResponseModal({ open: true, id: dispute.id, type: dispute.type }); setResponseText(dispute.adminResponse || ''); }}
                                                    style={{ padding: '0.45rem 0.85rem', borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <MessageSquare size={14} /> Respond
                                                </button>
                                            )}
                                            <button onClick={() => setResolveConfirm({ open: true, id: dispute.id, type: dispute.type })}
                                                style={{ padding: '0.45rem 0.85rem', borderRadius: 8, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <CheckCircle size={14} /> Resolve
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>{dispute.issue}</p>
                                </div>
                                {dispute.adminResponse && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.08)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)' }}>
                                        <p style={{ color: '#818cf8', fontSize: '0.85rem', margin: 0 }}><strong>Admin Response:</strong> {dispute.adminResponse}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Resolve Confirm */}
            <ConfirmModal
                open={resolveConfirm.open}
                title="Resolve this item?"
                message="This will mark the dispute as resolved."
                variant="success"
                confirmLabel="Resolve"
                loading={resolving}
                onConfirm={handleResolve}
                onCancel={() => setResolveConfirm({ open: false, id: null, type: '' })}
            />

            {/* Response Modal */}
            {responseModal.open && (
                <div className="confirm-overlay" onClick={() => setResponseModal({ open: false, id: null, type: '' })}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="confirm-modal__title">Admin Response</h3>
                        <textarea
                            value={responseText}
                            onChange={e => setResponseText(e.target.value)}
                            placeholder="Type your response to the user..."
                            style={{ width: '100%', minHeight: 120, marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical' }}
                        />
                        <div className="confirm-modal__actions" style={{ marginTop: '1rem' }}>
                            <button className="confirm-modal__btn confirm-modal__btn--cancel" onClick={() => setResponseModal({ open: false, id: null, type: '' })}>Cancel</button>
                            <button className="confirm-modal__btn confirm-modal__btn--confirm" onClick={handleSendResponse} disabled={responding || !responseText.trim()}>
                                {responding ? 'Sending...' : 'Send Response'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default DisputesPage;
