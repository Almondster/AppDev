import { useState, useCallback, useRef } from 'react';

/**
 * Hook for managing toast notifications with auto-dismiss.
 * Returns the current notification object and a showNotification function.
 */
export const useNotification = (duration = 3000) => {
    const [notification, setNotification] = useState(null);
    const timerRef = useRef(null);

    const showNotification = useCallback((message, type = 'success') => {
        // Clear any existing timer
        if (timerRef.current) clearTimeout(timerRef.current);

        setNotification({ message, type });

        timerRef.current = setTimeout(() => {
            setNotification(null);
            timerRef.current = null;
        }, duration);
    }, [duration]);

    const dismissNotification = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setNotification(null);
    }, []);

    return { notification, showNotification, dismissNotification };
};
