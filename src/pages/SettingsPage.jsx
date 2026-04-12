import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserData, fetchCreators, updateCreator, updateUser } from '../api';
import { User, Palette, Users, CreditCard, Bell, Shield, HelpCircle, Database, LogOut } from 'lucide-react';
import './SettingsPage.css';

const CREATOR_TABS = [
    { id: 'personal', label: 'Personal Info', icon: <User size={16} /> },
    { id: 'creator', label: 'Creator Profile', icon: <Palette size={16} /> },
    { id: 'followers', label: 'Followers', icon: <Users size={16} /> },
    { id: 'payout', label: 'Payout Methods', icon: <CreditCard size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'help', label: 'Help Center', icon: <HelpCircle size={16} /> },
    { id: 'data', label: 'Support & Data', icon: <Database size={16} /> },
];

const CLIENT_TABS = [
    { id: 'personal', label: 'Personal Info', icon: <User size={16} /> },
    { id: 'following', label: 'Following', icon: <Users size={16} /> },
    { id: 'payment', label: 'Payment Methods', icon: <CreditCard size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'help', label: 'Help Center', icon: <HelpCircle size={16} /> },
    { id: 'data', label: 'Support & Data', icon: <Database size={16} /> },
];

const SettingsPage = ({ onLogout, userRole = 'creator' }) => {
    const isCreator = userRole === 'creator';
    const TABS = isCreator ? CREATOR_TABS : CLIENT_TABS;
    const [activeTab, setActiveTab] = useState('personal');
    const [creator, setCreator] = useState(null);
    const [personalForm, setPersonalForm] = useState({ firstName: '', lastName: '', email: '', phone: '', birthdate: '', gender: '', nationality: '', address: '' });
    const [creatorForm, setCreatorForm] = useState({ jobTitle: '', bio: '', portfolioUrl: '', hourlyRate: '', experience: '', skills: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('success');
    const navigate = useNavigate();

    const userData = getUserData();

    useEffect(() => {
        // Populate personal info
        const names = (userData?.full_name || '').split(' ');
        setPersonalForm(p => ({
            ...p,
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || '',
            email: userData?.email || '',
            phone: userData?.phone || '',
        }));

        // Fetch creator profile
        (async () => {
            try {
                const { ok, data } = await fetchCreators();
                if (ok) {
                    const allCreators = data.results || data || [];
                    const myCreator = allCreators.find(c => c.user_id === userData?.firebase_uid);
                    if (myCreator) {
                        setCreator(myCreator);
                        setCreatorForm({
                            jobTitle: myCreator.job_title || '',
                            bio: myCreator.bio || '',
                            portfolioUrl: myCreator.portfolio_url || '',
                            hourlyRate: myCreator.starting_price || '',
                            experience: myCreator.years_experience || '',
                            skills: (myCreator.skills || []).join(', '),
                        });
                    }
                }
            } catch { /* ignore */ }
        })();
    }, []);

    const showMsg = (text, type = 'success') => { setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 3000); };

    const handleSavePersonal = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { ok } = await updateUser(userData?.firebase_uid, {
                first_name: personalForm.firstName,
                last_name: personalForm.lastName,
                phone: personalForm.phone,
            });
            if (ok) {
                showMsg('Personal information saved!');
            } else {
                showMsg('Failed to save changes.', 'error');
            }
        } catch {
            showMsg('Connection error. Try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveCreator = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (!creator) { showMsg('No creator profile found.', 'error'); setSaving(false); return; }
            const { ok } = await updateCreator(creator.id, {
                job_title: creatorForm.jobTitle,
                bio: creatorForm.bio,
                portfolio_url: creatorForm.portfolioUrl,
                starting_price: parseFloat(creatorForm.hourlyRate) || 0,
                years_experience: parseInt(creatorForm.experience) || 0,
                skills: creatorForm.skills.split(',').map(s => s.trim()).filter(Boolean),
            });
            if (ok) {
                showMsg('Creator profile saved!');
            } else {
                showMsg('Failed to save profile.', 'error');
            }
        } catch {
            showMsg('Connection error. Try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="settings-page">
            <div className="settings-breadcrumb">
                <span className="settings-bc-muted">{isCreator ? 'Creator Workspace' : 'Client Workspace'}</span>
                <span className="settings-bc-sep">/</span>
                <span className="settings-bc-active">Settings</span>
            </div>

            <div className="settings-layout">
                {/* Left Nav */}
                <div className="settings-nav">
                    <h2>Settings</h2>
                    {TABS.map(tab => (
                        <button key={tab.id} className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                    <button className="settings-nav-item settings-nav-logout" onClick={onLogout}>
                        <LogOut size={16} /> Log Out
                    </button>
                </div>

                {/* Right Content */}
                <div className="settings-content">
                    {msg && <div className={`global-toast global-toast--${msgType}`}>{msg}</div>}

                    {activeTab === 'personal' && (
                        <div>
                            <h3 className="settings-content-title">Personal Information</h3>
                            <p className="settings-content-sub">Manage your identity and contact details.</p>

                            <div className="settings-photo-row">
                                <div className="settings-photo-avatar">
                                    {(userData?.full_name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="settings-photo-label">Profile Photo</p>
                                    <p className="settings-photo-hint">Recommended 400×400px. JPG, PNG or GIF.</p>
                                    <button className="settings-upload-btn">Upload</button>
                                </div>
                            </div>

                            <form onSubmit={handleSavePersonal} className="settings-form">
                                <div className="settings-form-row">
                                    <div className="settings-form-group">
                                        <label>First Name</label>
                                        <input type="text" value={personalForm.firstName} onChange={e => setPersonalForm(p => ({ ...p, firstName: e.target.value }))} />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Last Name</label>
                                        <input type="text" value={personalForm.lastName} onChange={e => setPersonalForm(p => ({ ...p, lastName: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="settings-form-row">
                                    <div className="settings-form-group">
                                        <label>Email</label>
                                        <input type="email" value={personalForm.email} disabled style={{ opacity: 0.5 }} />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Phone Number</label>
                                        <input type="tel" placeholder="+63" value={personalForm.phone} onChange={e => setPersonalForm(p => ({ ...p, phone: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="settings-form-row settings-form-row--3">
                                    <div className="settings-form-group">
                                        <label>Birthdate</label>
                                        <input type="date" value={personalForm.birthdate} onChange={e => setPersonalForm(p => ({ ...p, birthdate: e.target.value }))} />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Gender</label>
                                        <select value={personalForm.gender} onChange={e => setPersonalForm(p => ({ ...p, gender: e.target.value }))}>
                                            <option value="">Select...</option>
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Nationality</label>
                                        <input type="text" placeholder="e.g. Filipino" value={personalForm.nationality} onChange={e => setPersonalForm(p => ({ ...p, nationality: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="settings-form-group">
                                    <label>Address</label>
                                    <textarea rows={2} value={personalForm.address} onChange={e => setPersonalForm(p => ({ ...p, address: e.target.value }))} />
                                </div>
                                <div className="settings-form-actions">
                                    <button type="submit" className="settings-save-btn" disabled={saving}>Save Changes</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'creator' && (
                        <div>
                            <h3 className="settings-content-title">Creator Profile</h3>
                            <p className="settings-content-sub">Manage your professional appearance and rates.</p>
                            <form onSubmit={handleSaveCreator} className="settings-form">
                                <div className="settings-form-group">
                                    <label>Job Title</label>
                                    <input type="text" value={creatorForm.jobTitle} onChange={e => setCreatorForm(p => ({ ...p, jobTitle: e.target.value }))} />
                                </div>
                                <div className="settings-form-group">
                                    <label>Bio</label>
                                    <textarea rows={3} value={creatorForm.bio} onChange={e => setCreatorForm(p => ({ ...p, bio: e.target.value }))} placeholder="Markdown supported" />
                                </div>
                                <div className="settings-form-group">
                                    <label>Portfolio URL</label>
                                    <input type="url" placeholder="https://" value={creatorForm.portfolioUrl} onChange={e => setCreatorForm(p => ({ ...p, portfolioUrl: e.target.value }))} />
                                </div>
                                <div className="settings-form-row">
                                    <div className="settings-form-group">
                                        <label>Hourly Rate (₱)</label>
                                        <input type="number" value={creatorForm.hourlyRate} onChange={e => setCreatorForm(p => ({ ...p, hourlyRate: e.target.value }))} />
                                    </div>
                                    <div className="settings-form-group">
                                        <label>Years of Experience</label>
                                        <input type="number" value={creatorForm.experience} onChange={e => setCreatorForm(p => ({ ...p, experience: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="settings-form-group">
                                    <label>Skills (Comma separated)</label>
                                    <input type="text" value={creatorForm.skills} onChange={e => setCreatorForm(p => ({ ...p, skills: e.target.value }))} />
                                </div>
                                <div className="settings-form-actions">
                                    <button type="submit" className="settings-save-btn" disabled={saving}>Save Profile</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'followers' && (
                        <div>
                            <h3 className="settings-content-title">Followers</h3>
                            <p className="settings-content-sub">People following your work.</p>
                            <div className="settings-empty-card">
                                <Users size={32} color="#3f3f46" />
                                <p>No followers yet.</p>
                                <span>Keep creating amazing work!</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payout' && (
                        <div>
                            <h3 className="settings-content-title">Payout Methods</h3>
                            <p className="settings-content-sub">Manage how you receive your earnings.</p>
                            <div className="settings-empty-card">
                                <CreditCard size={32} color="#3f3f46" />
                                <p>No payout methods configured.</p>
                                <button className="settings-save-btn" style={{ marginTop: '0.5rem' }}>Add Payout Method</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'following' && (
                        <div>
                            <h3 className="settings-content-title">Following</h3>
                            <p className="settings-content-sub">Creators you are following.</p>
                            <div className="settings-empty-card">
                                <Users size={32} color="#3f3f46" />
                                <p>You're not following anyone yet.</p>
                                <span>Discover creators and follow them!</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div>
                            <h3 className="settings-content-title">Payment Methods</h3>
                            <p className="settings-content-sub">Manage your payment options.</p>
                            <div className="settings-empty-card">
                                <CreditCard size={32} color="#3f3f46" />
                                <p>No payment methods added.</p>
                                <button className="settings-save-btn" style={{ marginTop: '0.5rem' }}>Add Payment Method</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div>
                            <h3 className="settings-content-title">Notification Preferences</h3>
                            <p className="settings-content-sub">Choose what notifications you receive.</p>
                            <div className="settings-toggle-list">
                                {['Email notifications', 'Push notifications', 'Order updates', 'Marketing emails'].map(item => (
                                    <div key={item} className="settings-toggle-row">
                                        <span>{item}</span>
                                        <div className="settings-toggle"><div className="settings-toggle-knob"></div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h3 className="settings-content-title">Security</h3>
                            <p className="settings-content-sub">Manage your account security settings.</p>
                            <div className="settings-form">
                                <div className="settings-form-group"><label>Current Password</label><input type="password" placeholder="••••••••" /></div>
                                <div className="settings-form-group"><label>New Password</label><input type="password" placeholder="••••••••" /></div>
                                <div className="settings-form-actions"><button className="settings-save-btn">Update Password</button></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'help' && (
                        <div>
                            <h3 className="settings-content-title">Help Center</h3>
                            <p className="settings-content-sub">Get help with your account.</p>
                            <div className="settings-empty-card">
                                <HelpCircle size={32} color="#3f3f46" />
                                <p>Need help? Contact us at support@createch.com</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div>
                            <h3 className="settings-content-title">Support & Data</h3>
                            <p className="settings-content-sub">Manage your data and privacy.</p>
                            <div className="settings-empty-card">
                                <Database size={32} color="#3f3f46" />
                                <p>Your data is securely stored and encrypted.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default SettingsPage;
