import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for reading and writing values to localStorage with JSON serialization.
 * Falls back to initialValue if localStorage is empty or unavailable.
 */
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Sync to localStorage whenever the value changes
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error writing localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const setValue = useCallback((value) => {
        setStoredValue((prev) => (typeof value === 'function' ? value(prev) : value));
    }, []);

    const removeValue = useCallback(() => {
        try {
            localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
};
