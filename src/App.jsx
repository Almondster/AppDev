import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProjectsProvider } from './context/providers/ProjectsProvider';
import React from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
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

function ProtectedLayout({ isLoggedIn, userRole, onLogout }) {
  if (!isLoggedIn) return <LandingPage />;
  return (
    <ProjectsProvider>
      <div className="dashboard-layout page-fade">
        <Sidebar userRole={userRole} onLogout={onLogout} />
        <div className="main-content-wrapper">
          <main className="main-content">
            <Outlet />
          </main>
          <footer className="app-footer">
            <p>&copy; 2026 CREATECH Platform. All rights reserved.</p>
          </footer>
        </div>
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

  // Keep auth state in sync with localStorage changes
  useEffect(() => {
    const user = getUserData();
    if (user) {
      setUserRole(user.role || 'creator');
      setUserData(user);
    }
  }, [isLoggedIn]);

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
          <Route element={<ProtectedLayout key={userData?.firebase_uid || 'anon'} isLoggedIn={isLoggedIn} userRole={userRole} onLogout={handleLogout} />}>

            <Route path="/" element={<DashboardPage userRole={userRole} />} />
            <Route path="/projects" element={<ProjectsPage userRole={userRole} />} />

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
            <Route path="/creator-profile" element={<CreatorProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
  );
}

export default App;
