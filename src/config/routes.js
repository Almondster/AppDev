import { lazy } from 'react';

// Lazy-loaded page components for route-based code splitting
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));
const MyGigsPage = lazy(() => import('../pages/MyGigsPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const LandingPage = lazy(() => import('../pages/LandingPage'));
const MessagesPage = lazy(() => import('../pages/MessagesPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const WalletPage = lazy(() => import('../pages/WalletPage'));
const BecomeCreatorPage = lazy(() => import('../pages/BecomeCreatorPage'));
const CreatorProfilePage = lazy(() => import('../pages/CreatorProfilePage'));
const UsersPage = lazy(() => import('../pages/UsersPage'));
const DisputesPage = lazy(() => import('../pages/DisputesPage'));
const ClientDashboardPage = lazy(() => import('../pages/ClientDashboardPage'));
const CreatorDashboardPage = lazy(() => import('../pages/CreatorDashboardPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));

/**
 * Public routes - accessible without authentication
 */
export const PUBLIC_ROUTES = [
  {
    path: '/landing',
    component: LandingPage,
    name: 'Landing',
  },
  {
    path: '/login',
    component: LoginPage,
    name: 'Login',
  },
];

/**
 * Protected routes - require authentication
 */
export const PROTECTED_ROUTES = [
  {
    path: '/',
    component: DashboardPage,
    name: 'Dashboard',
    props: ['userRole'],
  },
  {
    path: '/projects',
    component: ProjectsPage,
    name: 'My Orders (Client)',
    props: ['userRole'],
  },
  {
    path: '/my-gigs',
    component: MyGigsPage,
    name: 'My Gigs',
    props: ['userRole'],
  },
  {
    path: '/orders',
    component: OrdersPage,
    name: 'Orders',
  },
  {
    path: '/messages',
    component: MessagesPage,
    name: 'Inbox',
  },
  {
    path: '/notifications',
    component: NotificationsPage,
    name: 'Notifications',
  },
  {
    path: '/settings',
    component: SettingsPage,
    name: 'Settings',
    props: ['userRole'],
  },
  {
    path: '/wallet',
    component: WalletPage,
    name: 'Earnings/Billing',
    props: ['userRole'],
  },
  {
    path: '/become-creator',
    component: BecomeCreatorPage,
    name: 'Become a Creator',
  },
  {
    path: '/creator-profile',
    component: CreatorProfilePage,
    name: 'Creator Profile',
  },
  {
    path: '/users',
    component: UsersPage,
    name: 'Manage Users',
    admin: true,
  },
  {
    path: '/disputes',
    component: DisputesPage,
    name: 'Disputes',
    admin: true,
  },
];

/**
 * Dashboard variant routes - shown based on user role
 */
export const DASHBOARD_ROUTES = {
  creator: CreatorDashboardPage,
  client: ClientDashboardPage,
  admin: AdminDashboardPage,
};

/**
 * Get routes based on user role
 */
export const getRoutesForRole = (userRole) => {
  return PROTECTED_ROUTES.filter((route) => {
    if (route.admin) return userRole === 'admin';
    return true;
  });
};

/**
 * Get sidebar menu items based on user role
 */
export const getSidebarItems = (userRole) => {
  const baseItems = getRoutesForRole(userRole).map((route) => ({
    to: route.path,
    label: route.name,
  }));
  return baseItems;
};
