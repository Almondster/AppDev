import React from 'react';
import { ShieldAlert, BadgeCheck, MoreVertical, Search, Filter } from 'lucide-react';

const mockUsers = [
    { id: 1, name: 'Alex Rivera', role: 'Creator', status: 'Active', joined: 'Jan 12, 2026', reports: 0 },
    { id: 2, name: 'TechFlow Solutions', role: 'Client', status: 'Active', joined: 'Feb 03, 2026', reports: 1 },
    { id: 3, name: 'Sarah Chen', role: 'Creator', status: 'Suspended', joined: 'Nov 15, 2025', reports: 4 },
    { id: 4, name: 'Mike Johnson', role: 'Client', status: 'Active', joined: 'Mar 22, 2026', reports: 0 },
    { id: 5, name: 'Digital Studio V', role: 'Creator', status: 'Warning', joined: 'Dec 05, 2025', reports: 2 }
];

const UsersPage = () => {
    const [users, setUsers] = useState(mockUsersData);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const { notification, showNotification } = useNotification();

    const filteredUsers = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = roleFilter === 'All' || u.role === roleFilter;
        const matchStatus = statusFilter === 'All' || u.status === statusFilter;
        return matchSearch && matchRole && matchStatus;
    });

    const handleAction = (userId, action) => {
        setUsers(prev => prev.map(u => {
            if (u.id !== userId) return u;
            switch (action) {
                case 'suspend': return { ...u, status: 'Suspended' };
                case 'warn': return { ...u, status: 'Warning', reports: u.reports + 1 };
                case 'activate': return { ...u, status: 'Active' };
                case 'delete': return null;
                default: return u;
            }
        }).filter(Boolean));

        const labels = { suspend: 'User suspended', warn: 'Warning issued', activate: 'User activated', delete: 'User removed' };
        showNotification(labels[action] || 'Action completed', action === 'delete' ? 'info' : 'success');
        setOpenMenuId(null);
    };

    return (
        <main className="dashboard-content page-fade" style={{ padding: '2rem 0' }}>
            {/* Header */}
            <header className="glass-card hero-gradient" style={{ padding: '2.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Platform Users</h1>
                        <BadgeCheck size={28} color="#3b82f6" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>Manage accounts, verify creators, and handle suspensions.</p>
                </div>
                <div style={{ background: 'var(--glass-overlay)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid var(--glass-overlay-border)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Users</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{users.length}</h2>
                </div>
            </header>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '0.5rem' }}>
                    <Search size={18} color="#a1a1aa" />
                    <label htmlFor="usersSearch" className="sr-only">Search users by name or ID</label>
                    <input id="usersSearch" type="text" placeholder="Search users by name or ID..." style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }} />
                </div>
                <button
                    className="glass-card"
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', cursor: 'pointer', border: showFilters ? '1px solid #3b82f6' : '1px solid var(--glass-overlay-border)' }}
                >
                    <ChevronDown size={18} />
                    <span>Filter</span>
                </button>
            </div>

            {/* Filter Row */}
            {showFilters && (
                <div className="glass-card page-fade" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem 1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Role:</span>
                        {['All', 'Creator', 'Client'].map(r => (
                            <button key={r} onClick={() => setRoleFilter(r)} style={{
                                padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
                                background: roleFilter === r ? '#3b82f6' : 'var(--input-bg)', color: roleFilter === r ? '#fff' : 'var(--text-secondary)'
                            }}>{r}</button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Status:</span>
                        {['All', 'Active', 'Warning', 'Suspended'].map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)} style={{
                                padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
                                background: statusFilter === s ? '#3b82f6' : 'var(--input-bg)', color: statusFilter === s ? '#fff' : 'var(--text-secondary)'
                            }}>{s}</button>
                        ))}
                    </div>
                </div>
            )}

            {/* Users List */}
            <div className="glass-card" style={{ overflow: 'visible' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.5fr', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>User</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Joined</span>
                    <span>Reports</span>
                    <span style={{ textAlign: 'right' }}>Action</span>
                </div>

                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                    <div key={user.id} className="glass-card--hover" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.5fr', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>
                                {user.name.charAt(0)}
                            </div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{user.name}</span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>{user.role}</span>
                        <div>
                            <span style={{
                                padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                                backgroundColor: user.status === 'Active' ? 'rgba(34,197,94,0.1)' : user.status === 'Warning' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                                color: user.status === 'Active' ? '#4ade80' : user.status === 'Warning' ? '#fbbf24' : '#f87171'
                            }}>
                                {user.status}
                            </span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user.joined}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {user.reports > 0 && <ShieldAlert size={14} color="#f87171" />}
                            <span style={{ color: user.reports > 0 ? '#f87171' : 'var(--text-secondary)' }}>{user.reports}</span>
                        </div>
                        <div style={{ textAlign: 'right', position: 'relative' }}>
                            <button
                                onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                            >
                                <MoreVertical size={18} />
                            </button>
                            {openMenuId === user.id && (
                                <div style={{
                                    position: 'absolute', right: 0, top: '100%', background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                                    borderRadius: '8px', padding: '0.5rem 0', minWidth: '150px', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}>
                                    {user.status !== 'Active' && (
                                        <button onClick={() => handleAction(user.id, 'activate')} style={menuBtnStyle('#22c55e')}>✓ Activate</button>
                                    )}
                                    {user.status !== 'Warning' && (
                                        <button onClick={() => handleAction(user.id, 'warn')} style={menuBtnStyle('#fbbf24')}>⚠ Warn</button>
                                    )}
                                    {user.status !== 'Suspended' && (
                                        <button onClick={() => handleAction(user.id, 'suspend')} style={menuBtnStyle('#f87171')}>⛔ Suspend</button>
                                    )}
                                    <button onClick={() => handleAction(user.id, 'delete')} style={{ ...menuBtnStyle('#ef4444'), borderTop: '1px solid var(--border-color)', marginTop: '0.25rem', paddingTop: '0.75rem' }}>🗑 Delete</button>
                                </div>
                            )}
                        </div>
                    </div>
                )) : (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        <p>No users match your search.</p>
                    </div>
                )}
            </div>
        </main>
    );
};

const menuBtnStyle = (color) => ({
    display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 1rem', background: 'transparent',
    border: 'none', color, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
});

export default UsersPage;
