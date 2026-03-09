import { useState, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProjectsProvider } from './context/ProjectsContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import './index.css';

// Lazy-loaded page components for route-based code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const CreatorProfilePage = lazy(() => import('./pages/CreatorProfilePage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const DisputesPage = lazy(() => import('./pages/DisputesPage'));

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#a1a1aa' }}>
    <p>Loading…</p>
  </div>
);

function ProtectedLayout({ isLoggedIn, userRole, onLogout }) {
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return (
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
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('createch_auth') === 'true';
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('createch_role') || 'creator';
  });

  // Memoize handlers to prevent unnecessary re-renders
  const handleLogout = useCallback(() => {
    localStorage.removeItem('createch_auth');
    localStorage.removeItem('createch_role');
    setIsLoggedIn(false);
  }, []);

  const handleLogin = useCallback((role = 'creator') => {
    localStorage.setItem('createch_auth', 'true');
    localStorage.setItem('createch_role', role);
    setUserRole(role);
    setIsLoggedIn(true);
  }, []);

  return (
    <ThemeProvider>
      <ProjectsProvider>
        <div className="app">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={
                isLoggedIn ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
              } />

            {/* Protected Routes */}
            <Route element={<ProtectedLayout isLoggedIn={isLoggedIn} userRole={userRole} onLogout={handleLogout} />}>

              <Route path="/" element={<DashboardPage userRole={userRole} />} />
              <Route path="/projects" element={<ProjectsPage userRole={userRole} />} />

              {/* Admin Routes */}
              <Route path="/users" element={<UsersPage />} />
              <Route path="/disputes" element={<DisputesPage />} />

              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/settings" element={<SettingsPage userRole={userRole} />} />
              <Route path="/wallet" element={<WalletPage userRole={userRole} />} />
              <Route path="/creator-profile" element={<CreatorProfilePage />} />
            </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </ProjectsProvider>
    </ThemeProvider>
  );
}

export default App;
