import { useState, useCallback } from 'react';

const INITIAL_FORM = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  role: 'creator',
  rememberMe: false,
};

/**
 * Hook for managing login/signup form logic
 * @returns {Object} Form state and handlers
 */
export const useLoginForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Minimum 6 characters';
    }

    if (isSignUp) {
      if (!form.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, isSignUp]);

  const toggleMode = useCallback(() => {
    setIsSignUp((prev) => !prev);
    setErrors({});
    setForm(INITIAL_FORM);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return {
    isSignUp,
    form,
    errors,
    showPassword,
    handleChange,
    validate,
    toggleMode,
    togglePasswordVisibility,
    setForm,
  };
};
