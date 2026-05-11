import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ProjectsProvider } from './context/providers/ProjectsProvider';
import React from 'react';
// Import the compiled Tailwind generic UI components
import Sidebar from './components/SidebarNative'; 
import ErrorBoundary from './components/ErrorBoundary'; 
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import MyGigsPage from './pages/MyGigsPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import WalletPage from './pages/WalletPage';
import CreatorProfilePage from './pages/CreatorProfilePage';
import UsersPage from './pages/UsersPage';
import DisputesPage from './pages/DisputesPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import { fetchMyCreatorOrders, fetchMyMessages, fetchMyOrders, fetchFollows, getToken, getUserData, logout as apiLogout } from './api';

const ROUTE_LABELS_BY_ROLE = {
  client: {
    '/': 'Marketplace',
    '/projects': 'My Orders',
    '/messages': 'Inbox',
    '/notifications': 'Notifications',
    '/settings': 'Settings',
    '/wallet': 'Billing',
    '/creator-profile': 'Creator Profile',
  },
  creator: {
    '/': 'Studio',
    '/my-gigs': 'My Gigs',
    '/orders': 'Orders',
    '/messages': 'Inbox',
    '/notifications': 'Notifications',
    '/settings': 'Settings',
    '/wallet': 'Earnings',
    '/creator-profile': 'Creator Profile',
  },
  admin: {
    '/': 'Dashboard',
    '/projects': 'Order Management',
    '/users': 'Users',
    '/disputes': 'Disputes',
    '/settings': 'Platform Settings',
    '/messages': 'Inbox',
    '/notifications': 'Notifications',
  },
};

function getPathLabel(pathname, userRole) {
  if (pathname.startsWith('/orders/')) return 'Order Details';
  if (pathname.startsWith('/services/')) return 'Service Details';

  const roleLabels = ROUTE_LABELS_BY_ROLE[userRole] || ROUTE_LABELS_BY_ROLE.creator;
  if (roleLabels[pathname]) return roleLabels[pathname];

  const fallback = pathname === '/' ? 'Dashboard' : pathname.slice(1);
  return fallback
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Role-based route guard
// ---------------------------------------------------------------------------
function RoleGuard({ allowedRoles, userRole }) {
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function ProtectedLayout({ isLoggedIn, userRole, onLogout }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const pathName = getPathLabel(location.pathname, userRole);
  const userData = getUserData();
  const uid = userData?.firebase_uid;

  useEffect(() => {
    if (!isLoggedIn || !uid) return;

    let disposed = false;
    const ordersSeenKey = `createch_orders_last_seen_${uid}`;
    const followsSeenKey = `createch_follows_last_seen_${uid}`;

    const pullUnread = async () => {
      try {
        const readMessageIds = new Set(JSON.parse(localStorage.getItem(`createch_read_notifs_${uid}`) || '[]'));
        const ordersSeenAt = new Date(localStorage.getItem(ordersSeenKey) || 0);
        const followsSeenAt = new Date(localStorage.getItem(followsSeenKey) || 0);
        const ordersFetcher = userRole === 'creator' ? fetchMyCreatorOrders : fetchMyOrders;

        const [mRes, oRes, fRes] = await Promise.all([
          fetchMyMessages(),
          ordersFetcher(),
          fetchFollows(),
        ]);

        const messagesUnread = mRes.ok
          ? (mRes.data.results || mRes.data || []).filter((m) => {
              // Only count messages where current user is the RECEIVER and message is unread
              const isReceiver = String(m.receiver_id) === String(uid);
              const isUnread = !m.is_read;
              const notMarkedRead = !readMessageIds.has(`m-${m.id}`);
              return isReceiver && isUnread && notMarkedRead;
            }).length
          : 0;

        const ordersUnread = oRes.ok
          ? (oRes.data.results || oRes.data || []).filter((o) => new Date(o.updated_at || o.created_at) > ordersSeenAt).length
          : 0;

        const followsUnread = fRes.ok
          ? (fRes.data.results || fRes.data || []).filter(
            (f) => f.following_id === uid && new Date(f.created_at) > followsSeenAt,
          ).length
          : 0;

        if (!disposed) setUnreadCount(messagesUnread + ordersUnread + followsUnread);
      } catch {
        if (!disposed) setUnreadCount(0);
      }
    };

    pullUnread();
    const timer = setInterval(pullUnread, 2500); // Poll every 2.5 seconds for near real-time updates
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [isLoggedIn, uid, userRole, location.pathname]);

  if (!isLoggedIn) return <LandingPage />;

  return (
    <ProjectsProvider>
      <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden">
          <Sidebar
              userRole={userRole}
              onLogout={onLogout}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              unreadCount={unreadCount}
          />
          <main className="flex-1 flex flex-col relative overflow-hidden">
              {/* Header Area */}
              <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#080808]/50 backdrop-blur-md z-10 shrink-0">
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span className="hover:text-white cursor-pointer transition-colors capitalize">{userRole} Workspace</span>
                      <span className="mx-2 text-zinc-700">/</span>
                      <span className="text-white font-medium capitalize">
                          {pathName}
                      </span>
                  </div>
              </header>

              {/* Main Content Area */}
              <div className="flex-1 overflow-auto p-0 scroll-smooth">
                  <ErrorBoundary resetKey={location.pathname}>
                      <Outlet />
                  </ErrorBoundary>
              </div>
          </main>
      </div>
    </ProjectsProvider>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getToken());
  const [userRole, setUserRole] = useState(() => {
    const user = getUserData();
    return user?.role || 'creator';
  });
  const [userData, setUserData] = useState(() => getUserData());

  const handleLogout = () => {
    apiLogout();
    setIsLoggedIn(false);
    setUserData(null);
  };

  const handleLogin = () => {
    const user = getUserData();
    setUserRole(user?.role || 'creator');
    setUserData(user);
    setIsLoggedIn(true);
  };

  // Check for role changes on mount and when window gains focus
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkRoleUpdate = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/me/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const freshUser = await response.json();
          const currentUser = getUserData();
          
          // If user is suspended, log them out
          if (freshUser.is_active === false) {
            handleLogout();
            alert('Your account has been suspended. Please contact support.');
            return;
          }
          
          // If role has changed, update localStorage and state
          if (freshUser.role !== currentUser?.role) {
            const updatedUser = {
              ...currentUser,
              role: freshUser.role,
              is_active: freshUser.is_active
            };
            localStorage.setItem('createch_user', JSON.stringify(updatedUser));
            setUserRole(freshUser.role);
            setUserData(updatedUser);
            
            // Force reload to apply new role-based routing
            window.location.href = '/';
          }
        }
      } catch (err) {
        console.error('Failed to check role update:', err);
      }
    };

    // Check on mount
    checkRoleUpdate();

    // Check when window gains focus (user switches back to tab)
    const handleFocus = () => checkRoleUpdate();
    window.addEventListener('focus', handleFocus);

    // Check periodically every 30 seconds
    const interval = setInterval(checkRoleUpdate, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [isLoggedIn]);

  return (
      <div className="app bg-[#0A0A0A] min-h-screen">
        <Routes>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={
            isLoggedIn ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
          } />

          <Route element={<ProtectedLayout key={userData?.firebase_uid || 'anon'} isLoggedIn={isLoggedIn} userRole={userRole} onLogout={handleLogout} />}>
            <Route path="/" element={<DashboardPage userRole={userRole} />} />
            <Route path="/projects" element={<ProjectsPage userRole={userRole} />} />

            <Route element={<RoleGuard allowedRoles={['creator']} userRole={userRole} />}>
              <Route path="/my-gigs" element={<MyGigsPage userRole={userRole} />} />
              <Route path="/orders" element={<OrdersPage />} />
            </Route>

            <Route path="/creator-profile" element={<CreatorProfilePage />} />

            <Route element={<RoleGuard allowedRoles={['admin']} userRole={userRole} />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/disputes" element={<DisputesPage />} />
            </Route>

            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/services/:id" element={<ServiceDetailPage />} />
            <Route path="/settings" element={<SettingsPage userRole={userRole} onLogout={handleLogout} />} />
            <Route element={<RoleGuard allowedRoles={['client', 'creator']} userRole={userRole} />}>
              <Route path="/wallet" element={<WalletPage userRole={userRole} />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
  );
}

export default App;
