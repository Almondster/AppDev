import { useState, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'createch_auth';

/**
 * Hook for managing authentication state
 * @returns {Object} Auth state and handlers
 */
export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored).isLoggedIn : false;
    } catch (err) {
      console.error('Failed to read auth state:', err);
      return false;
    }
  });

  const [userRole, setUserRole] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored).userRole : 'creator';
    } catch (err) {
      console.error('Failed to read auth role:', err);
      return 'creator';
    }
  });

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUserRole('creator');
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const handleLogin = useCallback((role = 'creator') => {
    setIsLoggedIn(true);
    setUserRole(role);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isLoggedIn: true, userRole: role }));
  }, []);

  return {
    isLoggedIn,
    userRole,
    handleLogin,
    handleLogout
  };
};
