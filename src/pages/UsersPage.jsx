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
    return (
        <main className="dashboard-content page-fade" style={{ padding: '2rem 0' }}>
            {/* Header */}
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
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: 0 }}>12,842</h2>
                </div>
            </header>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '0.5rem' }}>
                    <Search size={18} color="#a1a1aa" />
                    <label htmlFor="usersSearch" className="sr-only">Search users by name or ID</label>
                    <input id="usersSearch" type="text" placeholder="Search users by name or ID..." style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }} />
                </div>
                <button className="glass-card" style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Filter size={18} />
                    <span>Filter</span>
                </button>
            </div>

            {/* Users List */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.5fr', gap: '1rem', color: '#a1a1aa', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>User</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Joined</span>
                    <span>Reports</span>
                    <span style={{ textAlign: 'right' }}>Action</span>
                </div>

                {mockUsers.map((user) => (
                    <div key={user.id} className="glass-card--hover" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.5fr', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>
                                {user.name.charAt(0)}
                            </div>
                            <span style={{ color: '#fff', fontWeight: '500' }}>{user.name}</span>
                        </div>
                        <span style={{ color: '#d4d4d8' }}>{user.role}</span>
                        <div>
                            <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: user.status === 'Active' ? 'rgba(34, 197, 94, 0.1)' : user.status === 'Warning' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: user.status === 'Active' ? '#4ade80' : user.status === 'Warning' ? '#fbbf24' : '#f87171'
                            }}>
                                {user.status}
                            </span>
                        </div>
                        <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>{user.joined}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {user.reports > 0 && <ShieldAlert size={14} color="#f87171" />}
                            <span style={{ color: user.reports > 0 ? '#f87171' : '#a1a1aa' }}>{user.reports}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <button style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                                <MoreVertical size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default UsersPage;
