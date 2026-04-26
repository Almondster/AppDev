import {
    LayoutGrid,
    Briefcase,
    MessageSquare,
    Bell,
    Wallet,
    Settings,
    Users,
    AlertTriangle,
    ShieldCheck,
} from 'lucide-react';
import { ROUTES } from './routes';

/**
 * Navigation menu configurations for each user role.
 * Icons are Lucide React components; `to` uses route constants.
 */
export const CREATOR_MENU = [
    { to: ROUTES.HOME, label: 'Studio', icon: LayoutGrid },
    { to: ROUTES.PROJECTS, label: 'My Gigs', icon: Briefcase },
    { to: ROUTES.MESSAGES, label: 'Inbox', icon: MessageSquare },
    { to: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: Bell },
    { to: ROUTES.WALLET, label: 'Earnings', icon: Wallet },
];

export const CLIENT_MENU = [
    { to: ROUTES.HOME, label: 'Marketplace', icon: LayoutGrid },
    { to: ROUTES.PROJECTS, label: 'My Orders', icon: Briefcase },
    { to: ROUTES.MESSAGES, label: 'Inbox', icon: MessageSquare },
    { to: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: Bell },
    { to: ROUTES.WALLET, label: 'Billing', icon: Wallet },
];

export const ADMIN_MENU = [
    { to: ROUTES.HOME, label: 'Dashboard', icon: ShieldCheck },
    { to: ROUTES.PROJECTS, label: 'All Projects', icon: Briefcase },
    { to: ROUTES.USERS, label: 'Manage Users', icon: Users },
    { to: ROUTES.DISPUTES, label: 'Disputes', icon: AlertTriangle },
    { to: ROUTES.SETTINGS, label: 'Platform Settings', icon: Settings },
];
