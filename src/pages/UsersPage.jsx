import React, { useState, useEffect } from 'react';
import { ShieldAlert, BadgeCheck, MoreVertical, Search, Filter } from 'lucide-react';
import { fetchUsers as apiFetchUsers } from '../api';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const { ok, data } = await apiFetchUsers();
                if (ok) {
                    const list = data.results || data || [];
                    setUsers(list.map(u => ({
                        id: u.id,
                        name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
                        role: capitalize(u.role || 'client'),
                        status: u.is_active !== false ? 'Active' : 'Suspended',
                        joined: u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
                        reports: 0,
                    })));
                }
            } catch (err) {
                console.error('Failed to load users:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="dashboard-content page-fade" style={{ padding: '2rem 0' }}>
            <header className="glass-card hero-gradient" style={{ padding: '2.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: 0 }}>Platform Users</h1>
                        <BadgeCheck size={28} color="#3b82f6" />
                    </div>
                    <p style={{ color: '#a1a1aa', fontSize: '1rem', margin: 0 }}>Manage accounts, verify creators, and handle suspensions.</p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Users</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: 0 }}>{users.length}</h2>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '0.5rem' }}>
                    <Search size={18} color="#a1a1aa" />
                    <label htmlFor="usersSearch" className="sr-only">Search users</label>
                    <input id="usersSearch" type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }} />
                </div>
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#a1a1aa' }}>Loading users...</div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', color: '#a1a1aa', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span>User</span>
                        <span>Role</span>
                        <span>Status</span>
                        <span>Joined</span>
                    </div>
                    {filtered.map((user) => (
                        <div key={user.id} className="glass-card--hover" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ color: '#fff', fontWeight: '500' }}>{user.name}</span>
                            </div>
                            <span style={{ color: '#d4d4d8' }}>{user.role}</span>
                            <div>
                                <span style={{
                                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                                    backgroundColor: user.status === 'Active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: user.status === 'Active' ? '#4ade80' : '#f87171'
                                }}>{user.status}</span>
                            </div>
                            <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>{user.joined}</span>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#71717a' }}>No users found.</div>
                    )}
                </div>
            )}
        </main>
    );
};

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

export default UsersPage;
