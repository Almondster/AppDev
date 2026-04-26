import { useState, useCallback, useEffect, useRef } from 'react';
import {
  loginAPI,
  registerAPI,
  fetchMe,
  getToken,
  getStoredUser,
  clearToken,
  clearAllCache,
  setStoredUser,
} from '../services/api';

/**
 * Hook to manage authentication state.
 * - Connects to the Django backend for real JWT auth
 * - Listens for 401 auth:expired events from the API layer
 * - Aborts in-flight verification on unmount
 */
export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const userRole = user?.role || 'client';
  const firebaseUid = user?.firebase_uid || null;

  // Force‐logout handler for 401 responses detected by the API layer
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setIsLoggedIn(false);
      setError('Session expired. Please log in again.');
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  // On mount, verify the stored token (with abort on unmount)
  useEffect(() => {
    if (!getToken()) return;

    const controller = new AbortController();
    abortRef.current = controller;

    fetchMe({ signal: controller.signal })
      .then((profile) => {
        const userData = {
          firebase_uid: profile.firebase_uid,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name || profile.display_name,
          avatar_url: profile.avatar_url,
        };
        setStoredUser(userData);
        setUser(userData);
        setIsLoggedIn(true);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        // Token expired or backend unreachable — keep stored data
      });

    return () => controller.abort();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginAPI(email, password);
      const userData = {
        firebase_uid: data.firebase_uid,
        email: data.email,
        role: data.role,
        full_name: data.full_name,
      };
      setUser(userData);
      setIsLoggedIn(true);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await registerAPI(formData);
      const userData = {
        firebase_uid: data.firebase_uid,
        email: data.email,
        role: data.role,
        full_name: data.full_name,
      };
      setUser(userData);
      setIsLoggedIn(true);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    clearAllCache();
    setUser(null);
    setIsLoggedIn(false);
    setError(null);
  }, []);

  return { isLoggedIn, user, userRole, firebaseUid, loading, error, login, register, logout };
};
