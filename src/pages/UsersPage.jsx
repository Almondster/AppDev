import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Clock3, Search, ShieldCheck, Trash2, UserRoundX } from 'lucide-react';
import {
    activateUser,
    deleteUser,
    fetchCreatorApplications,
    fetchUsers as apiFetchUsers,
    reviewCreatorApplication,
    suspendUser,
} from '../api';
import ConfirmModal from '../components/ConfirmModal';
import RoleBadge from '../components/RoleBadge';
import '../styles/UsersPage.css';
import { readCollection } from '../utils/collections';
import { humanizeLabel } from '../utils/text';

const API_UPLOAD_ORIGIN = import.meta.env.DEV
    ? 'http://127.0.0.1:8000'
    : (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/api\/?$/, '');

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
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState('');
    const [reviewNotes, setReviewNotes] = useState({});
    const [reviewingId, setReviewingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState(emptyConfirmModal);
    const [banModal, setBanModal] = useState(emptyBanModal);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadAdminData();
    }, []);

    const showToast = (message) => {
        setToast(message);
        window.setTimeout(() => setToast(''), 3500);
    };

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const [usersRes, appsRes] = await Promise.all([
                apiFetchUsers({ includeInactive: true, pageSize: 200 }),
                fetchCreatorApplications({ status: 'pending', pageSize: 100 }),
            ]);

            if (usersRes.ok) {
                setUsers(readCollection(usersRes));
            }
            if (appsRes.ok) {
                setApplications(readCollection(appsRes));
            }
        } catch (error) {
            console.error('Failed to load admin data:', error);
            showToast('Failed to load admin data.');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        const needle = searchTerm.trim().toLowerCase();
        if (!needle) return users;
        return users.filter((user) => {
            const status = getUserStatus(user);
            return [
                user.username,
                user.email,
                user.role,
                status.label,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(needle));
        });
    }, [searchTerm, users]);

    const stats = useMemo(() => {
        const active = users.filter((user) => getUserStatus(user).tone === 'active').length;
        const banned = users.filter((user) => getUserStatus(user).tone === 'banned').length;
        const deleted = users.filter((user) => getUserStatus(user).tone === 'deleted').length;
        return {
            total: users.length,
            pendingApplications: applications.length,
            active,
            banned,
            deleted,
        };
    }, [applications.length, users]);

    const handleReview = async (applicationId, status) => {
        setReviewingId(applicationId);
        try {
            const { ok, data } = await reviewCreatorApplication(applicationId, {
                status,
                admin_notes: reviewNotes[applicationId]?.trim() || null,
            });
            if (!ok) {
                showToast(data?.detail || `Failed to ${status} application.`);
                return;
            }

            setApplications((prev) => prev.filter((application) => application.id !== applicationId));
            setUsers((prev) => prev.map((user) => (
                String(user.id) === String(data.user_id) && status === 'approved'
                    ? { ...user, role: 'creator' }
                    : user
            )));
            setReviewNotes((prev) => ({ ...prev, [applicationId]: '' }));
            showToast(`Application ${status}.`);
        } catch (error) {
            console.error('Failed to review application:', error);
            showToast(`Failed to ${status} application.`);
        } finally {
            setReviewingId(null);
        }
    };

    const handleBanSubmit = async () => {
        const suspendedDate = banModal.suspendedUntil ? new Date(banModal.suspendedUntil) : null;
        if (!suspendedDate || Number.isNaN(suspendedDate.getTime())) {
            showToast('Choose a valid ban end date and time.');
            return;
        }

        setActionLoading(true);
        try {
            const { ok, data } = await suspendUser(banModal.id, {
                suspended_until: suspendedDate.toISOString(),
                suspension_reason: banModal.reason.trim() || null,
            });
            if (!ok) {
                showToast(data?.detail || 'Failed to ban user.');
                return;
            }

            setUsers((prev) => prev.map((user) => (
                String(user.id) === String(banModal.id)
                    ? { ...user, suspended_until: data.suspended_until, suspension_reason: data.suspension_reason, is_active: data.is_active }
                    : user
            )));
            setBanModal(emptyBanModal);
            showToast(`${banModal.userName} is now banned until ${suspendedDate.toLocaleString('en-US')}.`);
        } catch (error) {
            console.error('Failed to ban user:', error);
            showToast('Failed to ban user.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmAction = async () => {
        const { id, action, userName } = confirmModal;
        setActionLoading(true);
        try {
            if (action === 'activate') {
                const { ok, data } = await activateUser(id);
                if (!ok) {
                    showToast(data?.detail || 'Failed to lift ban.');
                    return;
                }
                setUsers((prev) => prev.map((user) => (
                    String(user.id) === String(id)
                        ? { ...user, is_active: data.is_active, suspended_until: data.suspended_until, suspension_reason: data.suspension_reason }
                        : user
                )));
                showToast(`${userName} can access the account again.`);
            }

            if (action === 'delete') {
                const { ok, data } = await deleteUser(id);
                if (!ok) {
                    showToast(data?.detail || 'Failed to delete user.');
                    return;
                }
                setUsers((prev) => prev.map((user) => (
                        String(user.id) === String(id)
                        ? {
                            ...user,
                            username: `Deleted User ${id}`,
                            email: 'Deleted account',
                            is_active: false,
                            suspended_until: null,
                            suspension_reason: null,
                        }
                        : user
                )));
                await loadAdminData();
                showToast(`${userName} was deleted.`);
            }
        } catch (error) {
            console.error('Failed to perform admin action:', error);
            showToast(`Failed to ${action} user.`);
        } finally {
            setActionLoading(false);
            setConfirmModal(emptyConfirmModal);
        }
    };

    return (
        <main className="dashboard-content page-fade" style={{ padding: '2rem 0' }}>
            {toast && <div className="global-toast global-toast--success">{toast}</div>}

            <header className="glass-card hero-gradient" style={{ padding: '2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Platform Users</h1>
                        <BadgeCheck size={28} color="#3b82f6" />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
                        Review creator applications, ban users for a fixed period, and permanently delete accounts.
                    </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', gap: '0.85rem', minWidth: 'min(100%, 360px)' }}>
                    {[
                        ['Users', stats.total],
                        ['Pending Applications', stats.pendingApplications],
                        ['Active', stats.active],
                        ['Banned / Deleted', stats.banned + stats.deleted],
                    ].map(([label, value]) => (
                        <div key={label} style={{ background: 'var(--bg-secondary)', padding: '1rem 1.15rem', borderRadius: '14px', border: '1px solid var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}> {label} </p>
                            <h2 style={{ fontSize: '1.7rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0.35rem 0 0' }}>{value}</h2>
                        </div>
                    ))}
                </div>
            </header>

            <section className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <ShieldCheck size={18} color="#818cf8" />
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem' }}>Pending Creator Applications</h2>
                </div>

                {loading ? (
                    <div style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Loading applications...</div>
                ) : applications.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', padding: '0.4rem 0 0.2rem' }}>No pending creator applications.</div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {applications.map((application) => (
                            <article key={application.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>
                                            {application.applicant_name || `${application.first_name} ${application.last_name}`}
                                        </h3>
                                        <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                            {application.applicant_email || 'No email'} • {application.category || 'No category selected'}
                                        </p>
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                        Submitted {formatDate(application.created_at, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem', marginBottom: '0.95rem' }}>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identity</p>
                                        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                            {application.phone || 'No phone'}<br />
                                            ID #{application.id_number || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</p>
                                        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                            {[application.street_address, application.barangay, application.city, application.province, application.postal_code]
                                                .filter(Boolean)
                                                .join(', ') || 'Not provided'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile</p>
                                        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                            {application.experience_years || '0'} yrs exp • PHP {application.starting_price || '0'}<br />
                                            {application.turnaround_time || 'No turnaround provided'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.95rem' }}>
                                    {[
                                        ['ID Front', application.id_front_url],
                                        ['ID Back', application.id_back_url],
                                        ['Selfie With ID', application.id_selfie_url],
                                    ].filter(([, url]) => Boolean(url)).map(([label, url]) => (
                                        <a
                                            key={label}
                                            href={toAssetUrl(url)}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ padding: '0.65rem 0.8rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.84rem', fontWeight: 600 }}
                                        >
                                            {label}
                                        </a>
                                    ))}
                                </div>

                                <textarea
                                    value={reviewNotes[application.id] || ''}
                                    onChange={(event) => setReviewNotes((prev) => ({ ...prev, [application.id]: event.target.value }))}
                                    placeholder="Admin notes (optional)"
                                    rows="3"
                                    style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '0.85rem 0.9rem', resize: 'vertical', marginBottom: '0.95rem' }}
                                />

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        disabled={reviewingId === application.id}
                                        onClick={() => handleReview(application.id, 'rejected')}
                                        style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                    >
                                        {reviewingId === application.id ? 'Processing...' : 'Reject'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={reviewingId === application.id}
                                        onClick={() => handleReview(application.id, 'approved')}
                                        style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        {reviewingId === application.id ? 'Processing...' : 'Approve'}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <Search size={18} color="var(--text-muted)" />
                    <label htmlFor="usersSearch" className="sr-only">Search users</label>
                    <input
                        id="usersSearch"
                        type="text"
                        placeholder="Search users by name, email, role, or status..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1.6fr', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span>User</span>
                        <span>Role</span>
                        <span>Status</span>
                        <span>Joined</span>
                        <span>Actions</span>
                    </div>
                    {filteredUsers.map((user) => {
                        const status = getUserStatus(user);
                        return (
                            <div key={user.id} className="glass-card--hover" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1.6fr', gap: '1rem', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>
                                        {(user.username || user.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: '600', wordBreak: 'break-word' }}>
                                            {user.username || user.email}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', wordBreak: 'break-word' }}>{user.email}</div>
                                    </div>
                                </div>

                                <RoleBadge role={humanizeLabel(user.role || 'client')} />

                                <div>
                                    <span style={{ ...statusPillStyle(status.tone), padding: '5px 10px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 700 }}>
                                        {status.label}
                                    </span>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.45rem' }}>
                                        {status.detail}
                                        {user.suspension_reason && status.tone === 'banned' ? ` • ${user.suspension_reason}` : ''}
                                    </div>
                                </div>

                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {formatDate(user.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', flexWrap: 'wrap' }}>
                                    {status.tone === 'active' && (
                                        <button
                                            type="button"
                                            onClick={() => setBanModal({ open: true, id: user.id, userName: user.username || user.email, suspendedUntil: '', reason: '' })}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.22)', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', cursor: 'pointer' }}
                                        >
                                            <Clock3 size={15} />
                                            Ban
                                        </button>
                                    )}
                                    {status.tone === 'banned' && (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmModal({ open: true, id: user.id, action: 'activate', userName: user.username || user.email })}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.22)', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', cursor: 'pointer' }}
                                        >
                                            <ShieldCheck size={15} />
                                            Lift Ban
                                        </button>
                                    )}
                                    {status.tone !== 'deleted' && (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmModal({ open: true, id: user.id, action: 'delete', userName: user.username || user.email })}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.22)', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={15} />
                                            Delete
                                        </button>
                                    )}
                                    {status.tone === 'deleted' && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.16)', background: 'rgba(239, 68, 68, 0.06)', color: '#fca5a5' }}>
                                            <UserRoundX size={15} />
                                            Deleted
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {filteredUsers.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</div>
                    )}
                </div>
            )}

            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.action === 'delete' ? 'Delete User?' : 'Lift Ban?'}
                message={
                    confirmModal.action === 'delete'
                        ? <>Delete <strong>{confirmModal.userName}</strong>? This permanently disables the account and removes access.</>
                        : <>Lift the current ban for <strong>{confirmModal.userName}</strong>?</>
                }
                variant={confirmModal.action === 'delete' ? 'danger' : 'success'}
                confirmLabel={confirmModal.action === 'delete' ? 'Delete User' : 'Lift Ban'}
                loading={actionLoading}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmModal(emptyConfirmModal)}
            />

            {banModal.open && (
                <div className="confirm-overlay" onClick={() => !actionLoading && setBanModal(emptyBanModal)}>
                    <div className="confirm-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="confirm-modal__icon confirm-modal__icon--warning">
                            <Clock3 size={24} />
                        </div>
                        <h3 className="confirm-modal__title">Ban User For A Specific Period</h3>
                        <div className="confirm-modal__message">
                            <p style={{ marginTop: 0 }}>
                                Set when <strong>{banModal.userName}</strong> can access the account again.
                            </p>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.85rem', textAlign: 'left' }}>
                                <span>Ban Until</span>
                                <input
                                    type="datetime-local"
                                    value={banModal.suspendedUntil}
                                    onChange={(event) => setBanModal((prev) => ({ ...prev, suspendedUntil: event.target.value }))}
                                    style={{ width: '100%', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', padding: '0.75rem 0.85rem' }}
                                />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left' }}>
                                <span>Reason (optional)</span>
                                <textarea
                                    rows="3"
                                    value={banModal.reason}
                                    onChange={(event) => setBanModal((prev) => ({ ...prev, reason: event.target.value }))}
                                    placeholder="Explain why the account is being banned."
                                    style={{ width: '100%', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', padding: '0.75rem 0.85rem', resize: 'vertical' }}
                                />
                            </label>
                        </div>
                        <div className="confirm-modal__actions">
                            <button className="confirm-modal__btn confirm-modal__btn--cancel" disabled={actionLoading} onClick={() => setBanModal(emptyBanModal)}>
                                Cancel
                            </button>
                            <button className="confirm-modal__btn confirm-modal__btn--confirm" disabled={actionLoading} onClick={handleBanSubmit}>
                                {actionLoading ? 'Processing...' : 'Ban User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default UsersPage;
