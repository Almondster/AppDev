import { NavLink } from 'react-router-dom';
import { Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import { CREATOR_MENU, CLIENT_MENU, ADMIN_MENU } from '../constants/navigation';

const Sidebar = ({ userRole, onLogout }) => {
    const { theme, toggleTheme } = useTheme();

    // Select menu based on role
    let currentMenu = CREATOR_MENU;
    if (userRole === ROLES.CLIENT) currentMenu = CLIENT_MENU;
    else if (userRole === ROLES.ADMIN) currentMenu = ADMIN_MENU;

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
                    {userRole === ROLES.CREATOR ? 'C' : userRole === ROLES.CLIENT ? 'CL' : 'A'}
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
                        end={item.to === ROUTES.HOME}
                        className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item nav-item--theme" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
                {userRole !== ROLES.ADMIN && (
                    <NavLink to={ROUTES.SETTINGS} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
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
