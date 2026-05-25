import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    User, Shield, Bell, CreditCard, HelpCircle, LogOut, Camera, Users, Heart,
    ChevronRight, Mail, Phone, Globe, Palette, Save, X, Send, UserPlus, UserMinus, Trash2, Sparkles, Briefcase, MapPin,
} from 'lucide-react';
import {
    getUserData, patchUser, fetchMyFollowers, fetchMyFollowing, deleteFollow,
    fetchMyWallets, createWallet, deleteWallet, fetchMyPaymentMethods, createPaymentMethod, deletePaymentMethod,
    createSupportTicket, fetchSupportTickets, submitCreatorApplication, setUserData, uploadIdVerificationImage,
} from '../api';
import { createInitialCreatorForm } from '../constants/creatorOnboarding';
import ConfirmModal from '../components/ConfirmModal';
import { useTheme } from '../context/hooks/useTheme.js';
import './SettingsPage.css';

const TABS = [
    { key: 'profile', label: 'Profile', icon: <User size={18} /> },
    { key: 'personalization', label: 'Personalization', icon: <Palette size={18} /> },
    { key: 'security', label: 'Security', icon: <Shield size={18} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { key: 'followers', label: 'Followers', icon: <Users size={18} /> },
    { key: 'payout', label: 'Payout Methods', icon: <CreditCard size={18} /> },
    { key: 'help', label: 'Help & Support', icon: <HelpCircle size={18} /> },
];

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const CREATOR_MAIN_CATEGORIES = [
    'Design & Creative',
    'Development & IT',
    'Writing & Translation',
    'Digital Marketing',
    'Video & Animation',
    'Music & Audio',
];

const CREATOR_SUBCATEGORY_MAP = {
    'Design & Creative': ['Logo Design', 'Brand Style Guides', 'Illustration', 'UI/UX Design', 'Portrait Drawing'],
    'Development & IT': ['Web Development', 'Mobile App Development', 'Game Development', 'Support & IT'],
    'Writing & Translation': ['Articles & Blog Posts', 'Translation', 'Creative Writing', 'Proofreading'],
    'Digital Marketing': ['Social Media Marketing', 'SEO', 'Content Marketing', 'Video Marketing'],
    'Video & Animation': ['Video Editing', 'Animation for Kids', '3D Product Animation', 'Visual Effects'],
    'Music & Audio': ['Voice Over', 'Mixing & Mastering', 'Producers & Composers', 'Singers & Vocalists'],
};

const digitsOnly = (value, maxLength = null) => {
    const sanitized = String(value || '').replace(/\D/g, '');
    return typeof maxLength === 'number' ? sanitized.slice(0, maxLength) : sanitized;
};

const MAX_ID_UPLOAD_BYTES = 5 * 1024 * 1024;
const SETTINGS_ID_UPLOAD_META = {
    id_front_url: { label: 'Government ID Front', suffix: 'id-front', required: true },
    id_back_url: { label: 'Government ID Back', suffix: 'id-back', required: true },
    id_selfie_url: { label: 'Selfie With ID', suffix: 'id-selfie', required: false },
};

const SettingsPage = ({ userRole, onLogout }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'profile';
    const shouldOpenBecomeCreator = searchParams.get('becomeCreator') === '1';
    const [activeTab, setActiveTab] = useState(initialTab);
    const userData = getUserData();
    const [toast, setToast] = useState('');
    const [creatorModalOpen, setCreatorModalOpen] = useState(shouldOpenBecomeCreator);
    const [creatorStep, setCreatorStep] = useState(1);
    const [creatorSubmitting, setCreatorSubmitting] = useState(false);
    const [creatorUploadingField, setCreatorUploadingField] = useState('');
    const [creatorForm, setCreatorForm] = useState(() => createInitialCreatorForm(userData));

    // Profile state
    const [profileForm, setProfileForm] = useState({
        full_name: userData?.full_name || '',
        email: userData?.email || '',
        avatar_url: userData?.avatar_url || '',
        bio: '',
    });
    const [saving, setSaving] = useState(false);

    // Notifications state
    const [notifSettings, setNotifSettings] = useState(() => {
        try { return JSON.parse(localStorage.getItem('createch_notif_settings')) || { email: true, orders: true, messages: true, marketing: false }; }
        catch { return { email: true, orders: true, messages: true, marketing: false }; }
    });

    // Followers/Following state
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [socialTab, setSocialTab] = useState('followers');
    const [socialLoading, setSocialLoading] = useState(false);

    // Payout state
    const [wallets, setWallets] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [payoutForm, setPayoutForm] = useState({ wallet_type: 'GCash', account_name: '', account_number: '' });
    const [pmForm, setPmForm] = useState({ method_type: '', masked_number: '' });
    const [payoutLoading, setPayoutLoading] = useState(false);

    // Help state
    const [ticketForm, setTicketForm] = useState({ category: 'general', message: '' });
    const [tickets, setTickets] = useState([]);
    const [ticketLoading, setTicketLoading] = useState(false);

    // Delete confirm
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null });
    const [deleting, setDeleting] = useState(false);

    const { theme, setTheme } = useTheme();
    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('createch_accent') || '#6366f1');
    const isAdmin = userRole === 'admin';
    const availableTabs = isAdmin
        ? TABS.filter((tab) => !['help', 'followers', 'payout'].includes(tab.key))
        : TABS;

    useEffect(() => {
        document.documentElement.style.setProperty('--accent', accentColor);
        localStorage.setItem('createch_accent', accentColor);
    }, [accentColor]);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    useEffect(() => {
        setCreatorForm(prev => ({
            ...prev,
            first_name: prev.first_name || userData?.first_name || '',
            middle_name: prev.middle_name || userData?.middle_name || '',
            last_name: prev.last_name || userData?.last_name || '',
            phone: prev.phone || createInitialCreatorForm(userData).phone,
        }));
    }, [userData?.first_name, userData?.middle_name, userData?.last_name, userData?.phone]);

    useEffect(() => {
        if (shouldOpenBecomeCreator && userRole === 'client') {
            setActiveTab('profile');
            setCreatorModalOpen(true);
        }
    }, [shouldOpenBecomeCreator, userRole]);

    useEffect(() => {
        if (!availableTabs.some((tab) => tab.key === activeTab)) {
            setActiveTab('profile');
        }
    }, [activeTab, availableTabs]);

    // Load tab-specific data
    useEffect(() => {
        const loadFollowersAndFollowing = async () => {
            setSocialLoading(true);
            try {
                const [fRes, gRes] = await Promise.all([fetchMyFollowers(), fetchMyFollowing()]);
                if (fRes.ok) setFollowers(fRes.data.results || fRes.data || []);
                if (gRes.ok) setFollowing(gRes.data.results || gRes.data || []);
            } catch (err) {
                console.error('Failed to load followers:', err);
            } finally {
                setSocialLoading(false);
            }
        };

        const loadPayoutData = async () => {
            try {
                const [wRes, pRes] = await Promise.all([fetchMyWallets(), fetchMyPaymentMethods()]);
                if (wRes.ok) setWallets(wRes.data.results || wRes.data || []);
                if (pRes.ok) setPaymentMethods(pRes.data.results || pRes.data || []);
            } catch (err) {
                console.error('Failed to load payout data:', err);
            }
        };

        const loadHelpTickets = async () => {
            try {
                const res = await fetchSupportTickets();
                if (res.ok) {
                    const all = res.data.results || res.data || [];
                    setTickets(all.filter(t => t.user_id === userData?.firebase_uid));
                }
            } catch (err) {
                console.error('Failed to load support tickets:', err);
            }
        };

        if (activeTab === 'followers') {
            loadFollowersAndFollowing();
        }
        if (activeTab === 'payout') {
            loadPayoutData();
        }
        if (activeTab === 'help' && !isAdmin) {
            loadHelpTickets();
        }
    }, [activeTab, isAdmin, userData?.firebase_uid]);

    // ── PROFILE ──
    const handlePhotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file.');
            e.target.value = '';
            return;
        }
        if (file.size > MAX_AVATAR_BYTES) {
            showToast('Profile photo must be 2 MB or smaller.');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setProfileForm(p => ({ ...p, avatar_url: String(reader.result || '') }));
            e.target.value = '';
        };
        reader.onerror = () => showToast('Failed to read image file.');
        reader.readAsDataURL(file);
    };

    const handleProfileSave = async () => {
        setSaving(true);
        try {
            const { ok } = await patchUser(userData?.firebase_uid, {
                username: profileForm.full_name,
                avatar_url: profileForm.avatar_url,
            });
            if (ok) {
                const u = getUserData() || {};
                setUserData({
                    ...u,
                    full_name: profileForm.full_name,
                    avatar_url: profileForm.avatar_url,
                });
                showToast('Profile updated!');
            } else {
                showToast('Failed to update profile.');
            }
        } catch { showToast('Connection error.'); }
        setSaving(false);
    };

    const updateCreatorField = (key, value) => {
        setCreatorForm(prev => ({ ...prev, [key]: value }));
    };

    const toggleCreatorSkill = (skill) => {
        setCreatorForm(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill],
        }));
    };

    const resetCreatorModal = () => {
        setCreatorStep(1);
        setCreatorSubmitting(false);
        setCreatorUploadingField('');
        setCreatorModalOpen(false);
    };

    const validateCreatorStep = () => {
        if (creatorStep === 1) {
            if (!creatorForm.first_name.trim() || !creatorForm.last_name.trim() || !creatorForm.phone.trim() || !creatorForm.id_number.trim()) {
                showToast('Complete the identity fields first.');
                return false;
            }
            if (!/^9\d{9}$/.test(creatorForm.phone.trim())) {
                showToast('Phone number must be 10 digits and start with 9.');
                return false;
            }
            if (!/^\d{12}$/.test(creatorForm.id_number.trim())) {
                showToast('Government ID number must be 12 digits.');
                return false;
            }
            if (creatorForm.postal_code.trim() && !/^\d+$/.test(creatorForm.postal_code.trim())) {
                showToast('Postal code must contain numbers only.');
                return false;
            }
            if (!creatorForm.street_address.trim() || !creatorForm.city.trim()) {
                showToast('Street address and city are required.');
                return false;
            }
            if (!creatorForm.id_front_url || !creatorForm.id_back_url) {
                showToast('Upload the front and back images of a valid government ID first.');
                return false;
            }
            return true;
        }

        if (creatorStep === 2) {
            if (!creatorForm.category || creatorForm.skills.length === 0 || !creatorForm.bio.trim() || !creatorForm.experience_years.trim() || !creatorForm.starting_price.trim() || !creatorForm.turnaround_time.trim()) {
                showToast('Complete the creator profile fields before continuing.');
                return false;
            }
            if (!/^\d+$/.test(creatorForm.experience_years.trim())) {
                showToast('Experience must contain numbers only.');
                return false;
            }
            if (!/^\d+$/.test(creatorForm.starting_price.trim())) {
                showToast('Starting price must contain numbers only.');
                return false;
            }
            return true;
        }

        if (!creatorForm.agreed) {
            showToast('You must agree before submitting your creator application.');
            return false;
        }
        return true;
    };

    const handleCreatorNext = () => {
        if (!validateCreatorStep()) return;
        setCreatorStep(prev => Math.min(3, prev + 1));
    };

    const handleCreatorBack = () => {
        setCreatorStep(prev => Math.max(1, prev - 1));
    };

    const handleCreatorIdUpload = async (fieldKey, file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Only image files are allowed for ID verification.');
            return;
        }
        if (file.size > MAX_ID_UPLOAD_BYTES) {
            showToast('ID verification images must be 5 MB or smaller.');
            return;
        }

        setCreatorUploadingField(fieldKey);
        try {
            const fileName = `${userData?.firebase_uid || 'user'}-${SETTINGS_ID_UPLOAD_META[fieldKey].suffix}-${Date.now()}-${file.name}`.replace(/\s+/g, '-');
            const { ok, data } = await uploadIdVerificationImage(file, fileName);
            if (!ok) {
                showToast(data?.detail || `Failed to upload ${SETTINGS_ID_UPLOAD_META[fieldKey].label.toLowerCase()}.`);
                return;
            }
            updateCreatorField(fieldKey, data?.url || '');
        } catch (error) {
            showToast(error?.message || `Failed to upload ${SETTINGS_ID_UPLOAD_META[fieldKey].label.toLowerCase()}.`);
        } finally {
            setCreatorUploadingField('');
        }
    };

    const handleCreatorSubmit = async () => {
        if (!validateCreatorStep()) return;

        setCreatorSubmitting(true);
        try {
            const payload = {
                first_name: creatorForm.first_name.trim(),
                middle_name: creatorForm.middle_name.trim() || null,
                last_name: creatorForm.last_name.trim(),
                phone: creatorForm.phone.trim() ? `+63${creatorForm.phone.trim()}` : null,
                id_number: creatorForm.id_number.trim() || null,
                id_front_url: creatorForm.id_front_url || null,
                id_back_url: creatorForm.id_back_url || null,
                id_selfie_url: creatorForm.id_selfie_url || null,
                street_address: creatorForm.street_address.trim() || null,
                barangay: creatorForm.barangay.trim() || null,
                city: creatorForm.city.trim() || null,
                province: creatorForm.province.trim() || null,
                postal_code: creatorForm.postal_code.trim() || null,
                country: creatorForm.country.trim() || 'Philippines',
                bio: creatorForm.bio.trim() || null,
                experience_years: creatorForm.experience_years.trim() || null,
                starting_price: creatorForm.starting_price.trim() || null,
                turnaround_time: creatorForm.turnaround_time.trim() || null,
                category: creatorForm.category || null,
                skills: creatorForm.skills,
                portfolio_url: creatorForm.portfolio_url.trim() || null,
            };

            const { ok, data } = await submitCreatorApplication(payload);
            if (!ok) {
                showToast(data?.detail || 'Failed to submit creator application.');
                setCreatorSubmitting(false);
                return;
            }

            setUserData({
                ...getUserData(),
                creator_application_status: data?.status || 'pending',
                creator_application_id: data?.id || null,
            });
            showToast('Creator application submitted for admin review.');
            resetCreatorModal();
        } catch (error) {
            showToast(error?.message || 'Failed to submit creator application.');
        } finally {
            setCreatorSubmitting(false);
        }
    };

    // ── NOTIFICATIONS ──
    const toggleNotif = (key) => {
        setNotifSettings(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            localStorage.setItem('createch_notif_settings', JSON.stringify(updated));
            return updated;
        });
    };

    // ── PAYOUT ──
    const handleAddWallet = async (e) => {
        e.preventDefault();
        setPayoutLoading(true);
        try {
            const { ok, data } = await createWallet({
                user_id: userData?.firebase_uid,
                wallet_type: payoutForm.wallet_type,
                account_name: payoutForm.account_name,
                account_number: payoutForm.account_number,
            });
            if (ok) {
                setWallets(prev => [...prev, data]);
                setPayoutForm({ wallet_type: 'GCash', account_name: '', account_number: '' });
                showToast('Payout method added!');
            }
        } catch { showToast('Failed.'); }
        setPayoutLoading(false);
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            const { ok, data } = await createPaymentMethod({
                user_id: userData?.firebase_uid,
                method_type: pmForm.method_type,
                masked_number: pmForm.masked_number,
            });
            if (ok) {
                setPaymentMethods(prev => [...prev, data]);
                setPmForm({ method_type: '', masked_number: '' });
                showToast('Payment method added!');
            }
        } catch { showToast('Failed.'); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { type, id } = deleteConfirm;
            const fn = type === 'wallet' ? deleteWallet : type === 'payment' ? deletePaymentMethod : deleteFollow;
            const { ok } = await fn(id);
            if (ok) {
                if (type === 'wallet') setWallets(prev => prev.filter(w => w.id !== id));
                if (type === 'payment') setPaymentMethods(prev => prev.filter(p => p.id !== id));
                if (type === 'follow') setFollowing(prev => prev.filter(f => f.id !== id));
                showToast('Removed.');
            }
        } catch { showToast('Failed to remove.'); }
        setDeleting(false);
        setDeleteConfirm({ open: false, type: '', id: null });
    };

    // ── HELP ──
    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        setTicketLoading(true);
        try {
            const { ok, data } = await createSupportTicket({
                ticket_number: `TKT-${Date.now()}`,
                user_id: userData?.firebase_uid,
                email: userData?.email || '',
                category: ticketForm.category,
                message: ticketForm.message,
                user_role: userRole,
                status: 'open',
            });
            if (ok) {
                setTickets(prev => [data, ...prev]);
                setTicketForm({ category: 'general', message: '' });
                showToast('Support ticket submitted!');
            }
        } catch { showToast('Failed to submit ticket.'); }
        setTicketLoading(false);
    };

    const inputStyle = {
        width: '100%', padding: '0.65rem 0.9rem', borderRadius: 10,
        background: 'var(--bg-input)', border: '1px solid var(--border)',
        color: 'var(--text-primary)', fontSize: '0.95rem',
    };

    const cardStyle = {
        background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem',
        transition: 'background 0.3s, border-color 0.3s',
    };

    return (
        <main className="settings-page page-fade">
            {toast && <div className="global-toast global-toast--success">{toast}</div>}

            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">Manage your account, preferences, and payment methods.</p>

            <div className="settings-layout">
                {/* Sidebar */}
                <nav className="settings-nav">
                    {availableTabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`settings-nav-item ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                    <button className="settings-nav-item settings-nav-item--danger" onClick={onLogout}>
                        <LogOut size={18} /> Log Out
                    </button>
                </nav>

                {/* Content */}
                <div className="settings-content">
                    {/* ─── Profile ─── */}
                    {activeTab === 'profile' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={cardStyle}>
                                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '0 0 1.25rem', fontSize: '1.1rem' }}>Profile Information</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.5rem', overflow: 'hidden', flexShrink: 0 }}>
                                        {profileForm.avatar_url ? <img src={profileForm.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profileForm.full_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: 8 }}>Profile Photo</label>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <label htmlFor="profile-photo-upload" style={{ padding: '0.58rem 0.9rem', borderRadius: 10, background: '#6366f1', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}>
                                                <Camera size={15} /> Upload Photo
                                            </label>
                                            <input id="profile-photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                            {profileForm.avatar_url && (
                                                <button type="button" onClick={() => setProfileForm(p => ({ ...p, avatar_url: '' }))} style={{ padding: '0.58rem 0.8rem', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}>
                                                    <X size={15} /> Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ color: '#a1a1aa', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Full Name</label>
                                        <input style={inputStyle} value={profileForm.full_name}
                                            onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={{ color: '#a1a1aa', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Email</label>
                                        <input style={{ ...inputStyle, opacity: 0.6 }} value={profileForm.email} disabled />
                                    </div>
                                </div>
                                <button onClick={handleProfileSave} disabled={saving}
                                    style={{ marginTop: '1.25rem', padding: '0.65rem 1.5rem', borderRadius: 10, background: '#6366f1', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>

                            {userRole === 'client' && (
                                <div className="settings-creator-card">
                                    <div className="settings-creator-card__icon">
                                        <Sparkles size={20} />
                                    </div>
                                    <div className="settings-creator-card__copy">
                                        <h3>Become a Creator</h3>
                                        <p>Complete the same onboarding flow used in mobile: identity details, service category, skills, rates, and creator profile information.</p>
                                        <div className="settings-creator-card__meta">
                                            <span><Briefcase size={14} /> 3-step onboarding</span>
                                            <span><MapPin size={14} /> Local profile verification</span>
                                        </div>
                                    </div>
                                    <button className="settings-creator-card__button" onClick={() => navigate('/become-creator')}>
                                        Start Creator Setup
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Personalization ─── */}
                    {activeTab === 'personalization' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={cardStyle}>
                                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '0 0 1.25rem', fontSize: '1.1rem' }}>Appearance</h3>

                                {/* Theme Toggle */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <div>
                                        <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>Theme</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0' }}>Switch between light and dark mode</p>
                                    </div>
                                    <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                        <button onClick={() => setTheme('light')} style={{
                                            padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                                            background: theme === 'light' ? 'var(--accent)' : 'transparent', color: theme === 'light' ? '#fff' : 'var(--text-muted)',
                                            transition: 'all 0.2s',
                                        }}>Light</button>
                                        <button onClick={() => setTheme('dark')} style={{
                                            padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                                            background: theme === 'dark' ? 'var(--accent)' : 'transparent', color: theme === 'dark' ? '#fff' : 'var(--text-muted)',
                                            transition: 'all 0.2s',
                                        }}>Dark</button>
                                    </div>
                                </div>

                                {/* Accent Color */}
                                <div style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ color: 'var(--text-primary, #fff)', fontWeight: 600, margin: '0 0 8px', fontSize: '0.95rem' }}>Accent Color</p>
                                    <p style={{ color: 'var(--text-muted, #71717a)', fontSize: '0.85rem', margin: '0 0 12px' }}>Choose your preferred accent color</p>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {[
                                            { color: '#6366f1', label: 'Indigo' },
                                            { color: '#8b5cf6', label: 'Purple' },
                                            { color: '#3b82f6', label: 'Blue' },
                                            { color: '#10b981', label: 'Green' },
                                            { color: '#f59e0b', label: 'Amber' },
                                            { color: '#ef4444', label: 'Red' },
                                            { color: '#ec4899', label: 'Pink' },
                                            { color: '#06b6d4', label: 'Cyan' },
                                        ].map(c => (
                                            <button key={c.color} title={c.label} onClick={() => setAccentColor(c.color)} style={{
                                                width: 36, height: 36, borderRadius: '50%', background: c.color, border: accentColor === c.color ? '3px solid #fff' : '3px solid transparent',
                                                cursor: 'pointer', transition: 'all 0.2s', boxShadow: accentColor === c.color ? `0 0 12px ${c.color}60` : 'none',
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={cardStyle}>
                                <h3 style={{ color: 'var(--text-primary, #fff)', fontWeight: 700, margin: '0 0 1.25rem', fontSize: '1.1rem' }}>Display</h3>
                                {[
                                    { key: 'compact', label: 'Compact Mode', desc: 'Reduce spacing for more content on screen' },
                                    { key: 'animations', label: 'Animations', desc: 'Enable smooth transitions and micro-animations' },
                                ].map(item => {
                                    const storageKey = `createch_display_${item.key}`;
                                    const val = localStorage.getItem(storageKey) !== 'false';
                                    return (
                                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div>
                                                <p style={{ color: 'var(--text-primary, #fff)', fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>{item.label}</p>
                                                <p style={{ color: 'var(--text-muted, #71717a)', fontSize: '0.85rem', margin: '2px 0 0' }}>{item.desc}</p>
                                            </div>
                                            <button onClick={() => { const newVal = !val; localStorage.setItem(storageKey, newVal); showToast(`${item.label} ${newVal ? 'enabled' : 'disabled'}`); }} style={{
                                                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                                                background: val ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                                position: 'relative', transition: 'background 0.2s',
                                            }}>
                                                <div style={{
                                                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                                                    position: 'absolute', top: 3,
                                                    left: val ? 25 : 3,
                                                    transition: 'left 0.2s',
                                                }} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ─── Security ─── */}
                    {activeTab === 'security' && (
                        <div style={cardStyle}>
                            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '0 0 1rem', fontSize: '1.1rem' }}>Security</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Your account uses Firebase Authentication. Password changes are managed through your email provider.
                            </p>
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99,102,241,0.1)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)' }}>
                                <p style={{ color: '#818cf8', fontSize: '0.9rem', margin: 0 }}>
                                    <Shield size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                    To change your password, use the "Forgot Password" option on the login screen.
                                </p>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Account info:</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Role</span><span style={{ color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>{userRole}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>UID</span><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{userData?.firebase_uid?.substring(0, 16)}...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Notifications ─── */}
                    {activeTab === 'notifications' && (
                        <div style={cardStyle}>
                            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '0 0 1.25rem', fontSize: '1.1rem' }}>Notification Preferences</h3>
                            {[
                                { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                                { key: 'orders', label: 'Order Updates', desc: 'Get notified about order status changes' },
                                { key: 'messages', label: 'New Messages', desc: 'Alert when you receive a new message' },
                                { key: 'marketing', label: 'Marketing & Promotions', desc: 'Tips, offers, and platform news' },
                            ].map(item => (
                                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <div>
                                        <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>{item.label}</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0' }}>{item.desc}</p>
                                    </div>
                                    <button onClick={() => toggleNotif(item.key)} style={{
                                        width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                                        background: notifSettings[item.key] ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                        position: 'relative', transition: 'background 0.2s',
                                    }}>
                                        <div style={{
                                            width: 20, height: 20, borderRadius: '50%', background: '#fff',
                                            position: 'absolute', top: 3,
                                            left: notifSettings[item.key] ? 25 : 3,
                                            transition: 'left 0.2s',
                                        }} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ─── Followers ─── */}
                    {activeTab === 'followers' && (
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                                <button onClick={() => setSocialTab('followers')} style={{
                                    padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: socialTab === 'followers' ? '#6366f1' : 'rgba(255,255,255,0.06)', color: socialTab === 'followers' ? '#fff' : '#a1a1aa', fontWeight: 600,
                                }}>Followers ({followers.length})</button>
                                <button onClick={() => setSocialTab('following')} style={{
                                    padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: socialTab === 'following' ? '#6366f1' : 'rgba(255,255,255,0.06)', color: socialTab === 'following' ? '#fff' : '#a1a1aa', fontWeight: 600,
                                }}>Following ({following.length})</button>
                            </div>
                            {socialLoading ? (
                                <p style={{ color: '#71717a', textAlign: 'center', padding: '2rem' }}>Loading...</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {(socialTab === 'followers' ? followers : following).map(f => (
                                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                                                    {(socialTab === 'followers' ? (f.follower_id || '?') : (f.following_id || '?')).charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>{socialTab === 'followers' ? f.follower_id : f.following_id}</span>
                                            </div>
                                            {socialTab === 'following' && (
                                                <button onClick={() => setDeleteConfirm({ open: true, type: 'follow', id: f.id })}
                                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    Unfollow
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {(socialTab === 'followers' ? followers : following).length === 0 && (
                                        <p style={{ color: '#52525b', textAlign: 'center', padding: '2rem' }}>
                                            {socialTab === 'followers' ? 'No followers yet.' : 'Not following anyone.'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Payout Methods ─── */}
                    {activeTab === 'payout' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={cardStyle}>
                                <h3 style={{ color: '#fff', fontWeight: 700, margin: '0 0 1rem', fontSize: '1.1rem' }}>Payout Methods (Wallets)</h3>
                                {wallets.map(w => (
                                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                                        <div>
                                            <p style={{ color: '#fff', fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>{w.wallet_type}</p>
                                            <p style={{ color: '#71717a', fontSize: '0.85rem', margin: 0 }}>{w.account_name} • {w.account_number}</p>
                                        </div>
                                        <button onClick={() => setDeleteConfirm({ open: true, type: 'wallet', id: w.id })} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                {wallets.length === 0 && <p style={{ color: '#52525b', fontSize: '0.9rem' }}>No payout methods.</p>}
                                <form onSubmit={handleAddWallet} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    <select value={payoutForm.wallet_type} onChange={e => setPayoutForm(p => ({ ...p, wallet_type: e.target.value }))} style={{ ...inputStyle, flex: '0 0 120px' }}>
                                        <option value="GCash">GCash</option>
                                        <option value="Maya">Maya</option>
                                        <option value="BankTransfer">Bank Transfer</option>
                                        <option value="PayPal">PayPal</option>
                                    </select>
                                    <input value={payoutForm.account_name} onChange={e => setPayoutForm(p => ({ ...p, account_name: e.target.value }))} placeholder="Account Name" required style={{ ...inputStyle, flex: 1 }} />
                                    <input value={payoutForm.account_number} onChange={e => setPayoutForm(p => ({ ...p, account_number: e.target.value }))} placeholder="Account #" required style={{ ...inputStyle, flex: 1 }} />
                                    <button type="submit" disabled={payoutLoading} style={{ padding: '0.65rem 1rem', borderRadius: 10, background: '#6366f1', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        {payoutLoading ? 'Adding...' : 'Add'}
                                    </button>
                                </form>
                            </div>

                            <div style={cardStyle}>
                                <h3 style={{ color: '#fff', fontWeight: 700, margin: '0 0 1rem', fontSize: '1.1rem' }}>Payment Methods</h3>
                                {paymentMethods.map(pm => (
                                    <div key={pm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                                        <span style={{ color: '#d4d4d8' }}>{pm.method_type} •••• {pm.masked_number}</span>
                                        <button onClick={() => setDeleteConfirm({ open: true, type: 'payment', id: pm.id })} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                {paymentMethods.length === 0 && <p style={{ color: '#52525b', fontSize: '0.9rem' }}>No payment methods.</p>}
                                <form onSubmit={handleAddPayment} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    <input value={pmForm.method_type} onChange={e => setPmForm(p => ({ ...p, method_type: e.target.value }))} placeholder="Type (e.g. GCash)" required style={{ ...inputStyle, flex: 1 }} />
                                    <input value={pmForm.masked_number} onChange={e => setPmForm(p => ({ ...p, masked_number: e.target.value }))} placeholder="Number (e.g. 0917)" required style={{ ...inputStyle, flex: 1 }} />
                                    <button type="submit" style={{ padding: '0.65rem 1rem', borderRadius: 10, background: '#6366f1', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Add</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ─── Help & Support ─── */}
                    {activeTab === 'help' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={cardStyle}>
                                <h3 style={{ color: '#fff', fontWeight: 700, margin: '0 0 1rem', fontSize: '1.1rem' }}>Submit a Support Ticket</h3>
                                <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ color: '#a1a1aa', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Category</label>
                                        <select value={ticketForm.category} onChange={e => setTicketForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                                            <option value="general">General</option>
                                            <option value="billing">Billing</option>
                                            <option value="technical">Technical</option>
                                            <option value="account">Account</option>
                                            <option value="dispute">Dispute</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: '#a1a1aa', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Message</label>
                                        <textarea value={ticketForm.message} onChange={e => setTicketForm(p => ({ ...p, message: e.target.value }))} placeholder="Describe your issue..." required
                                            style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }} />
                                    </div>
                                    <button type="submit" disabled={ticketLoading} style={{ padding: '0.65rem 1.5rem', borderRadius: 10, background: '#6366f1', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
                                        <Send size={16} /> {ticketLoading ? 'Submitting...' : 'Submit Ticket'}
                                    </button>
                                </form>
                            </div>

                            {tickets.length > 0 && (
                                <div style={cardStyle}>
                                    <h3 style={{ color: '#fff', fontWeight: 700, margin: '0 0 1rem', fontSize: '1.1rem' }}>Your Tickets</h3>
                                    {tickets.map(t => (
                                        <div key={t.id} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{t.ticket_number}</span>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                                                    background: t.status === 'resolved' ? 'rgba(16,185,129,0.1)' : 'rgba(250,204,21,0.1)',
                                                    color: t.status === 'resolved' ? '#10b981' : '#facc15',
                                                }}>{t.status}</span>
                                            </div>
                                            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: 0 }}>{t.message?.substring(0, 100)}{t.message?.length > 100 ? '...' : ''}</p>
                                            {t.admin_response && (
                                                <div style={{ marginTop: 8, padding: '0.5rem 0.75rem', background: 'rgba(99,102,241,0.1)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.15)' }}>
                                                    <p style={{ color: '#818cf8', fontSize: '0.85rem', margin: 0 }}><strong>Admin:</strong> {t.admin_response}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={deleteConfirm.open}
                title="Remove Item?"
                message="This action cannot be undone."
                variant="danger"
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm({ open: false, type: '', id: null })}
            />

            {creatorModalOpen && (
                <div className="confirm-overlay" onClick={resetCreatorModal}>
                    <div className="confirm-modal settings-creator-modal" onClick={e => e.stopPropagation()}>
                        <div className="settings-creator-modal__header">
                            <div>
                                <h3 className="confirm-modal__title">Become a Creator</h3>
                                <p className="settings-creator-modal__sub">Step {creatorStep} of 3</p>
                            </div>
                            <button className="settings-creator-modal__close" onClick={resetCreatorModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="settings-creator-modal__progress">
                            {[1, 2, 3].map(step => (
                                <div
                                    key={step}
                                    className={`settings-creator-modal__dot ${creatorStep >= step ? 'is-active' : ''}`}
                                />
                            ))}
                        </div>

                        {creatorStep === 1 && (
                            <div className="settings-creator-form">
                                <div className="settings-form-row">
                                    <div className="settings-form-group">
                                        <label>First Name</label>
                                        <input value={creatorForm.first_name} onChange={e => updateCreatorField('first_name', e.target.value)} />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Last Name</label>
                                        <input value={creatorForm.last_name} onChange={e => updateCreatorField('last_name', e.target.value)} />
                                    </div>
                                </div>
                                <div className="settings-form-row">
                                    <div className="settings-form-group">
                                        <label>Middle Name</label>
                                        <input value={creatorForm.middle_name} onChange={e => updateCreatorField('middle_name', e.target.value)} />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Phone</label>
                                        <input
                                            value={creatorForm.phone}
                                            onChange={e => updateCreatorField('phone', digitsOnly(e.target.value, 10))}
                                            placeholder="09123456789"
                                            inputMode="numeric"
                                        />
                                    </div>
                                </div>
                                <div className="settings-form-row">
                                    <div className="settings-form-group">
                                        <label>Government ID Number</label>
                                        <input
                                            value={creatorForm.id_number}
                                            onChange={e => updateCreatorField('id_number', digitsOnly(e.target.value, 12))}
                                            placeholder="12 digits"
                                            inputMode="numeric"
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Country</label>
                                        <input value={creatorForm.country} onChange={e => updateCreatorField('country', e.target.value)} />
                                    </div>
                                </div>
                                <div className="settings-form-row settings-form-row--3">
                                    {Object.entries(SETTINGS_ID_UPLOAD_META).map(([fieldKey, meta]) => (
                                        <div key={fieldKey} className="settings-form-group">
                                            <label>{meta.label}</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => handleCreatorIdUpload(fieldKey, e.target.files?.[0] || null)}
                                            />
                                            <small style={{ color: creatorForm[fieldKey] ? '#22c55e' : '#94a3b8' }}>
                                                {creatorUploadingField === fieldKey
                                                    ? 'Uploading...'
                                                    : creatorForm[fieldKey]
                                                        ? 'Uploaded'
                                                        : meta.required
                                                            ? 'Required'
                                                            : 'Optional'}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                                <div className="settings-form-group">
                                    <label>Street Address</label>
                                    <input value={creatorForm.street_address} onChange={e => updateCreatorField('street_address', e.target.value)} />
                                </div>
                                <div className="settings-form-row settings-form-row--3">
                                    <div className="settings-form-group">
                                        <label>Barangay / District</label>
                                        <input value={creatorForm.barangay} onChange={e => updateCreatorField('barangay', e.target.value)} />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>City</label>
                                        <input value={creatorForm.city} onChange={e => updateCreatorField('city', e.target.value)} />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Postal Code</label>
                                        <input
                                            value={creatorForm.postal_code}
                                            onChange={e => updateCreatorField('postal_code', digitsOnly(e.target.value, 10))}
                                            inputMode="numeric"
                                        />
                                    </div>
                                </div>
                                <div className="settings-form-group">
                                    <label>Province / State</label>
                                    <input value={creatorForm.province} onChange={e => updateCreatorField('province', e.target.value)} />
                                </div>
                            </div>
                        )}

                        {creatorStep === 2 && (
                            <div className="settings-creator-form">
                                <div className="settings-form-group">
                                    <label>Main Category</label>
                                    <select value={creatorForm.category} onChange={e => updateCreatorField('category', e.target.value)}>
                                        <option value="">Select category</option>
                                        {CREATOR_MAIN_CATEGORIES.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>

                                {creatorForm.category && (
                                    <div className="settings-form-group">
                                        <label>Skills</label>
                                        <div className="settings-creator-skills">
                                            {(CREATOR_SUBCATEGORY_MAP[creatorForm.category] || []).map(skill => (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    className={`settings-creator-skill ${creatorForm.skills.includes(skill) ? 'is-active' : ''}`}
                                                    onClick={() => toggleCreatorSkill(skill)}
                                                >
                                                    {skill}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="settings-form-row settings-form-row--3">
                                    <div className="settings-form-group">
                                        <label>Experience</label>
                                        <input
                                            value={creatorForm.experience_years}
                                            onChange={e => updateCreatorField('experience_years', digitsOnly(e.target.value, 2))}
                                            placeholder="e.g. 3"
                                            inputMode="numeric"
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Starting Price</label>
                                        <input
                                            value={creatorForm.starting_price}
                                            onChange={e => updateCreatorField('starting_price', digitsOnly(e.target.value, 9))}
                                            placeholder="e.g. 500"
                                            inputMode="numeric"
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Turnaround</label>
                                        <input value={creatorForm.turnaround_time} onChange={e => updateCreatorField('turnaround_time', e.target.value)} placeholder="e.g. 3 days" />
                                    </div>
                                </div>

                                <div className="settings-form-group">
                                    <label>Bio</label>
                                    <textarea rows="5" value={creatorForm.bio} onChange={e => updateCreatorField('bio', e.target.value)} placeholder="Tell clients about your work, strengths, and creative approach." />
                                </div>

                                <div className="settings-form-group">
                                    <label>Portfolio URL</label>
                                    <input value={creatorForm.portfolio_url} onChange={e => updateCreatorField('portfolio_url', e.target.value)} placeholder="https://..." />
                                </div>
                            </div>
                        )}

                        {creatorStep === 3 && (
                            <div className="settings-creator-form">
                                <div className="settings-creator-review">
                                    <h4>Review your creator setup</h4>
                                    <p>Your application will stay pending until an admin reviews and approves it.</p>
                                    <ul className="settings-creator-review__list">
                                        <li><strong>Name:</strong> {[creatorForm.first_name, creatorForm.middle_name, creatorForm.last_name].filter(Boolean).join(' ')}</li>
                                        <li><strong>ID Verification:</strong> {creatorForm.id_front_url && creatorForm.id_back_url ? (creatorForm.id_selfie_url ? 'Front, back, and selfie uploaded' : 'Front and back uploaded') : 'Missing required uploads'}</li>
                                        <li><strong>Category:</strong> {creatorForm.category || 'Not selected'}</li>
                                        <li><strong>Skills:</strong> {creatorForm.skills.join(', ') || 'None selected'}</li>
                                        <li><strong>Rate:</strong> {creatorForm.starting_price || 'N/A'}</li>
                                        <li><strong>Turnaround:</strong> {creatorForm.turnaround_time || 'N/A'}</li>
                                    </ul>
                                </div>

                                <label className="settings-creator-agree">
                                    <input
                                        type="checkbox"
                                        checked={creatorForm.agreed}
                                        onChange={e => updateCreatorField('agreed', e.target.checked)}
                                    />
                                    <span>I confirm the information is accurate and I want to submit this creator application for admin review.</span>
                                </label>
                            </div>
                        )}

                        <div className="confirm-modal__actions">
                            {creatorStep > 1 ? (
                                <button type="button" className="confirm-modal__btn confirm-modal__btn--cancel" onClick={handleCreatorBack}>
                                    Back
                                </button>
                            ) : (
                                <button type="button" className="confirm-modal__btn confirm-modal__btn--cancel" onClick={resetCreatorModal}>
                                    Cancel
                                </button>
                            )}

                            {creatorStep < 3 ? (
                                <button type="button" className="confirm-modal__btn confirm-modal__btn--confirm" onClick={handleCreatorNext}>
                                    Continue
                                </button>
                            ) : (
                                <button type="button" className="confirm-modal__btn confirm-modal__btn--confirm" disabled={creatorSubmitting} onClick={handleCreatorSubmit}>
                                    {creatorSubmitting ? 'Submitting...' : 'Submit Application'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SettingsPage;
