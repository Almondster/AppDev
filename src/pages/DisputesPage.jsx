import { useState, useEffect } from 'react';
import { fetchSupportTickets, updateSupportTicket } from '../services/api';
import { Search, MessageSquare, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const DisputesPage = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [respondingTo, setRespondingTo] = useState(null);
    const [response, setResponse] = useState('');

    const loadTickets = () => {
        setLoading(true);
        fetchSupportTickets()
            .then(data => setTickets(data?.results || data || []))
            .catch(err => console.error('Failed to fetch tickets:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadTickets(); }, []);

    const handleResolve = async (id) => {
        try {
            await updateSupportTicket(id, { status: 'resolved', resolved_at: new Date().toISOString() });
            loadTickets();
        } catch (err) {
            console.error('Failed to resolve ticket:', err);
        }
    };

    const handleRespond = async (id) => {
        if (!response.trim()) return;
        try {
            await updateSupportTicket(id, { admin_response: response, status: 'resolved', resolved_at: new Date().toISOString() });
            setRespondingTo(null);
            setResponse('');
            loadTickets();
        } catch (err) {
            console.error('Failed to respond:', err);
        }
    };

    const filtered = tickets.filter(t => {
        const matchFilter = filter === 'all' || t.status === filter;
        const matchSearch = (t.ticket_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchFilter && matchSearch;
    });

    const statusIcon = (status) => {
        if (status === 'open') return <Clock size={16} color="#facc15" />;
        if (status === 'resolved') return <CheckCircle size={16} color="#22c55e" />;
        return <AlertTriangle size={16} color="#ef4444" />;
    };

    const statusBadge = (status) => {
        const colors = {
            open: { bg: 'rgba(250, 204, 21, 0.1)', color: '#facc15' },
            resolved: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
            closed: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' },
        };
        const c = colors[status] || colors.open;
        return <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', background: c.bg, color: c.color }}>{status}</span>;
    };

    return (
        <section className="section page-fade">
            <header className="section__header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <h2 className="section__title">Support Tickets ({tickets.length})</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input type="text" placeholder="Search tickets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '8px 16px 8px 36px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                    <div className="filter-group">
                        {['all', 'open', 'resolved'].map(f => (
                            <button key={f} className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`} onClick={() => setFilter(f)}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="empty-state"><p>Loading tickets...</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filtered.length > 0 ? filtered.map(ticket => (
                        <div key={ticket.id} className="glass-card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        {statusIcon(ticket.status)}
                                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', margin: 0, fontWeight: '600' }}>
                                            #{ticket.ticket_number}
                                        </h3>
                                        {statusBadge(ticket.status)}
                                        {ticket.priority && ticket.priority !== 'normal' && (
                                            <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>{ticket.priority}</span>
                                        )}
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{ticket.email} • {ticket.category || 'General'} • {ticket.user_role || 'user'}</p>
                                </div>
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : ''}</span>
                            </div>

                            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1rem', background: 'var(--input-bg)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                {ticket.message}
                            </p>

                            {ticket.admin_response && (
                                <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                                    <p style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Admin Response</p>
                                    <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', margin: 0 }}>{ticket.admin_response}</p>
                                </div>
                            )}

                            {ticket.status === 'open' && (
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {respondingTo === ticket.id ? (
                                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <textarea
                                                value={response}
                                                onChange={(e) => setResponse(e.target.value)}
                                                placeholder="Type your response..."
                                                rows={3}
                                                style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleRespond(ticket.id)} style={{ padding: '0.5rem 1rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Send & Resolve</button>
                                                <button onClick={() => { setRespondingTo(null); setResponse(''); }} style={{ padding: '0.5rem 1rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={() => setRespondingTo(ticket.id)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MessageSquare size={14} /> Respond
                                            </button>
                                            <button onClick={() => handleResolve(ticket.id)} style={{ padding: '0.5rem 1rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <CheckCircle size={14} /> Resolve
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="empty-state"><p>No tickets found.</p></div>
                    )}
                </div>
            )}
        </section>
    );
};

export default DisputesPage;
