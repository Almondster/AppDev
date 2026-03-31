import { useState, useCallback } from 'react';

const AUTH_KEY = 'createch_auth';
const ROLE_KEY = 'createch_role';

/**
 * Hook to encapsulate authentication state management.
 * Reads/writes login state and user role from localStorage.
 */
export const useAuth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem(AUTH_KEY) === 'true';
    });

    const [userRole, setUserRole] = useState(() => {
        return localStorage.getItem(ROLE_KEY) || 'creator';
    });

    const login = useCallback((role = 'creator') => {
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem(ROLE_KEY, role);
        setUserRole(role);
        setIsLoggedIn(true);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(ROLE_KEY);
        setIsLoggedIn(false);
    }, []);

    return { isLoggedIn, userRole, login, logout };
};
