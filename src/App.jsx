import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ProjectsProvider } from './context/providers/ProjectsProvider';
import React from 'react';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationCenterProvider, useNotificationCenter } from './context/NotificationCenterContext';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import AdminProjectsPage from './pages/AdminProjectsPage';
import MyGigsPage from './pages/MyGigsPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import WalletPage from './pages/WalletPage';
import CreatorProfilePage from './pages/CreatorProfilePage';
import BecomeCreatorPage from './pages/BecomeCreatorPage';
import UsersPage from './pages/UsersPage';
import DisputesPage from './pages/DisputesPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import { getToken, getUserData, logout as apiLogout } from './api';
import './index.css';

// ---------------------------------------------------------------------------
// Role-based route guard — redirects non-matching roles to "/"
// ---------------------------------------------------------------------------
function RoleGuard({ allowedRoles, userRole }) {
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function ProtectedLayout({ isLoggedIn, userRole, userData, onLogout }) {
  const location = useLocation();

  if (!isLoggedIn) return <LandingPage />;
  return (
    <NotificationCenterProvider>
      <ProjectsProvider>
        <ProtectedWorkspace
          locationKey={`${location.pathname}${location.search}`}
          onLogout={onLogout}
          userData={userData}
          userRole={userRole}
        />
      </ProjectsProvider>
    </NotificationCenterProvider>
  );
}

function ProtectedWorkspace({ locationKey, onLogout, userData, userRole }) {
  const { unreadCount } = useNotificationCenter();

  return (
    <div className="dashboard-layout page-fade">
      <Sidebar userRole={userRole} userData={userData} onLogout={onLogout} unreadCount={unreadCount} />
      <div className="main-content-wrapper">
        <main className="main-content">
          <ErrorBoundary resetKey={locationKey}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <footer className="app-footer">
          <p>&copy; 2026 CREATECH Platform. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getToken());
  const [userRole, setUserRole] = useState(() => {
    const user = getUserData();
    return user?.role || 'creator';
  });
  const [userData, setUserData] = useState(() => getUserData());

  // Keep auth state in sync with localStorage changes across tabs and same-tab auth updates.
  useEffect(() => {
    const syncAuthState = () => {
      const user = getUserData();
      setUserRole(user?.role || 'creator');
      setUserData(user);
      setIsLoggedIn(!!getToken());
    };

    const handleStorage = (event) => {
      if (!event.key || (event.key !== 'createch_user' && event.key !== 'createch_token')) return;
      syncAuthState();
    };

    window.addEventListener('createch-auth-changed', syncAuthState);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('createch-auth-changed', syncAuthState);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Initialize theme from localStorage
  useEffect(() => {
    const theme = localStorage.getItem('createch_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    const accent = localStorage.getItem('createch_accent');
    if (accent) document.documentElement.style.setProperty('--accent', accent);
  }, []);

  const handleLogout = () => {
    apiLogout();
    setIsLoggedIn(false);
    setUserData(null);
  };

  const handleLogin = () => {
    // Called after successful API login; state is already in localStorage
    const user = getUserData();
    setUserRole(user?.role || 'creator');
    setUserData(user);
    setIsLoggedIn(true);
  };

  return (
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={
            isLoggedIn ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
          } />

          {/* Protected Routes — key forces re-mount on user change */}
          <Route element={<ProtectedLayout key={userData?.firebase_uid || 'anon'} isLoggedIn={isLoggedIn} userRole={userRole} userData={userData} onLogout={handleLogout} />}>

            <Route path="/" element={<DashboardPage userRole={userRole} />} />
            <Route path="/projects" element={userRole === 'admin' ? <AdminProjectsPage /> : <ProjectsPage userRole={userRole} />} />
            <Route path="/orders" element={userRole === 'admin' ? <Navigate to="/projects" replace /> : <ProjectsPage userRole={userRole} />} />
            <Route path="/creator-profile" element={<CreatorProfilePage />} />
            <Route path="/become-creator" element={<BecomeCreatorPage />} />

            {/* Creator-only Routes */}
            <Route element={<RoleGuard allowedRoles={['creator']} userRole={userRole} />}>
              <Route path="/my-gigs" element={<MyGigsPage userRole={userRole} />} />
            </Route>

            {/* Admin-only Routes — guarded by role */}
            <Route element={<RoleGuard allowedRoles={['admin']} userRole={userRole} />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/disputes" element={<DisputesPage />} />
            </Route>

            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/services/:id" element={<ServiceDetailPage />} />
            <Route path="/settings" element={<SettingsPage userRole={userRole} onLogout={handleLogout} />} />
            <Route path="/wallet" element={<WalletPage userRole={userRole} />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
  );
}

export default App;
