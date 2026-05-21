import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Clock3, Search, ShieldCheck, Trash2, UserRoundX } from 'lucide-react';
import {
    activateUser,
    deleteUser,
    fetchCreatorApplications,
    fetchUsers as apiFetchUsers,
    getApiOrigin,
    reviewCreatorApplication,
    suspendUser,
} from '../api';
import ConfirmModal from '../components/ConfirmModal';
import RoleBadge from '../components/RoleBadge';
import '../styles/UsersPage.css';
import { readCollection } from '../utils/collections';
import { humanizeLabel } from '../utils/text';

const API_UPLOAD_ORIGIN = getApiOrigin();

const emptyConfirmModal = { open: false, id: null, action: '', userName: '' };
const emptyBanModal = { open: false, id: null, userName: '', suspendedUntil: '', reason: '' };

const parseApiDate = (value) => {
    if (!value) return null;
    const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value, options) => {
    const parsed = parseApiDate(value);
    if (!parsed) return '—';
    return parsed.toLocaleString('en-US', options);
};

const toAssetUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_UPLOAD_ORIGIN}${path}`;
};

const getUserStatus = (user) => {
    if (user.is_active === false) {
        return {
            label: 'Deleted',
            detail: 'Account deleted',
            tone: 'deleted',
        };
    }

    const suspendedUntil = parseApiDate(user.suspended_until);
    if (suspendedUntil && suspendedUntil > new Date()) {
        return {
            label: 'Banned',
            detail: `Until ${suspendedUntil.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            })}`,
            tone: 'banned',
        };
    }

    return {
        label: 'Active',
        detail: 'Can access account',
        tone: 'active',
    };
};

const statusPillStyle = (tone) => {
    if (tone === 'banned') {
        return {
            backgroundColor: 'rgba(245, 158, 11, 0.14)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.22)',
        };
    }
    if (tone === 'deleted') {
        return {
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.22)',
        };
    }
    return {
        backgroundColor: 'rgba(34, 197, 94, 0.12)',
        color: '#4ade80',
        border: '1px solid rgba(34, 197, 94, 0.18)',
    };
};

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [toast, setToast] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Confirm modal
    const [confirmModal, setConfirmModal] = useState({ open: false, id: null, action: '', userName: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadAdminData();
    }, [loadAdminData]);

    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const loadAdminData = useCallback(async () => {
        setLoading(true);
        try {
            const { ok, data } = await apiFetchUsers();
            if (ok) {
                const list = data.results || data || [];
                setUsers(list.map(u => ({
                    id: u.id,
                    firebase_uid: u.firebase_uid,
                    username: u.username || u.email,
                    email: u.email,
                    role: u.role || 'client',
                    is_active: u.is_active !== false,
                    created_at: u.created_at,
                })));
            }
        } catch (err) {
            console.error('Failed to load users:', err);
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const filtered = users.filter(u => {
        const matchSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = filterRole === 'all' || u.role === filterRole;
        const matchStatus = filterStatus === 'all' || 
                          (filterStatus === 'active' && u.is_active) ||
                          (filterStatus === 'suspended' && !u.is_active);
        return matchSearch && matchRole && matchStatus;
    });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleMenuClick = (e, userId) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === userId ? null : userId);
    };

    const handleAction = (action, user) => {
        setOpenMenuId(null);
        setConfirmModal({ 
            open: true, 
            id: user.id, 
            action, 
            userName: user.username 
        });
    };

    const handleConfirmAction = async () => {
        const { id, action, userName } = confirmModal;
        setActionLoading(true);
        try {
            let ok = false;
            
            if (action === 'suspend') {
                const result = await suspendUser(id);
                ok = result.ok;
            } else if (action === 'activate') {
                const result = await activateUser(id);
                ok = result.ok;
            } else if (action === 'delete') {
                // For now, we'll just suspend the user
                const result = await suspendUser(id);
                ok = result.ok;
            } else if (action === 'make_admin') {
                const result = await patchUser(id, { role: 'admin' });
                ok = result.ok;
            } else if (action === 'make_creator') {
                const result = await patchUser(id, { role: 'creator' });
                ok = result.ok;
            } else if (action === 'make_client') {
                const result = await patchUser(id, { role: 'client' });
                ok = result.ok;
            }

            if (ok) {
                await loadUsers();
                showToast(`${userName} has been ${getActionMessage(action)}.`, 'success');
            } else {
                showToast(`Failed to ${action} user.`, 'error');
            }
        } catch (err) {
            console.error('Action failed:', err);
            showToast(`Failed to ${action} user.`, 'error');
        }
        setActionLoading(false);
        setConfirmModal({ open: false, id: null, action: '', userName: '' });
    };

    const getActionMessage = (action) => {
        const messages = {
            suspend: 'suspended',
            activate: 'activated',
            delete: 'deleted',
            make_admin: 'promoted to admin',
            make_creator: 'changed to creator',
            make_client: 'changed to client',
        };
        return messages[action] || action;
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
            creator: { bg: 'rgba(168, 85, 247, 0.1)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
            client: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
        };
        return colors[role] || colors.client;
    };

    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        suspended: users.filter(u => !u.is_active).length,
        admins: users.filter(u => u.role === 'admin').length,
        creators: users.filter(u => u.role === 'creator').length,
        clients: users.filter(u => u.role === 'client').length,
    };

    return (
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full pb-20">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg backdrop-blur-md shadow-lg ${
                    toast.type === 'success' 
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                    <p className="text-sm">{toast.msg}</p>
                </div>
            )}

            {/* Header with Admin Theme */}
            <div className="rounded-2xl p-6 md:p-8" style={{ 
                background: 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(168,85,247,0.08))',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                        background: 'rgba(244,63,94,0.1)',
                        border: '1px solid rgba(244,63,94,0.2)'
                    }}>
                        <UsersIcon size={22} className="text-rose-400" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Platform Users</h1>
                </div>
                <p className="text-zinc-400 text-sm">Manage accounts, roles, and user permissions.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Active</p>
                    <p className="text-2xl font-bold text-green-400">{stats.active}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Suspended</p>
                    <p className="text-2xl font-bold text-red-400">{stats.suspended}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Admins</p>
                    <p className="text-2xl font-bold text-red-400">{stats.admins}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Creators</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.creators}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Clients</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.clients}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
                    />
                </div>
                <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:border-white/20"
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="creator">Creator</option>
                    <option value="client">Client</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:border-white/20"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-zinc-500">Loading users...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">User</th>
                                    <th className="text-left p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</th>
                                    <th className="text-left p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Joined</th>
                                    <th className="text-right p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((user) => {
                                    const roleColor = getRoleBadgeColor(user.role);
                                    return (
                                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-white font-medium">{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-zinc-400 text-sm">{user.email}</td>
                                            <td className="p-4">
                                                <span 
                                                    className="px-3 py-1 rounded-full text-xs font-semibold uppercase"
                                                    style={{ 
                                                        background: roleColor.bg, 
                                                        color: roleColor.text,
                                                        border: `1px solid ${roleColor.border}`
                                                    }}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    user.is_active 
                                                        ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                                                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                }`}>
                                                    {user.is_active ? 'Active' : 'Suspended'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-zinc-400 text-sm">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="relative inline-block">
                                                    <button
                                                        onClick={(e) => handleMenuClick(e, user.id)}
                                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>
                                                    
                                                    {openMenuId === user.id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 py-1">
                                                            {/* Change Role */}
                                                            <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/5">
                                                                Change Role
                                                            </div>
                                                            {user.role !== 'admin' && (
                                                                <button
                                                                    onClick={() => handleAction('make_admin', user)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                                                                >
                                                                    <Shield size={14} className="text-red-400" />
                                                                    Make Admin
                                                                </button>
                                                            )}
                                                            {user.role !== 'creator' && (
                                                                <button
                                                                    onClick={() => handleAction('make_creator', user)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                                                                >
                                                                    <CheckCircle size={14} className="text-purple-400" />
                                                                    Make Creator
                                                                </button>
                                                            )}
                                                            {user.role !== 'client' && (
                                                                <button
                                                                    onClick={() => handleAction('make_client', user)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                                                                >
                                                                    <CheckCircle size={14} className="text-blue-400" />
                                                                    Make Client
                                                                </button>
                                                            )}
                                                            
                                                            <div className="border-t border-white/5 my-1" />
                                                            
                                                            {/* Status Actions */}
                                                            {user.is_active ? (
                                                                <button
                                                                    onClick={() => handleAction('suspend', user)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                                                >
                                                                    <Ban size={14} />
                                                                    Suspend User
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAction('activate', user)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-green-500/10 flex items-center gap-2"
                                                                >
                                                                    <CheckCircle size={14} />
                                                                    Activate User
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="p-12 text-center text-zinc-500">No users found.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                open={confirmModal.open}
                title={`${confirmModal.action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} User?`}
                message={<>Are you sure you want to {getActionMessage(confirmModal.action)} <strong className="text-white">{confirmModal.userName}</strong>?</>}
                variant={confirmModal.action === 'suspend' || confirmModal.action === 'delete' ? 'danger' : 'info'}
                confirmLabel={confirmModal.action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                loading={actionLoading}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmModal({ open: false, id: null, action: '', userName: '' })}
            />
        </div>
    );
};

export default UsersPage;
