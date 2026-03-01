import React, { useState } from 'react';
import { User, Bell, Lock, FileText, Sparkles, Users, CreditCard, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';

const ToggleSwitch = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
            position: 'relative',
            display: 'inline-flex',
            height: '24px',
            width: '44px',
            alignItems: 'center',
            borderRadius: '9999px',
            backgroundColor: checked ? '#3b82f6' : '#3f3f46',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
        }}
    >
        <span
            style={{
                display: 'inline-block',
                height: '16px',
                width: '16px',
                transform: checked ? 'translateX(24px)' : 'translateX(4px)',
                borderRadius: '50%',
                backgroundColor: 'white',
                transition: 'transform 0.2s',
            }}
        />
    </button>
);

const SettingsPage = ({ userRole }) => {
    const [activeSection, setActiveSection] = useState('profile');

    // Shared Mocks
    const [phone, setPhone] = useState('09123456789');
    const [pushNotif, setPushNotif] = useState(true);
    const [emailNotif, setEmailNotif] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Admin Mocks
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [autoSuspend, setAutoSuspend] = useState(true);
    const [commissionRate, setCommissionRate] = useState('15');

    // Render logic switch based on activeSection
    const renderContent = () => {
        if (activeSection === 'profile') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
                            U
                        </div>
                        <div>
                            <button style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: 'pointer', marginBottom: '0.5rem' }}>Change Photo</button>
                            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: 0 }}>JPG, GIF or PNG. 1MB max.</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label htmlFor="firstName" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>First Name</label>
                            <input id="firstName" type="text" defaultValue="Test" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }} />
                        </div>
                        <div>
                            <label htmlFor="lastName" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Last Name</label>
                            <input id="lastName" type="text" defaultValue="User" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Email Address</label>
                        <input id="email" type="email" defaultValue="user@example.com" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }} />
                    </div>
                    <div>
                        <label htmlFor="phone" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Phone Number</label>
                        <input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }} />
                    </div>
                    <button style={{ alignSelf: 'flex-start', background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '1rem' }}>Save Changes</button>
                </div>
            );
        }

        if (activeSection === 'notifications') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                            <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Push Notifications</h4>
                            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Receive real-time alerts on your device for active order updates.</p>
                        </div>
                        <ToggleSwitch checked={pushNotif} onChange={setPushNotif} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Email Updates</h4>
                            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Receive daily digests and promotional materials to your inbox.</p>
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
                        <label htmlFor="currentPassword" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Current Password</label>
                        <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label htmlFor="newPassword" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>New Password</label>
                            <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }} />
                        </div>
                        <div>
                            <label htmlFor="confirmNewPassword" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Confirm New Password</label>
                            <input id="confirmNewPassword" type="password" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }} />
                        </div>
                    </div>
                    <button style={{ alignSelf: 'flex-start', background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '1rem' }}>Update Password</button>
                </div>
            );
        }

        if (activeSection === 'support') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px' }}>
                        <h4 style={{ color: '#f87171', fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>Danger Zone</h4>
                        <p style={{ color: '#fca5a5', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
                        <button style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Delete Account</button>
                    </div>
                </div>
            )
        }

        // --- CREATOR SPECIFIC ---
        if (activeSection === 'creator-profile') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label htmlFor="bio" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Professional Bio</label>
                        <textarea id="bio" rows="4" defaultValue="Senior UX Designer with 5 years of experience." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label htmlFor="portfolio" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Portfolio URL</label>
                            <input id="portfolio" type="text" defaultValue="https://myportfolio.com" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }} />
                        </div>
                        <div>
                            <label htmlFor="hourlyRate" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Hourly Rate (₱)</label>
                            <input id="hourlyRate" type="number" defaultValue="750" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }} />
                        </div>
                    </div>
                    <button style={{ alignSelf: 'flex-start', background: '#a855f7', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '1rem' }}>Update Creator Profile</button>
                </div>
            );
        }

        // --- ADMIN SPECIFIC ---
        if (activeSection === 'platform-config') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                            <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Under Maintenance Mode</h4>
                            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Restricts login access to Admin accounts only while deploying updates.</p>
                        </div>
                        <ToggleSwitch checked={maintenanceMode} onChange={setMaintenanceMode} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                            <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Automated Suspensions</h4>
                            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Automatically suspend creators whose report threshold exceeds 5.</p>
                        </div>
                        <ToggleSwitch checked={autoSuspend} onChange={setAutoSuspend} />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Global Platform Commission Rate (%)</label>
                        <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} style={{ width: '30%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }} />
                    </div>
                    <button style={{ alignSelf: 'flex-start', background: '#10b981', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '1rem' }}>Save Configurations</button>
                </div>
            );
        }

        if (activeSection === 'system-logs') {
            const logs = [
                { id: 'ERR091', time: '10:45 AM', event: 'Failed API Handshake', source: 'Stripe Gateway' },
                { id: 'SEC042', time: '09:12 AM', event: 'Anomalous Login Attempt', source: 'IP 192.168.x.x' },
                { id: 'SEC043', time: '09:10 AM', event: 'Anomalous Login Attempt', source: 'IP 192.168.x.x' }
            ];
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ color: '#a1a1aa', fontSize: '0.95rem', margin: '0 0 1rem 0' }}>Review flagged system anomalies and server events from the last 24 hours.</p>
                    {logs.map(log => (
                        <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid #ef4444', borderRadius: '0 8px 8px 0', alignItems: 'center' }}>
                            <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>{log.time}</span>
                            <span style={{ color: '#fff', fontWeight: '500' }}>{log.event}</span>
                            <span style={{ color: '#fca5a5', fontSize: '0.85rem', textAlign: 'right' }}>{log.source}</span>
                        </div>
                    ))}
                    <button style={{ alignSelf: 'center', background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', marginTop: '1rem' }}>Export Logs CSV</button>
                </div>
            );
        }

        // --- SHARED / GENERIC LISTS ---
        if (activeSection === 'payment-methods' || activeSection === 'payout-methods') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <CreditCard size={24} color="#a1a1aa" />
                            <div>
                                <h4 style={{ color: '#fff', margin: '0 0 0.25rem 0' }}>•••• •••• •••• 4242</h4>
                                <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Expires 12/28</span>
                            </div>
                        </div>
                        <span style={{ padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Primary</span>
                    </div>
                    <button style={{ alignSelf: 'flex-start', background: 'transparent', color: '#fff', border: '1px dashed rgba(255,255,255,0.2)', padding: '1rem 1.5rem', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', width: '100%' }}>+ Link New Account</button>
                </div>
            );
        }

        if (activeSection === 'network') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>J</div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ color: '#fff', margin: '0 0 0.25rem 0' }}>Jane Doe</h4>
                            <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Full Stack Developer</span>
                        </div>
                        <button style={{ background: 'transparent', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Remove</button>
                    </div>
                </div>
            );
        }
    };

    // Calculate dynamic sections available
    const baseSections = [
        { id: 'profile', label: 'Personal Info', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
    ];

    const creatorSections = [
        { id: 'creator-profile', label: 'Creator Profile', icon: Sparkles },
        { id: 'network', label: 'Followers', icon: Users },
        { id: 'payout-methods', label: 'Payout Methods', icon: CreditCard },
    ];

    const clientSections = [
        { id: 'network', label: 'Following', icon: Users },
        { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
    ];

    const adminSections = [
        { id: 'platform-config', label: 'Platform Config', icon: SettingsIcon },
        { id: 'system-logs', label: 'System Logs', icon: ShieldAlert },
    ];

    // Build the final array
    let activeSections = [...baseSections];

    if (userRole === 'admin') {
        // Admins do not need order update notifications
        activeSections = activeSections.filter(s => s.id !== 'notifications');
        activeSections = [...activeSections, ...adminSections];
    } else if (userRole === 'creator') {
        activeSections = [...activeSections, ...creatorSections];
    } else if (userRole === 'client') {
        activeSections = [...activeSections, ...clientSections];
    }

    // Everyone gets support at the bottom
    activeSections.push({ id: 'support', label: 'Support & Data', icon: FileText });

    return (
        <main className="dashboard-content page-fade" style={{ padding: '2rem 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: '0 0 0.5rem 0' }}>Settings</h2>
                <p style={{ color: '#a1a1aa', fontSize: '1rem', margin: 0 }}>Manage your account settings and preferences.</p>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flex: 1, alignItems: 'flex-start' }}>

                {/* Left Navigation */}
                <div className="glass-card" style={{ width: '280px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {activeSections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.85rem 1rem',
                                background: activeSection === section.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: activeSection === section.id ? '#fff' : '#a1a1aa',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                width: '100%'
                            }}
                        >
                            <section.icon size={18} />
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Right Content Form */}
                <div className="glass-card" style={{ flex: 1, padding: '2.5rem', minHeight: '500px' }}>
                    <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '1.5rem', color: '#fff', margin: '0 0 0.5rem 0' }}>
                            {activeSections.find(s => s.id === activeSection)?.label || activeSection}
                        </h3>
                    </div>
                    {renderContent()}
                </div>

            </div>
        </main>
    );
};

export default SettingsPage;
