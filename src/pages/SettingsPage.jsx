import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    User, Shield, Bell, CreditCard, HelpCircle, LogOut, Camera, Users, Heart,
    ChevronRight, Mail, Phone, Globe, Palette, Save, X, Send, UserPlus, UserMinus, Trash2,
} from 'lucide-react';
import {
    getUserData, patchUser, fetchMyFollowers, fetchMyFollowing, deleteFollow,
    fetchMyWallets, createWallet, deleteWallet, fetchMyPaymentMethods, createPaymentMethod, deletePaymentMethod,
    createSupportTicket, fetchSupportTickets,
} from '../api';
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

const SettingsPage = ({ userRole, onLogout }) => {
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'profile';
    const [activeTab, setActiveTab] = useState(initialTab);
    const userData = getUserData();
    const [toast, setToast] = useState('');

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

    useEffect(() => {
        document.documentElement.style.setProperty('--accent', accentColor);
        localStorage.setItem('createch_accent', accentColor);
    }, [accentColor]);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

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
        if (activeTab === 'help') {
            loadHelpTickets();
        }
    }, [activeTab, userData?.firebase_uid]);

    // ── PROFILE ──
    const handleProfileSave = async () => {
        setSaving(true);
        try {
            const { ok } = await patchUser(userData?.firebase_uid, {
                display_name: profileForm.full_name,
                avatar_url: profileForm.avatar_url,
            });
            if (ok) {
                // Update local storage
                const u = getUserData();
                u.full_name = profileForm.full_name;
                u.avatar_url = profileForm.avatar_url;
                localStorage.setItem('createch_user', JSON.stringify(u));
                showToast('Profile updated!');
            } else {
                showToast('Failed to update profile.');
            }
        } catch { showToast('Connection error.'); }
        setSaving(false);
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
                    {TABS.map(tab => (
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
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Avatar URL</label>
                                        <input style={inputStyle} placeholder="https://example.com/photo.jpg" value={profileForm.avatar_url}
                                            onChange={e => setProfileForm(p => ({ ...p, avatar_url: e.target.value }))} />
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
        </main>
    );
};

export default SettingsPage;
