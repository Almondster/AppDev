import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, EyeOff, RotateCcw, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { deleteService, fetchServices, fetchUsers, updateService } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import { readCollection } from '../utils/collections';

const emptyConfirmModal = { open: false, action: '', serviceId: null, serviceTitle: '' };

const formatCurrency = (value) => `PHP ${Number(value || 0).toLocaleString()}`;

const formatDate = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
        ? '-'
        : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getServiceStatus = (service) => {
    if (service.is_public === false) {
        return {
            label: 'Banned',
            tone: 'banned',
            detail: 'Hidden from marketplace',
        };
    }
    return {
        label: 'Active',
        tone: 'active',
        detail: 'Visible in marketplace',
    };
};

const getStatusStyle = (tone) => {
    if (tone === 'banned') {
        return {
            backgroundColor: 'rgba(245, 158, 11, 0.14)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.24)',
        };
    }
    return {
        backgroundColor: 'rgba(34, 197, 94, 0.12)',
        color: '#4ade80',
        border: '1px solid rgba(34, 197, 94, 0.2)',
    };
};

const AdminProjectsPage = () => {
    const [services, setServices] = useState([]);
    const [usersById, setUsersById] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [confirmModal, setConfirmModal] = useState(emptyConfirmModal);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = useCallback((message) => {
        setToast(message);
        window.setTimeout(() => setToast(''), 3500);
    }, []);

    const loadAdminProjects = useCallback(async () => {
        setLoading(true);
        try {
            const [servicesRes, usersRes] = await Promise.all([
                fetchServices(),
                fetchUsers({ includeInactive: true, pageSize: 500 }),
            ]);

            if (servicesRes.ok) {
                setServices(readCollection(servicesRes));
            } else {
                showToast(servicesRes.data?.detail || 'Failed to load services.');
            }

            if (usersRes.ok) {
                const entries = readCollection(usersRes).map((user) => [String(user.id), user]);
                setUsersById(Object.fromEntries(entries));
            }
        } catch (error) {
            console.error('Failed to load admin services:', error);
            showToast('Failed to load services.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadAdminProjects();
    }, [loadAdminProjects]);

    const filteredServices = useMemo(() => {
        const needle = searchTerm.trim().toLowerCase();
        return services.filter((service) => {
            const status = getServiceStatus(service);
            const creator = usersById[String(service.creator_id)];
            const matchesSearch = !needle || [
                service.title,
                service.category,
                service.description,
                creator?.username,
                creator?.email,
                status.label,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(needle));

            const matchesStatus = statusFilter === 'all' || status.tone === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, services, statusFilter, usersById]);

    const stats = useMemo(() => ({
        total: services.length,
        active: services.filter((service) => getServiceStatus(service).tone === 'active').length,
        banned: services.filter((service) => getServiceStatus(service).tone === 'banned').length,
    }), [services]);

    const handleConfirmAction = async () => {
        const { action, serviceId, serviceTitle } = confirmModal;
        setActionLoading(true);
        try {
            if (action === 'delete') {
                const { ok, data } = await deleteService(serviceId);
                if (!ok) {
                    showToast(data?.detail || 'Failed to delete service.');
                    return;
                }
                setServices((prev) => prev.filter((service) => service.id !== serviceId));
                showToast(`${serviceTitle} was deleted.`);
                return;
            }

            const nextPublicState = action === 'ban' ? false : true;
            const { ok, data } = await updateService(serviceId, { is_public: nextPublicState });
            if (!ok) {
                showToast(data?.detail || `Failed to ${action} service.`);
                return;
            }
            setServices((prev) => prev.map((service) => (
                service.id === serviceId
                    ? { ...service, is_public: data?.is_public ?? nextPublicState }
                    : service
            )));
            showToast(
                action === 'ban'
                    ? `${serviceTitle} is now banned from the marketplace.`
                    : `${serviceTitle} is visible again.`
            );
        } catch (error) {
            console.error(`Failed to ${confirmModal.action} service:`, error);
            showToast(`Failed to ${confirmModal.action} service.`);
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
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>All Services</h1>
                        <Briefcase size={28} color="#818cf8" />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
                        Moderate every published service. Ban hides it from the marketplace. Delete performs a soft delete and removes it from the frontend only.
                    </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: '0.85rem', minWidth: 'min(100%, 420px)' }}>
                    {[
                        ['Services', stats.total],
                        ['Active', stats.active],
                        ['Banned', stats.banned],
                    ].map(([label, value]) => (
                        <div key={label} style={{ background: 'var(--bg-secondary)', padding: '1rem 1.15rem', borderRadius: '14px', border: '1px solid var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
                            <h2 style={{ fontSize: '1.7rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0.35rem 0 0' }}>{value}</h2>
                        </div>
                    ))}
                </div>
            </header>

            <section className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '0.85rem 1rem' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <label htmlFor="adminProjectSearch" className="sr-only">Search services</label>
                        <input
                            id="adminProjectSearch"
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search services, category, creator, or status..."
                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {[
                            ['all', 'All'],
                            ['active', 'Active'],
                            ['banned', 'Banned'],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setStatusFilter(value)}
                                style={{
                                    padding: '0.7rem 1rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    background: statusFilter === value ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                                    color: statusFilter === value ? 'var(--text-primary)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {loading ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading services...</div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2.2fr 1.2fr 1fr 1fr 0.9fr 1.5fr', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span>Service</span>
                        <span>Creator</span>
                        <span>Category</span>
                        <span>Status</span>
                        <span>Price</span>
                        <span>Actions</span>
                    </div>
                    {filteredServices.map((service) => {
                        const creator = usersById[String(service.creator_id)];
                        const status = getServiceStatus(service);
                        return (
                            <div key={service.id} className="glass-card--hover" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2.2fr 1.2fr 1fr 1fr 0.9fr 1.5fr', gap: '1rem', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.3rem', wordBreak: 'break-word' }}>
                                        {service.title || 'Untitled service'}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
                                        {service.description || 'No description'}
                                    </div>
                                    <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                                        Created {formatDate(service.created_at)}
                                    </div>
                                </div>

                                <div style={{ minWidth: 0 }}>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, wordBreak: 'break-word' }}>
                                        {creator?.username || `User #${service.creator_id}`}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', wordBreak: 'break-word' }}>
                                        {creator?.email || '-'}
                                    </div>
                                </div>

                                <span style={{ color: 'var(--text-secondary)' }}>
                                    {service.category || service.label || '-'}
                                </span>

                                <div>
                                    <span style={{ ...getStatusStyle(status.tone), padding: '5px 10px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 700 }}>
                                        {status.label}
                                    </span>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.45rem' }}>
                                        {status.detail}
                                    </div>
                                </div>

                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {formatCurrency(service.price)}
                                </span>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', flexWrap: 'wrap' }}>
                                    {status.tone === 'active' ? (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmModal({
                                                open: true,
                                                action: 'ban',
                                                serviceId: service.id,
                                                serviceTitle: service.title || 'Untitled service',
                                            })}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.22)', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', cursor: 'pointer' }}
                                        >
                                            <EyeOff size={15} />
                                            Ban
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmModal({
                                                open: true,
                                                action: 'restore',
                                                serviceId: service.id,
                                                serviceTitle: service.title || 'Untitled service',
                                            })}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.22)', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', cursor: 'pointer' }}
                                        >
                                            <RotateCcw size={15} />
                                            Unban
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setConfirmModal({
                                            open: true,
                                            action: 'delete',
                                            serviceId: service.id,
                                            serviceTitle: service.title || 'Untitled service',
                                        })}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.22)', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={15} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {filteredServices.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No services found.
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                open={confirmModal.open}
                title={
                    confirmModal.action === 'delete'
                        ? 'Delete Service?'
                        : confirmModal.action === 'ban'
                            ? 'Ban Service?'
                            : 'Unban Service?'
                }
                message={
                    confirmModal.action === 'delete'
                        ? <>Delete <strong>{confirmModal.serviceTitle}</strong>? This is a soft delete and removes the service from the frontend without removing the database record.</>
                        : confirmModal.action === 'ban'
                            ? <>Ban <strong>{confirmModal.serviceTitle}</strong>? This hides the service from the marketplace but keeps it in the database.</>
                            : <>Make <strong>{confirmModal.serviceTitle}</strong> visible in the marketplace again?</>
                }
                variant={confirmModal.action === 'delete' ? 'danger' : confirmModal.action === 'ban' ? 'warning' : 'success'}
                confirmLabel={
                    confirmModal.action === 'delete'
                        ? 'Delete Service'
                        : confirmModal.action === 'ban'
                            ? 'Ban Service'
                            : 'Unban Service'
                }
                loading={actionLoading}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmModal(emptyConfirmModal)}
            />
        </main>
    );
};

export default AdminProjectsPage;
