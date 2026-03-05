import { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProjectsProvider, OrdersProvider } from './context/providers';
import { useAuth } from './context/hooks/useAuth';
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from './config/routes';
import Sidebar from './components/Sidebar';
import './index.css';

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
  const { isLoggedIn, userRole, handleLogin, handleLogout } = useAuth();

  return (
    <ProjectsProvider>
      <OrdersProvider>
        <div className="app">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              {PUBLIC_ROUTES.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    route.path === '/login' && isLoggedIn ? (
                      <Navigate to="/" replace />
                    ) : route.path === '/login' ? (
                      <route.component onLogin={handleLogin} />
                    ) : (
                      <route.component />
                    )
                  }
                />
              ))}

              {/* Protected Routes */}
              <Route element={<ProtectedLayout isLoggedIn={isLoggedIn} userRole={userRole} onLogout={handleLogout} />}>
                {PROTECTED_ROUTES.map((route) => {
                  // Skip admin routes for non-admin users
                  if (route.admin && userRole !== 'admin') return null;

                  const props = route.props ? route.props.reduce((acc, prop) => {
                    if (prop === 'userRole') acc.userRole = userRole;
                    return acc;
                  }, {}) : {};

                  return (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={<route.component {...props} />}
                    />
                  );
                })}
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </OrdersProvider>
    </ProjectsProvider>
  );
}

export default App;
