import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, MessageSquare, Briefcase, Wallet, Settings, LogOut, Bell, ChevronLeft, ChevronRight, ShieldCheck, Users, AlertTriangle, Package } from 'lucide-react';
import { getUserData } from '../api';

const splashIcon = '/assets/splash-icon-light-resized.png';

export const SidebarNative = ({ userRole, onLogout, isCollapsed = false, onToggleCollapse, unreadCount = 0 }) => {
    const userData = getUserData();

    // Define menus based on role using 'to' instead of 'id'
    const clientMenu = [
        { to: '/', label: 'Marketplace', icon: <LayoutGrid size={18} /> },
        { to: '/projects', label: 'Orders', icon: <Briefcase size={18} /> },
        { to: '/messages', label: 'Inbox', icon: <MessageSquare size={18} /> },
        { to: '/notifications', label: 'Notifications', icon: <Bell size={18} />, badge: unreadCount },
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
        { to: '/projects', label: 'Order Management', icon: <Package size={18} /> },
        { to: '/users', label: 'Users', icon: <Users size={18} /> },
        { to: '/disputes', label: 'Disputes', icon: <AlertTriangle size={18} /> },
        { to: '/settings', label: 'Platform Settings', icon: <Settings size={18} /> },
    ];

    let currentMenu = creatorMenu;
    if (userRole === 'client') currentMenu = clientMenu;
    else if (userRole === 'admin') currentMenu = adminMenu;

    return (
        <div className={`h-screen border-r border-white/5 flex flex-col glass-panel rounded-none transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`p-4 ${isCollapsed ? 'flex flex-col items-center gap-3' : ''}`}>
                {isCollapsed ? (
                    <>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <img src={splashIcon} alt="Createch" className="w-full h-full object-contain" />
                        </div>
                        <button onClick={onToggleCollapse} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white">
                            <ChevronRight size={18} />
                        </button>
                    </>
                ) : (
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                                <img src={splashIcon} alt="Createch" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-semibold text-white tracking-tight">CREATECH</span>
                        </div>
                        <button onClick={onToggleCollapse} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white">
                            <ChevronLeft size={18} />
                        </button>
                    </div>
                )}
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {currentMenu.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) => `
                            flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                            ${isActive ? 'bg-white/10 border-white/10 text-white' : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'}
                            border
                        `}
                        title={isCollapsed ? item.label : undefined}
                    >
                        <div className="flex items-center gap-3 relative">
                            {item.icon}
                            {item.badge != null && item.badge > 0 && isCollapsed && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-1 items-center justify-between">
                                <span>{item.label}</span>
                                {item.badge != null && item.badge > 0 && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500 text-white rounded-full min-w-[18px] text-center">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5 space-y-1">
                {userRole !== 'admin' && (
                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `
                            w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}
                        `}
                        title={isCollapsed ? 'Settings' : undefined}
                    >
                        <Settings size={18} />
                        {!isCollapsed && <span>Settings</span>}
                    </NavLink>
                )}
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors`}
                    title={isCollapsed ? 'Logout' : undefined}
                >
                    <LogOut size={18} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
            {userData && (
                <div className={`px-4 mb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
                    <div className={`flex items-center gap-3 ${isCollapsed ? '' : 'px-2'} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}>
                        <div className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 border-white/10 relative">
                            {userData?.avatar_url ? (
                                <img src={userData.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="text-xs font-semibold text-white/70">{(userData?.full_name || 'U').charAt(0)}</span>
                            )}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0A0A0A]"></div>
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-white">{userData?.full_name || userData?.email}</span>
                                <span className="text-xs text-zinc-500 capitalize">{userRole}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
export default SidebarNative;
