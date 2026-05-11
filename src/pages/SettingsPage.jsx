import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  Search,
  Shield,
  Sparkles,
  Trash2,
  User as UserIcon,
  Users,
} from 'lucide-react';
import {
  createPaymentMethod,
  changeEmail,
  changePassword,
  createSupportTicket,
  createWallet,
  deleteFollow,
  deletePaymentMethod,
  deleteWallet,
  fetchCreatorByUid,
  fetchMyFollowers,
  fetchMyFollowing,
  fetchMyPaymentMethods,
  fetchMyWallets,
  fetchReports,
  fetchSupportTickets,
  fetchUsers,
  getUserData,
  patchUser,
  updateCreator,
  updateReport,
} from '../api';
import { Avatar } from '../components/Avatar';
import ConfirmModal from '../components/ConfirmModal';
import { GlassCard } from '../components/GlassCard';
import { Toast } from '../components/Toast';

const Toggle = ({ active, onClick }) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    onClick={onClick}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-blue-600' : 'bg-zinc-700'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const FAQ_DATA = [
  { category: 'Account', questions: [{ q: 'How do I update my profile?', a: 'Open Personal Info and save your updated details.' }] },
  { category: 'Orders', questions: [{ q: 'How do I track an order?', a: 'Open Orders and select an order to view full timeline and status updates.' }] },
  { category: 'Payments', questions: [{ q: 'How do payouts work?', a: 'Creators can manage payout methods in Finance and withdraw from Wallet.' }] },
];

export default function SettingsPage({ userRole, onLogout }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userData = getUserData();
  const uid = userData?.firebase_uid || userData?.id;
  const isAdmin = userRole === 'admin';
  const isCreator = userRole === 'creator';
  const isClient = userRole === 'client';
  const isSocialAuth = userData?.auth_provider === 'google';

  const [activeSection, setActiveSection] = useState(searchParams.get('tab') || 'profile');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: userData?.full_name?.split(' ')[0] || '',
    lastName: userData?.full_name?.split(' ').slice(1).join(' ') || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    avatar_url: userData?.avatar_url || '',
  });

  const [creatorForm, setCreatorForm] = useState({
    id: null,
    bio: '',
    skills: '',
    portfolio_url: '',
    experience_years: 0,
    starting_price: 0,
  });

  const [notifPrefs, setNotifPrefs] = useState({
    orderUpdates: true,
    messages: true,
    reviews: true,
    promotions: false,
    moderation: true,
    disputes: true,
  });

  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [socialLoading, setSocialLoading] = useState(false);

  const [wallets, setWallets] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [payoutForm, setPayoutForm] = useState({ wallet_type: 'GCash', account_name: '', account_number: '' });
  const [pmForm, setPmForm] = useState({ method_type: '', masked_number: '' });

  const [supportCategory, setSupportCategory] = useState('General');
  const [supportMessage, setSupportMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityForm, setSecurityForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    new_email: userData?.email || '',
  });

  const [adminStats, setAdminStats] = useState({ users: 0, openReports: 0, openTickets: 0 });
  const [adminReports, setAdminReports] = useState([]);
  const [adminTickets, setAdminTickets] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null });
  const [deleting, setDeleting] = useState(false);

  const sections = useMemo(() => {
    if (isAdmin) {
      return [
        { id: 'profile', label: 'Personal Info', icon: UserIcon },
        { id: 'platform', label: 'Platform Controls', icon: Sparkles },
        { id: 'notifications', label: 'Admin Alerts', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'support', label: 'Platform Support', icon: FileText },
        { id: 'logout', label: 'Log Out', icon: LogOut },
      ];
    }
    return [
      { id: 'profile', label: 'Personal Info', icon: UserIcon },
      ...(isCreator ? [{ id: 'creator', label: 'Creator Profile', icon: Sparkles }] : []),
      ...(isClient ? [{ id: 'following', label: 'Following', icon: Users }] : []),
      ...(isCreator ? [{ id: 'followers', label: 'Followers', icon: Users }] : []),
      { id: 'finance', label: 'Finance', icon: CreditCard },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'security', label: 'Security', icon: Lock },
      { id: 'help', label: 'Help Center', icon: HelpCircle },
      { id: 'support', label: 'Support & Data', icon: FileText },
      { id: 'logout', label: 'Log Out', icon: LogOut },
    ];
  }, [isAdmin, isClient, isCreator]);

  useEffect(() => {
    if (!sections.some((s) => s.id === activeSection)) setActiveSection('profile');
  }, [activeSection, sections]);

  useEffect(() => {
    if (!isCreator || !uid) return;
    const loadCreator = async () => {
      const res = await fetchCreatorByUid(uid);
      if (!res.ok) return;
      const c = res.data;
      setCreatorForm({
        id: c.id,
        bio: c.bio || '',
        skills: Array.isArray(c.skills) ? c.skills.join(', ') : (c.skills || ''),
        portfolio_url: c.portfolio_url || '',
        experience_years: Number(c.experience_years || 0),
        starting_price: Number(c.starting_price || 0),
      });
    };
    loadCreator();
  }, [isCreator, uid]);

  useEffect(() => {
    const loadSocial = async () => {
      if (!['following', 'followers'].includes(activeSection)) return;
      setSocialLoading(true);
      try {
        const [f1, f2] = await Promise.all([fetchMyFollowing(), fetchMyFollowers()]);
        if (f1.ok) setFollowing(f1.data?.results || f1.data || []);
        if (f2.ok) setFollowers(f2.data?.results || f2.data || []);
      } finally {
        setSocialLoading(false);
      }
    };
    const loadFinance = async () => {
      if (activeSection !== 'finance') return;
      if (isCreator) {
        const w = await fetchMyWallets();
        if (w.ok) setWallets(w.data?.results || w.data || []);
        return;
      }
      if (isClient) {
        const p = await fetchMyPaymentMethods();
        if (p.ok) setPaymentMethods(p.data?.results || p.data || []);
      }
    };
    const loadSupport = async () => {
      if (!['support', 'platform'].includes(activeSection)) return;
      setTicketsLoading(true);
      try {
        const tRes = await fetchSupportTickets();
        const allTickets = tRes.ok ? (tRes.data?.results || tRes.data || []) : [];
        if (isAdmin) {
          setAdminTickets(allTickets);
          setTickets(allTickets);
        } else {
          setTickets(allTickets.filter((t) => String(t.user_id) === String(uid)));
        }
        if (isAdmin) {
          const [uRes, rRes] = await Promise.all([fetchUsers(), fetchReports()]);
          const users = uRes.ok ? (uRes.data?.results || uRes.data || []) : [];
          const reports = rRes.ok ? (rRes.data?.results || rRes.data || []) : [];
          setAdminReports(reports);
          const openReports = reports.filter((r) => !['resolved', 'dismissed'].includes((r.status || '').toLowerCase())).length;
          const openTickets = allTickets.filter((t) => !['resolved', 'closed'].includes((t.status || '').toLowerCase())).length;
          setAdminStats({ users: users.length, openReports, openTickets });
        }
      } finally {
        setTicketsLoading(false);
      }
    };
    loadSocial();
    loadFinance();
    loadSupport();
  }, [activeSection, isAdmin, isClient, isCreator, uid]);

  const showToast = (message, type = 'success') => setToast({ visible: true, message, type });

  const handleSaveProfile = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
      const res = await patchUser(uid, {
        display_name: fullName,
        avatar_url: profileForm.avatar_url,
        phone: profileForm.phone,
        address: profileForm.address,
      });
      if (!res.ok) throw new Error('save failed');
      localStorage.setItem('createch_user', JSON.stringify({ ...userData, full_name: fullName, avatar_url: profileForm.avatar_url }));
      showToast('Settings updated successfully');
    } catch {
      showToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCreator = async () => {
    if (!creatorForm.id) return;
    setSaving(true);
    try {
      const res = await updateCreator(creatorForm.id, {
        bio: creatorForm.bio,
        skills: creatorForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
        portfolio_url: creatorForm.portfolio_url,
        experience_years: Number(creatorForm.experience_years || 0),
        starting_price: Number(creatorForm.starting_price || 0),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Creator profile updated');
    } catch {
      showToast('Failed to update creator profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    const res = await createWallet({ ...payoutForm, user_id: uid });
    if (res.ok) {
      setWallets((prev) => [res.data, ...prev]);
      setPayoutForm({ wallet_type: 'GCash', account_name: '', account_number: '' });
      showToast('Payout method added');
    } else showToast('Failed to add payout method', 'error');
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const res = await createPaymentMethod({ ...pmForm, user_id: uid });
    if (res.ok) {
      setPaymentMethods((prev) => [res.data, ...prev]);
      setPmForm({ method_type: '', masked_number: '' });
      showToast('Payment method added');
    } else showToast('Failed to add payment method', 'error');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { type, id } = deleteConfirm;
      const fn = type === 'wallet' ? deleteWallet : type === 'payment' ? deletePaymentMethod : deleteFollow;
      const res = await fn(id);
      if (!res.ok) throw new Error('delete failed');
      if (type === 'wallet') setWallets((prev) => prev.filter((x) => x.id !== id));
      if (type === 'payment') setPaymentMethods((prev) => prev.filter((x) => x.id !== id));
      if (type === 'follow') setFollowing((prev) => prev.filter((x) => x.id !== id));
      showToast('Removed');
    } catch {
      showToast('Failed to remove', 'error');
    } finally {
      setDeleting(false);
      setDeleteConfirm({ open: false, type: '', id: null });
    }
  };

  const handleSubmitSupport = async () => {
    if (!supportMessage.trim()) return;
    setLoading(true);
    try {
      const res = await createSupportTicket({
        ticket_number: `TKT-${Date.now()}`,
        user_id: uid,
        email: profileForm.email,
        category: supportCategory,
        message: supportMessage,
        user_role: userRole,
        status: 'open',
      });
      if (!res.ok) throw new Error();
      setSupportMessage('');
      showToast('Ticket submitted');
      setTickets((prev) => [res.data, ...prev]);
    } catch {
      showToast('Ticket submit failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleModerateReport = async (reportId, status) => {
    const res = await updateReport(reportId, { status, admin_notes: `Set by admin in settings (${status})` });
    if (!res.ok) return showToast('Failed to update report', 'error');
    setAdminReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    showToast(`Report marked ${status}`);
  };

  const handleUpdatePassword = async () => {
    if (isSocialAuth) return;
    setSecurityLoading(true);
    try {
      const res = await changePassword({
        current_password: securityForm.current_password,
        new_password: securityForm.new_password,
        confirm_password: securityForm.confirm_password,
      });
      if (!res.ok) throw new Error(res?.data?.detail || 'Failed to update password');
      setSecurityForm((p) => ({ ...p, current_password: '', new_password: '', confirm_password: '' }));
      showToast('Password updated successfully');
    } catch (err) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (isSocialAuth) return;
    setSecurityLoading(true);
    try {
      const res = await changeEmail({
        current_password: securityForm.current_password,
        new_email: securityForm.new_email,
      });
      if (!res.ok) throw new Error(res?.data?.detail || 'Failed to update email');
      const updatedEmail = res.data?.email || securityForm.new_email;
      setProfileForm((p) => ({ ...p, email: updatedEmail }));
      const existing = getUserData() || {};
      localStorage.setItem('createch_user', JSON.stringify({ ...existing, email: updatedEmail }));
      showToast('Email updated successfully');
    } catch (err) {
      showToast(err.message || 'Failed to update email', 'error');
    } finally {
      setSecurityLoading(false);
    }
  };

  const filteredFaq = FAQ_DATA.map((cat) => ({
    ...cat,
    questions: cat.questions.filter((q) => !searchQuery || q.q.toLowerCase().includes(searchQuery.toLowerCase()) || q.a.toLowerCase().includes(searchQuery.toLowerCase())),
  })).filter((cat) => cat.questions.length > 0);

  return (
    <div className="flex h-full max-h-[calc(100vh-3.5rem)] max-w-6xl mx-auto p-6 gap-8">
      <Toast message={toast.message} isVisible={toast.visible} type={toast.type} onClose={() => setToast((p) => ({ ...p, visible: false }))} />

      <div className="w-64 shrink-0 space-y-1">
        <h2 className="text-lg font-medium text-white px-4 mb-4">{isAdmin ? 'Platform Settings' : 'Settings'}</h2>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => (section.id === 'logout' ? onLogout?.() : setActiveSection(section.id))}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all group ${section.id === 'logout'
              ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
              : activeSection === section.id
                ? 'bg-white text-black font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            <section.icon size={18} className={activeSection === section.id && section.id !== 'logout' ? 'text-black' : ''} />
            {section.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-20 animate-in fade-in duration-300">
        {activeSection === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-xl font-medium text-white">{isAdmin ? 'Admin Personal Information' : 'Personal Information'}</h3>
              <p className="text-sm text-zinc-500">{isAdmin ? 'Manage your platform admin identity and contact details.' : 'Manage your identity and contact details.'}</p>
            </div>
            <GlassCard className="p-8 border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-6">
                <Avatar src={profileForm.avatar_url} alt={`${profileForm.firstName} ${profileForm.lastName}`} size={96} className="w-24 h-24 border border-white/10" />
                <div className="flex-1 space-y-2">
                  <p className="text-white text-sm font-medium">Avatar URL</p>
                  <input value={profileForm.avatar_url} onChange={(e) => setProfileForm((p) => ({ ...p, avatar_url: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <input value={profileForm.firstName} onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="First Name" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
                <input value={profileForm.lastName} onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Last Name" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <input value={profileForm.email} disabled className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-500" />
                <input value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone Number" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
              </div>
              <textarea value={profileForm.address} onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))} placeholder="Address" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white resize-none" rows={2} />
              <div className="flex justify-end">
                <button onClick={handleSaveProfile} disabled={saving} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </GlassCard>
          </div>
        )}

        {activeSection === 'creator' && isCreator && (
          <div className="space-y-6 max-w-2xl">
            <div><h3 className="text-xl font-medium text-white">Creator Profile</h3><p className="text-sm text-zinc-500">Manage your professional appearance and rates.</p></div>
            <GlassCard className="p-8 border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl space-y-4">
              <textarea rows={4} value={creatorForm.bio} onChange={(e) => setCreatorForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Bio" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white resize-none" />
              <input value={creatorForm.skills} onChange={(e) => setCreatorForm((p) => ({ ...p, skills: e.target.value }))} placeholder="Skills (comma separated)" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
              <input value={creatorForm.portfolio_url} onChange={(e) => setCreatorForm((p) => ({ ...p, portfolio_url: e.target.value }))} placeholder="Portfolio URL" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={creatorForm.starting_price} onChange={(e) => setCreatorForm((p) => ({ ...p, starting_price: e.target.value }))} placeholder="Hourly Rate" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
                <input type="number" value={creatorForm.experience_years} onChange={(e) => setCreatorForm((p) => ({ ...p, experience_years: e.target.value }))} placeholder="Experience Years" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveCreator} disabled={saving} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 disabled:opacity-50">{saving ? 'Saving...' : 'Save Profile'}</button>
              </div>
            </GlassCard>
          </div>
        )}

        {activeSection === 'finance' && !isAdmin && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-xl font-medium text-white">{isCreator ? 'Payout Methods' : 'Billing & Payments'}</h3>
              <p className="text-sm text-zinc-500">
                {isCreator ? 'Manage how you receive earnings.' : 'Manage your client billing methods and checkout readiness.'}
              </p>
            </div>
            {isCreator ? (
              <GlassCard className="p-6 border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl">
                <h4 className="text-white text-sm font-medium mb-3">Payout Wallets</h4>
                {wallets.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 mb-2">
                    <p className="text-sm text-zinc-300">{w.wallet_type} • {w.account_name} • {w.account_number}</p>
                    <button onClick={() => setDeleteConfirm({ open: true, type: 'wallet', id: w.id })} className="text-red-400"><Trash2 size={14} /></button>
                  </div>
                ))}
                <form onSubmit={handleAddWallet} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                  <input value={payoutForm.wallet_type} onChange={(e) => setPayoutForm((p) => ({ ...p, wallet_type: e.target.value }))} placeholder="Type" className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                  <input value={payoutForm.account_name} onChange={(e) => setPayoutForm((p) => ({ ...p, account_name: e.target.value }))} placeholder="Name" className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                  <input value={payoutForm.account_number} onChange={(e) => setPayoutForm((p) => ({ ...p, account_number: e.target.value }))} placeholder="Number" className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                  <button className="sm:col-span-3 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium">Add Wallet</button>
                </form>
              </GlassCard>
            ) : (
              <>
                <GlassCard className="p-6 border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl">
                  <h4 className="text-white text-sm font-medium mb-1">Billing Profile</h4>
                  <p className="text-xs text-zinc-500 mb-4">These methods are used when placing orders and booking services.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-white/10">
                      <p className="text-[11px] text-zinc-500">Billing Email</p>
                      <p className="text-sm text-zinc-200 mt-1">{profileForm.email || 'No email set'}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-white/10">
                      <p className="text-[11px] text-zinc-500">Status</p>
                      <p className="text-sm text-emerald-300 mt-1">Ready for checkout</p>
                    </div>
                  </div>
                </GlassCard>
                <GlassCard className="p-6 border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl">
                  <h4 className="text-white text-sm font-medium mb-3">Saved Payment Methods</h4>
                  {paymentMethods.map((pm) => (
                    <div key={pm.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 mb-2">
                      <p className="text-sm text-zinc-300">{pm.method_type} •••• {pm.masked_number}</p>
                      <button onClick={() => setDeleteConfirm({ open: true, type: 'payment', id: pm.id })} className="text-red-400"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {paymentMethods.length === 0 && <p className="text-xs text-zinc-500 mb-2">No payment methods yet.</p>}
                  <form onSubmit={handleAddPayment} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    <input value={pmForm.method_type} onChange={(e) => setPmForm((p) => ({ ...p, method_type: e.target.value }))} placeholder="Method Type (e.g. Card, GCash)" className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                    <input value={pmForm.masked_number} onChange={(e) => setPmForm((p) => ({ ...p, masked_number: e.target.value }))} placeholder="Last digits / label" className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                    <button className="sm:col-span-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium">Add Payment Method</button>
                  </form>
                </GlassCard>
              </>
            )}
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="space-y-6 max-w-3xl">
            <div><h3 className="text-xl font-medium text-white">{isAdmin ? 'Admin Alerts' : 'Notifications'}</h3><p className="text-sm text-zinc-500">{isAdmin ? 'Control moderation and platform alerts.' : 'Manage how you receive updates.'}</p></div>
            <GlassCard className="p-0 border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl overflow-hidden">
              {[
                { id: isAdmin ? 'moderation' : 'orderUpdates', label: isAdmin ? 'Moderation Queue' : 'Order Updates', desc: isAdmin ? 'Alerts for pending reports and actions' : 'Status changes on your orders' },
                { id: isAdmin ? 'disputes' : 'messages', label: isAdmin ? 'Dispute Activity' : 'Messages', desc: isAdmin ? 'Disputes requiring admin review' : 'New chat messages' },
                { id: 'reviews', label: 'Reviews', desc: 'When someone reviews your work' },
                { id: 'promotions', label: 'Promotions', desc: 'Tips, offers, and platform news' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <div><h4 className="text-sm font-medium text-white">{item.label}</h4><p className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</p></div>
                  <Toggle active={notifPrefs[item.id]} onClick={() => setNotifPrefs((p) => ({ ...p, [item.id]: !p[item.id] }))} />
                </div>
              ))}
            </GlassCard>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="space-y-6 max-w-2xl">
            <div><h3 className="text-xl font-medium text-white">Security</h3><p className="text-sm text-zinc-500">{isAdmin ? 'Keep platform access secure.' : 'Keep your account safe.'}</p></div>
            <GlassCard className="p-6 space-y-4 border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl">
              <div className="flex items-center justify-between"><span className="text-sm text-zinc-400">Role</span><span className="text-sm text-white capitalize">{userRole}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-zinc-400">UID</span><span className="text-xs text-zinc-500">{String(uid || '')}</span></div>
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-center gap-2"><Check size={14} /> Authentication active</div>
              {isSocialAuth ? (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs text-blue-300 flex items-center gap-2">
                  <Shield size={14} /> This account uses Google Sign-In. Password/email updates are handled by the provider flow.
                </div>
              ) : (
                <>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
                    <p className="text-xs text-zinc-400">Change Password</p>
                    <input
                      type="password"
                      value={securityForm.current_password}
                      onChange={(e) => setSecurityForm((p) => ({ ...p, current_password: e.target.value }))}
                      placeholder="Current password"
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="password"
                        value={securityForm.new_password}
                        onChange={(e) => setSecurityForm((p) => ({ ...p, new_password: e.target.value }))}
                        placeholder="New password"
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                      />
                      <input
                        type="password"
                        value={securityForm.confirm_password}
                        onChange={(e) => setSecurityForm((p) => ({ ...p, confirm_password: e.target.value }))}
                        placeholder="Confirm new password"
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleUpdatePassword}
                        disabled={securityLoading || !securityForm.current_password || !securityForm.new_password || !securityForm.confirm_password}
                        className="px-3 py-2 rounded-lg bg-white text-black text-xs font-medium disabled:opacity-50"
                      >
                        {securityLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
                    <p className="text-xs text-zinc-400">Change Email</p>
                    <input
                      type="email"
                      value={securityForm.new_email}
                      onChange={(e) => setSecurityForm((p) => ({ ...p, new_email: e.target.value }))}
                      placeholder="New email address"
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleUpdateEmail}
                        disabled={securityLoading || !securityForm.current_password || !securityForm.new_email}
                        className="px-3 py-2 rounded-lg bg-white text-black text-xs font-medium disabled:opacity-50"
                      >
                        {securityLoading ? 'Updating...' : 'Update Email'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </GlassCard>
          </div>
        )}

        {activeSection === 'following' && isClient && (
          <div className="space-y-6 max-w-2xl">
            <div><h3 className="text-xl font-medium text-white">Following</h3><p className="text-sm text-zinc-500">Creators you follow.</p></div>
            {socialLoading ? <p className="text-zinc-500">Loading...</p> : (
              <div className="space-y-3">
                {following.length === 0 && <GlassCard className="p-6 text-zinc-500">You are not following anyone yet.</GlassCard>}
                {following.map((f) => (
                  <GlassCard key={f.id} className="p-4 flex items-center justify-between border-white/5 bg-[#0A0A0A]/50">
                    <div className="flex items-center gap-3"><Avatar alt={String(f.following_id || 'U')} size={40} /><span className="text-sm text-white">{f.following_id}</span></div>
                    <button onClick={() => setDeleteConfirm({ open: true, type: 'follow', id: f.id })} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-300 hover:bg-white/5">Unfollow</button>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'followers' && isCreator && (
          <div className="space-y-6 max-w-2xl">
            <div><h3 className="text-xl font-medium text-white">Followers</h3><p className="text-sm text-zinc-500">People following your work.</p></div>
            {socialLoading ? <p className="text-zinc-500">Loading...</p> : (
              <div className="space-y-3">
                {followers.length === 0 && <GlassCard className="p-6 text-zinc-500">No followers yet.</GlassCard>}
                {followers.map((f) => (
                  <GlassCard key={f.id} className="p-4 flex items-center gap-3 border-white/5 bg-[#0A0A0A]/50">
                    <Avatar alt={String(f.follower_id || 'U')} size={40} />
                    <span className="text-sm text-white">{f.follower_id}</span>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'help' && !isAdmin && (
          <div className="space-y-6 max-w-3xl">
            <div><h3 className="text-xl font-medium text-white">Help Center</h3><p className="text-sm text-zinc-500">Find answers to common questions.</p></div>
            <div className="relative"><Search size={16} className="absolute left-3 top-3 text-zinc-500" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search FAQs..." className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white" /></div>
            {filteredFaq.map((cat) => (
              <GlassCard key={cat.category} className="p-0 border-white/5 bg-[#0A0A0A]/50 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/[0.02]"><h4 className="text-sm font-medium text-zinc-400">{cat.category}</h4></div>
                {cat.questions.map((faq, idx) => {
                  const id = `${cat.category}-${idx}`;
                  const open = expandedFaq === id;
                  return (
                    <div key={id} className="border-b border-white/5 last:border-0">
                      <button onClick={() => setExpandedFaq(open ? null : id)} className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] text-left">
                        <span className="text-sm text-white pr-4">{faq.q}</span>{open ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                      </button>
                      {open && <div className="px-4 pb-4 text-sm text-zinc-400">{faq.a}</div>}
                    </div>
                  );
                })}
              </GlassCard>
            ))}
          </div>
        )}

        {activeSection === 'platform' && isAdmin && (
          <div className="space-y-6 max-w-3xl">
            <div><h3 className="text-xl font-medium text-white">Platform Controls</h3><p className="text-sm text-zinc-500">FastAPI-backed operations for moderation and support oversight.</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <GlassCard className="p-4 border-white/5 bg-[#0A0A0A]/50"><p className="text-zinc-500 text-xs">Users</p><p className="text-white text-xl font-semibold mt-1">{adminStats.users}</p></GlassCard>
              <GlassCard className="p-4 border-white/5 bg-[#0A0A0A]/50"><p className="text-zinc-500 text-xs">Open Reports</p><p className="text-white text-xl font-semibold mt-1">{adminStats.openReports}</p></GlassCard>
              <GlassCard className="p-4 border-white/5 bg-[#0A0A0A]/50"><p className="text-zinc-500 text-xs">Open Tickets</p><p className="text-white text-xl font-semibold mt-1">{adminStats.openTickets}</p></GlassCard>
            </div>
            <GlassCard className="p-4 border-white/5 bg-[#0A0A0A]/50">
              <h4 className="text-white text-sm font-medium mb-3">Quick Navigation</h4>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('/users')} className="px-3 py-2 rounded-lg border border-white/10 text-xs text-zinc-200 hover:bg-white/5 flex items-center gap-1">User Management <ExternalLink size={12} /></button>
                <button onClick={() => navigate('/disputes')} className="px-3 py-2 rounded-lg border border-white/10 text-xs text-zinc-200 hover:bg-white/5 flex items-center gap-1">Disputes <ExternalLink size={12} /></button>
                <button onClick={() => navigate('/projects')} className="px-3 py-2 rounded-lg border border-white/10 text-xs text-zinc-200 hover:bg-white/5 flex items-center gap-1">Orders/Projects <ExternalLink size={12} /></button>
              </div>
            </GlassCard>
            <GlassCard className="p-4 border-white/5 bg-[#0A0A0A]/50">
              <h4 className="text-white text-sm font-medium mb-3">Report Moderation Queue</h4>
              {(adminReports || []).slice(0, 8).map((r) => (
                <div key={r.id} className="p-3 rounded-lg border border-white/10 mb-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-300">#{r.id} • {r.reason}</p>
                    <span className="text-[10px] px-2 py-1 rounded bg-white/10 text-zinc-300">{r.status || 'open'}</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => handleModerateReport(r.id, 'under_review')} className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px]">Under Review</button>
                    <button onClick={() => handleModerateReport(r.id, 'resolved')} className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px]">Resolve</button>
                    <button onClick={() => handleModerateReport(r.id, 'dismissed')} className="px-2 py-1 rounded bg-zinc-500/10 border border-zinc-500/20 text-zinc-300 text-[10px]">Dismiss</button>
                  </div>
                </div>
              ))}
              {adminReports.length === 0 && <p className="text-xs text-zinc-500">No reports found.</p>}
            </GlassCard>
          </div>
        )}

        {activeSection === 'support' && (
          <div className="space-y-6 max-w-2xl">
            <div><h3 className="text-xl font-medium text-white">{isAdmin ? 'Platform Support' : 'Support & Data'}</h3><p className="text-sm text-zinc-500">{isAdmin ? 'Coordinate operations and platform issues.' : 'Get help and manage support tickets.'}</p></div>
            <GlassCard className="p-6 border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl">
              <h4 className="text-white font-medium text-sm mb-4">{isAdmin ? 'Submit Ops Ticket' : 'Submit a Support Ticket'}</h4>
              <div className="space-y-3">
                <select value={supportCategory} onChange={(e) => setSupportCategory(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white">
                  <option value="General">General</option>
                  <option value="Billing">Billing</option>
                  <option value="Technical">Technical</option>
                  <option value="Dispute">Dispute</option>
                  {isAdmin && <option value="Platform Operations">Platform Operations</option>}
                </select>
                <textarea rows={4} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white resize-none" placeholder="Describe your issue in detail..." />
                <button onClick={handleSubmitSupport} disabled={loading || !supportMessage.trim()} className="w-full px-4 py-2.5 rounded-lg bg-white text-black text-sm font-medium disabled:opacity-50">{loading ? 'Submitting...' : 'Submit Ticket'}</button>
              </div>
            </GlassCard>
            <GlassCard className="p-6 border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl">
              <h4 className="text-white font-medium text-sm mb-3">{isAdmin ? 'Recent Platform Tickets' : 'Your Tickets'}</h4>
              {ticketsLoading ? <p className="text-zinc-500 text-sm">Loading...</p> : (
                <>
                  {(isAdmin ? adminTickets : tickets).slice(0, 12).map((t) => (
                    <div key={t.id} className="p-3 rounded-lg border border-white/10 mb-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-300">{t.ticket_number || `Ticket #${t.id}`}</p>
                        <span className={`text-[10px] px-2 py-1 rounded ${String(t.status).toLowerCase() === 'resolved' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>{t.status || 'open'}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{(t.message || '').slice(0, 120)}</p>
                    </div>
                  ))}
                  {(isAdmin ? adminTickets : tickets).length === 0 && <p className="text-xs text-zinc-500">No tickets yet.</p>}
                </>
              )}
              {!isAdmin && (
                <div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-lg flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-red-300 font-medium flex items-center gap-1"><AlertTriangle size={14} /> Danger Zone</p>
                    <p className="text-xs text-zinc-500 mt-1">Need account deletion? Contact support for a verified deletion request.</p>
                  </div>
                  <button onClick={() => setSupportMessage('Please assist with account deletion request.')} className="px-2 py-1 rounded border border-red-500/20 text-[10px] text-red-300">Request</button>
                </div>
              )}
            </GlassCard>
          </div>
        )}
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
    </div>
  );
}
