import { useState, memo } from 'react';
import { useNotification } from '../hooks/useNotification';
import {
    User, Bell, Lock, FileText, Sparkles, Users, CreditCard,
    Settings as SettingsIcon, ShieldAlert, ClipboardList, Activity, Save
} from 'lucide-react';
import '../styles/SettingsPage.css';

const ToggleSwitch = memo(({ checked, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
            position: 'relative', display: 'inline-flex', height: '24px', width: '44px',
            alignItems: 'center', borderRadius: '9999px',
            backgroundColor: checked ? '#3b82f6' : 'var(--toggle-bg)',
            border: 'none', cursor: 'pointer', transition: 'background-color 0.2s',
        }}
    >
        <span style={{
            display: 'inline-block', height: '16px', width: '16px',
            transform: checked ? 'translateX(24px)' : 'translateX(4px)',
            borderRadius: '50%', backgroundColor: 'white', transition: 'transform 0.2s',
        }} />
    </button>
));
ToggleSwitch.displayName = 'ToggleSwitch';

const SettingsPage = ({ userRole }) => {
    const [activeSection, setActiveSection] = useState('profile');
    const { notification, showNotification } = useNotification();

    // Shared state
    const [phone, setPhone] = useState('09123456789');
    const [pushNotif, setPushNotif] = useState(true);
    const [emailNotif, setEmailNotif] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Admin state
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [autoSuspend, setAutoSuspend] = useState(true);
    const [commissionRate, setCommissionRate] = useState('15');
    const [maxFileSize, setMaxFileSize] = useState('10');
    const [newUserVerification, setNewUserVerification] = useState(true);
    const [disputeAutoEscalation, setDisputeAutoEscalation] = useState(true);

    const handleSave = (section) => {
        showNotification(`${section} saved successfully!`);
    };

    // Audit trail mock entries
    const auditLog = [
        { time: '08:02 AM', action: 'Suspended user Sarah Chen', admin: 'You', type: 'moderation' },
        { time: '07:45 AM', action: 'Resolved dispute DSP-8842', admin: 'You', type: 'dispute' },
        { time: '07:30 AM', action: 'Updated commission rate to 15%', admin: 'You', type: 'config' },
        { time: 'Yesterday', action: 'Activated user TechFlow Solutions', admin: 'You', type: 'moderation' },
        { time: 'Yesterday', action: 'Enabled maintenance mode for 30min', admin: 'Super Admin', type: 'system' },
    ];

    const renderContent = () => {
        if (activeSection === 'profile') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
                            {userRole === 'admin' ? 'A' : 'U'}
                        </div>
                        <div>
                            <button onClick={() => showNotification('Photo upload dialog would open here.', 'info')} style={{ padding: '0.5rem 1rem', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', marginBottom: '0.5rem' }}>Change Photo</button>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>JPG, GIF or PNG. 1MB max.</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label htmlFor="firstName" style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>First Name</label>
                            <input id="firstName" type="text" defaultValue={userRole === 'admin' ? 'Admin' : 'Test'} style={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="lastName" style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Last Name</label>
                            <input id="lastName" type="text" defaultValue="User" style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Email Address</label>
                        <input id="email" type="email" defaultValue={userRole === 'admin' ? 'admin@createch.com' : 'user@example.com'} style={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="phone" style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Phone Number</label>
                        <input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
                    </div>
                    <button onClick={() => handleSave('Profile')} style={saveBtnStyle('#3b82f6')}><Save size={16} /> Save Changes</button>
                </div>
            );
        }

        if (activeSection === 'notifications') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div>
                            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Push Notifications</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Receive real-time alerts on your device for active order updates.</p>
                        </div>
                        <ToggleSwitch checked={pushNotif} onChange={setPushNotif} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Email Updates</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Receive daily digests and promotional materials to your inbox.</p>
                        </div>
                        <ToggleSwitch checked={emailNotif} onChange={setEmailNotif} />
                    </div>
                </div>
            );
        }

        if (activeSection === 'security') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label htmlFor="currentPassword" style={labelStyle}>Current Password</label>
                        <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label htmlFor="newPassword" style={labelStyle}>New Password</label>
                            <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="confirmNewPassword" style={labelStyle}>Confirm New Password</label>
                            <input id="confirmNewPassword" type="password" style={inputStyle} />
                        </div>
                    </div>
                    {userRole === 'admin' && (
                        <div style={{ padding: '1.25rem', background: 'rgba(168,85,247,0.05)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)', marginTop: '0.5rem' }}>
                            <h4 style={{ color: '#a855f7', margin: '0 0 0.5rem' }}>Admin Security</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Two-factor authentication is enforced for admin accounts. Contact the super admin to reset 2FA if compromised.</p>
                        </div>
                    )}
                    <button onClick={() => handleSave('Password')} style={saveBtnStyle('#3b82f6')}><Save size={16} /> Update Password</button>
                </div>
            );
        }

        if (activeSection === 'platform-config') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={toggleRowStyle}>
                        <div>
                            <h4 style={toggleTitleStyle}>Maintenance Mode</h4>
                            <p style={toggleDescStyle}>Restricts login access to Admin accounts only while deploying updates.</p>
                        </div>
                        <ToggleSwitch checked={maintenanceMode} onChange={(v) => { setMaintenanceMode(v); showNotification(v ? 'Maintenance mode ENABLED' : 'Maintenance mode DISABLED', 'info'); }} />
                    </div>
                    <div style={toggleRowStyle}>
                        <div>
                            <h4 style={toggleTitleStyle}>Automated Suspensions</h4>
                            <p style={toggleDescStyle}>Automatically suspend creators whose report threshold exceeds 5.</p>
                        </div>
                        <ToggleSwitch checked={autoSuspend} onChange={setAutoSuspend} />
                    </div>
                    <div style={toggleRowStyle}>
                        <div>
                            <h4 style={toggleTitleStyle}>New User Verification</h4>
                            <p style={toggleDescStyle}>Require email verification for new account registrations.</p>
                        </div>
                        <ToggleSwitch checked={newUserVerification} onChange={setNewUserVerification} />
                    </div>
                    <div style={toggleRowStyle}>
                        <div>
                            <h4 style={toggleTitleStyle}>Dispute Auto-Escalation</h4>
                            <p style={toggleDescStyle}>Auto-escalate disputes unresolved after 7 days to admin arbitration.</p>
                        </div>
                        <ToggleSwitch checked={disputeAutoEscalation} onChange={setDisputeAutoEscalation} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Commission Rate (%)</label>
                            <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} min="0" max="50" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Max Upload Size (MB)</label>
                            <input type="number" value={maxFileSize} onChange={(e) => setMaxFileSize(e.target.value)} min="1" max="100" style={inputStyle} />
                        </div>
                    </div>
                    <button onClick={() => handleSave('Platform Configuration')} style={saveBtnStyle('#10b981')}><Save size={16} /> Save Configurations</button>
                </div>
            );
        }

        if (activeSection === 'system-logs') {
            const logs = [
                { id: 'ERR091', time: '10:45 AM', event: 'Failed API Handshake', source: 'Stripe Gateway', severity: 'error' },
                { id: 'SEC042', time: '09:12 AM', event: 'Anomalous Login Attempt', source: 'IP 192.168.x.x', severity: 'warning' },
                { id: 'SEC043', time: '09:10 AM', event: 'Anomalous Login Attempt', source: 'IP 192.168.x.x', severity: 'warning' },
                { id: 'INF001', time: '08:30 AM', event: 'Backup completed successfully', source: 'DB Server', severity: 'info' },
                { id: 'INF002', time: '08:00 AM', event: 'Daily cron jobs executed', source: 'Scheduler', severity: 'info' },
            ];
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>Review flagged system anomalies and server events from the last 24 hours.</p>
                    {logs.map(log => (
                        <div key={log.id} style={{
                            display: 'grid', gridTemplateColumns: '80px 2fr 1.5fr', padding: '1rem', borderRadius: '0 8px 8px 0', alignItems: 'center',
                            background: log.severity === 'error' ? 'rgba(239,68,68,0.05)' : log.severity === 'warning' ? 'rgba(250,204,21,0.05)' : 'var(--card-bg)',
                            borderLeft: `3px solid ${log.severity === 'error' ? '#ef4444' : log.severity === 'warning' ? '#fbbf24' : '#22c55e'}`,
                        }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{log.time}</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{log.event}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'right' }}>{log.source}</span>
                        </div>
                    ))}
                    <button onClick={() => showNotification('Logs exported to CSV.', 'info')} style={{ alignSelf: 'center', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem' }}>Export Logs CSV</button>
                </div>
            );
        }

        if (activeSection === 'audit-trail') {
            const typeColor = { moderation: '#f87171', dispute: '#fbbf24', config: '#3b82f6', system: '#a855f7' };
            const typeLabel = { moderation: 'Moderation', dispute: 'Dispute', config: 'Config', system: 'System' };
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>Recent admin actions and platform events.</p>
                    {auditLog.map((entry, i) => (
                        <div key={i} style={{ padding: '1rem 1.25rem', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ color: 'var(--text-primary)', fontWeight: '500', margin: '0 0 4px' }}>{entry.action}</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>by {entry.admin} • {entry.time}</p>
                            </div>
                            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', background: `${typeColor[entry.type]}15`, color: typeColor[entry.type] }}>
                                {typeLabel[entry.type]}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeSection === 'creator-profile') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label htmlFor="bio" style={labelStyle}>Professional Bio</label>
                        <textarea id="bio" rows="4" defaultValue="Senior UX Designer with 5 years of experience." style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label htmlFor="portfolio" style={labelStyle}>Portfolio URL</label>
                            <input id="portfolio" type="text" defaultValue="https://myportfolio.com" style={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="hourlyRate" style={labelStyle}>Hourly Rate (₱)</label>
                            <input id="hourlyRate" type="number" defaultValue="750" style={inputStyle} />
                        </div>
                    </div>
                    <button onClick={() => handleSave('Creator Profile')} style={saveBtnStyle('#a855f7')}><Save size={16} /> Update Creator Profile</button>
                </div>
            );
        }

        if (activeSection === 'payment-methods' || activeSection === 'payout-methods') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <CreditCard size={24} color="var(--text-secondary)" />
                            <div>
                                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>•••• •••• •••• 4242</h4>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Expires 12/28</span>
                            </div>
                        </div>
                        <span style={{ padding: '4px 8px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Primary</span>
                    </div>
                    <button onClick={() => showNotification('Link account dialog would open here.', 'info')} style={{ alignSelf: 'flex-start', background: 'transparent', color: 'var(--text-primary)', border: '1px dashed var(--border-color)', padding: '1rem 1.5rem', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', width: '100%' }}>+ Link New Account</button>
                </div>
            );
        }

        if (activeSection === 'network') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {['Jane Doe', 'Max Media', 'Pixel Wizards'].map((name, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--card-bg)', borderRadius: '8px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>{name.charAt(0)}</div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>{name}</h4>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Creator</span>
                            </div>
                            <button onClick={() => showNotification(`Removed ${name} from list.`, 'info')} style={{ background: 'transparent', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Remove</button>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeSection === 'support') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Need Help?</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>Contact our support team for assistance with your account.</p>
                        <button onClick={() => showNotification('Support ticket created. We\'ll get back to you within 24 hours.', 'info')} style={saveBtnStyle('#3b82f6')}><FileText size={16} /> Open Support Ticket</button>
                    </div>
                    <div style={{ padding: '1.5rem', border: '1px solid #ef4444', background: 'rgba(239,68,68,0.05)', borderRadius: '12px' }}>
                        <h4 style={{ color: '#f87171', fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>Danger Zone</h4>
                        <p style={{ color: '#fca5a5', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
                        <button onClick={() => showNotification('Account deletion requires email confirmation. Check your inbox.', 'info')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Delete Account</button>
                    </div>
                </div>
            );
        }
    };

    // Build sections per role
    const baseSections = [
        { id: 'profile', label: 'Personal Info', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
    ];

    const creatorSections = [
        { id: 'creator-profile', label: 'Creator Profile', icon: Sparkles },
        { id: 'network', label: 'Followers', icon: Users },
        { id: 'payout-methods', label: 'Payout Methods', icon: CreditCard },
        { id: 'support', label: 'Support', icon: FileText },
    ];

    const clientSections = [
        { id: 'network', label: 'Following', icon: Users },
        { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
        { id: 'support', label: 'Support', icon: FileText },
    ];

    const adminSections = [
        { id: 'platform-config', label: 'Platform Config', icon: SettingsIcon },
        { id: 'system-logs', label: 'System Logs', icon: ShieldAlert },
        { id: 'audit-trail', label: 'Audit Trail', icon: ClipboardList },
    ];

    let activeSections = [...baseSections];
    if (userRole === 'admin') {
        // Admin: no notifications tab (they get system alerts elsewhere), no danger zone
        activeSections = activeSections.filter(s => s.id !== 'notifications');
        activeSections = [...activeSections, ...adminSections];
    } else if (userRole === 'creator') {
        activeSections = [...activeSections, ...creatorSections];
    } else if (userRole === 'client') {
        activeSections = [...activeSections, ...clientSections];
    }

    return (
        <main className="dashboard-content page-fade" style={{ padding: '2rem 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {notification && (
                <div className={`notification notification--${notification.type}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
                    {notification.message}
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Settings</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
                    {userRole === 'admin' ? 'Manage your account and platform configuration.' : 'Manage your account settings and preferences.'}
                </p>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flex: 1, alignItems: 'flex-start' }}>
                <div className="glass-card" style={{ width: '280px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {activeSections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem',
                                background: activeSection === section.id ? 'var(--bg-secondary)' : 'transparent',
                                border: 'none', borderRadius: '8px',
                                color: activeSection === section.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: 'all 0.2s', width: '100%'
                            }}
                        >
                            <section.icon size={18} />
                            {section.label}
                        </button>
                    ))}
                </div>

                <div className="glass-card" style={{ flex: 1, padding: '2.5rem', minHeight: '500px' }}>
                    <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                            {activeSections.find(s => s.id === activeSection)?.label || activeSection}
                        </h3>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </main>
    );
};

const inputStyle = { width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--text-primary)' };
const labelStyle = { display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' };
const saveBtnStyle = (bg) => ({ alignSelf: 'flex-start', background: bg, color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' });
const toggleRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' };
const toggleTitleStyle = { color: 'var(--text-primary)', fontSize: '1.1rem', margin: '0 0 0.25rem 0' };
const toggleDescStyle = { color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 };

export default SettingsPage;
