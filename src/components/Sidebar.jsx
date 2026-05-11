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
    Package,
    Sun,
    Moon,
} from 'lucide-react';
import { getUserData } from '../api';
import { useTheme } from '../context/hooks/useTheme.js';

const Sidebar = ({ userRole, onLogout }) => {
    const userData = getUserData();
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
        { to: '/my-gigs', label: 'My Gigs', icon: <Briefcase size={18} /> },
        { to: '/orders', label: 'Orders', icon: <Package size={18} /> },
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

    const { theme, toggleTheme } = useTheme();

    let currentMenu = creatorMenu;
    if (userRole === 'client') currentMenu = clientMenu;
    else if (userRole === 'admin') currentMenu = adminMenu;

    return (
        <aside className="w-64 bg-white/[0.02] border-r border-white/5 flex flex-col h-screen sticky top-0">
            <div className="flex items-center gap-3 p-6 border-b border-white/5">
                <div className="w-10 h-10 flex-shrink-0">
                    <img src="/assets/splash-icon-light-resized.png" alt="Createch Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-bold text-white tracking-wider">CREATECH</span>
            </div>

            <div className="flex items-center gap-3 p-4 mx-4 my-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {(userData?.full_name || userRole || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <span className="block text-white font-medium text-sm truncate">{userData?.full_name || userData?.email || 'User'}</span>
                    <span className="block text-zinc-400 text-xs capitalize">{userRole}</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-2 overflow-y-auto">
                {currentMenu.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${isActive ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5 space-y-1">
                <button className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-all" type="button" onClick={toggleTheme}>
                    {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                    <span className="flex-1 text-left ml-3">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                {userRole !== 'admin' && (
                    <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                        <Settings size={18} />
                        <span>Settings</span>
                    </NavLink>
                )}
                <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all" onClick={onLogout}>
                    <LogOut size={18} />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
