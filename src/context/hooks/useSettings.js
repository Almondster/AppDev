import { useState, useCallback } from 'react';

/**
 * Hook for managing settings page state
 * @returns {Object} Settings state and handlers
 */
export const useSettings = () => {
  const [activeSection, setActiveSection] = useState('profile');

  // Profile settings
  const [phone, setPhone] = useState('09123456789');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Notification settings
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);

  // Admin settings
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoSuspend, setAutoSuspend] = useState(true);
  const [commissionRate, setCommissionRate] = useState('15');

  const toggleSetting = useCallback((setting) => {
    const setters = {
      pushNotif: setPushNotif,
      emailNotif: setEmailNotif,
      maintenanceMode: setMaintenanceMode,
      autoSuspend: setAutoSuspend,
    };
    const setter = setters[setting];
    if (setter) {
      setter((prev) => !prev);
    }
  }, []);

  const updateSetting = useCallback((setting, value) => {
    const setters = {
      phone: setPhone,
      currentPassword: setCurrentPassword,
      newPassword: setNewPassword,
      commissionRate: setCommissionRate,
    };
    const setter = setters[setting];
    if (setter) {
      setter(value);
    }
  }, []);

  return {
    activeSection,
    setActiveSection,
    phone,
    currentPassword,
    newPassword,
    pushNotif,
    emailNotif,
    maintenanceMode,
    autoSuspend,
    commissionRate,
    toggleSetting,
    updateSetting,
  };
};
