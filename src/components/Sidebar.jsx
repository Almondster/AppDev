import { NavLink } from 'react-router-dom';
import {
    LayoutGrid,
    Briefcase,
    MessageSquare,
    Bell,
    Wallet,
    Settings,
    LogOut,
    Users,
    AlertTriangle,
    ShieldCheck,
    Moon,
    Sun
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ userRole, onLogout }) => {
    const { theme, toggleTheme } = useTheme();
    // Define navigation links based on user role
    const clientMenu = [
        { to: '/', label: 'Marketplace', icon: <LayoutGrid size={18} /> },
        { to: '/projects', label: 'My Orders', icon: <Briefcase size={18} /> },
        { to: '/messages', label: 'Inbox', icon: <MessageSquare size={18} /> },
        { to: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { to: '/wallet', label: 'Billing', icon: <Wallet size={18} /> },
    ];

    const creatorMenu = [
        { to: '/', label: 'Studio', icon: <LayoutGrid size={18} /> },
        { to: '/projects', label: 'My Gigs', icon: <Briefcase size={18} /> },
        { to: '/messages', label: 'Inbox', icon: <MessageSquare size={18} /> },
        { to: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { to: '/wallet', label: 'Earnings', icon: <Wallet size={18} /> },
    ];

    const adminMenu = [
        { to: '/', label: 'Dashboard', icon: <ShieldCheck size={18} /> },
        { to: '/projects', label: 'All Projects', icon: <Briefcase size={18} /> },
        { to: '/users', label: 'Manage Users', icon: <Users size={18} /> },
        { to: '/disputes', label: 'Disputes', icon: <AlertTriangle size={18} /> },
        { to: '/settings', label: 'Platform Settings', icon: <Settings size={18} /> },
    ];

    let currentMenu = creatorMenu;
    if (userRole === 'client') currentMenu = clientMenu;
    else if (userRole === 'admin') currentMenu = adminMenu;

    return (
        <aside className="sidebar glass-panel">
            <div className="sidebar-brand">
                <div className="sidebar-logo">
                    <img src="/assets/splash-icon-light-resized.png" alt="Createch Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <span className="sidebar-title">CREATECH</span>
            </div>

            <div className="sidebar-user">
                <div className="sidebar-avatar">
                    {/* Placeholder Avatar based on role */}
                    {userRole === 'creator' ? 'C' : userRole === 'client' ? 'CL' : 'A'}
                </div>
                <div className="sidebar-user-info">
                    <span className="sidebar-user-name">Test User</span>
                    <span className="sidebar-user-role">{userRole}</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {currentMenu.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item nav-item--theme" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
                {userRole !== 'admin' && (
                    <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
                        <Settings size={18} />
                        <span>Settings</span>
                    </NavLink>
                )}
                <button className="nav-item nav-item--logout" onClick={onLogout}>
                    <LogOut size={18} />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
