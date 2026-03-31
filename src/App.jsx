import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProjectsProvider } from './context/ProjectsContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from './constants/routes';
import { ROLES } from './constants/roles';
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
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
    <p>Loading…</p>
  </div>
);

function ProtectedLayout({ isLoggedIn, userRole, onLogout }) {
  if (!isLoggedIn) return <Navigate to={ROUTES.LOGIN} replace />;
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
  const { isLoggedIn, userRole, login, logout } = useAuth();

  return (
    <ThemeProvider>
      <ProjectsProvider>
        <div className="app">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path={ROUTES.LANDING} element={<LandingPage />} />
              <Route path={ROUTES.LOGIN} element={
                isLoggedIn ? <Navigate to={ROUTES.HOME} replace /> : <LoginPage onLogin={login} />
              } />

              {/* Protected Routes */}
              <Route element={<ProtectedLayout isLoggedIn={isLoggedIn} userRole={userRole} onLogout={logout} />}>

                <Route path={ROUTES.HOME} element={<DashboardPage userRole={userRole} />} />
                <Route path={ROUTES.PROJECTS} element={<ProjectsPage userRole={userRole} />} />

                {/* Admin Routes */}
                <Route path={ROUTES.USERS} element={<UsersPage />} />
                <Route path={ROUTES.DISPUTES} element={<DisputesPage />} />

                <Route path={ROUTES.MESSAGES} element={<MessagesPage />} />
                <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage userRole={userRole} />} />
                <Route path={ROUTES.ORDERS} element={<OrdersPage userRole={userRole} />} />
                <Route path={ROUTES.SETTINGS} element={<SettingsPage userRole={userRole} />} />
                <Route path={ROUTES.WALLET} element={<WalletPage userRole={userRole} />} />
                <Route path={ROUTES.CREATOR_PROFILE} element={<CreatorProfilePage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
          </Suspense>
        </div>
      </ProjectsProvider>
    </ThemeProvider>
  );
}

export default App;
