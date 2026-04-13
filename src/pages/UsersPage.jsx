import { useState, useEffect } from 'react';
import { fetchUsers, suspendUser, activateUser } from '../services/api';
import { Search, MoreHorizontal, ShieldCheck, ShieldOff, User, Filter } from 'lucide-react';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [actionMenuId, setActionMenuId] = useState(null);

    const loadUsers = () => {
        setLoading(true);
        fetchUsers()
            .then(data => {
                setUsers(data?.results || data || []);
            })
            .catch(err => console.error('Failed to fetch users:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadUsers(); }, []);

    const handleSuspend = async (userId) => {
        try {
            await suspendUser(userId);
            loadUsers();
        } catch (err) {
            console.error('Suspend failed:', err);
        }
        setActionMenuId(null);
    };

    const handleActivate = async (userId) => {
        try {
            await activateUser(userId);
            loadUsers();
        } catch (err) {
            console.error('Activate failed:', err);
        }
        setActionMenuId(null);
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.full_name || u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const roleBadge = (role) => {
        const colors = {
            admin: { bg: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' },
            creator: { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
            client: { bg: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' },
        };
        const c = colors[role] || colors.client;
        return (
            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', background: c.bg, color: c.color }}>
                {role}
            </span>
        );
    };

    return (
        <section className="section page-fade">
            <header className="section__header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <h2 className="section__title">User Management ({users.length})</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '8px 16px 8px 36px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                    >
                        <option value="all">All Roles</option>
                        <option value="client">Client</option>
                        <option value="creator">Creator</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </header>

            {loading ? (
                <div className="empty-state"><p>Loading users...</p></div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id || user.firebase_uid} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '0.8rem', flexShrink: 0 }}>
                                                {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{user.full_name || user.display_name || 'Unnamed'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email}</td>
                                    <td style={{ padding: '12px 16px' }}>{roleBadge(user.role)}</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', position: 'relative' }}>
                                        <button
                                            onClick={() => setActionMenuId(actionMenuId === user.firebase_uid ? null : user.firebase_uid)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>
                                        {actionMenuId === user.firebase_uid && (
                                            <div style={{
                                                position: 'absolute', right: '16px', top: '100%', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', zIndex: 10, minWidth: '140px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                                            }}>
                                                <button onClick={() => handleActivate(user.firebase_uid)} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', borderRadius: '4px' }}>
                                                    <ShieldCheck size={14} /> Activate
                                                </button>
                                                <button onClick={() => handleSuspend(user.firebase_uid)} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', borderRadius: '4px' }}>
                                                    <ShieldOff size={14} /> Suspend
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="empty-state"><p>No users found.</p></div>
                    )}
                </div>
            )}
        </section>
    );
};

export default UsersPage;
