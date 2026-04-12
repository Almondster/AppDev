import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api';
import Button from '../components/Button';
import { Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';
import './LogoutPage.css';

const LoginPage = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'client',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Minimum 8 characters';
    if (isSignUp) {
      if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      if (isSignUp) {
        const nameParts = form.fullName.trim().split(' ');
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';

        const { ok, data } = await register({
          email: form.email,
          password: form.password,
          confirm_password: form.confirmPassword,
          first_name,
          last_name,
          phone: '',
          role: form.role,
        });

        if (ok) {
          setApiSuccess('Registration successful! Logging you in...');
          setTimeout(() => {
            onLogin();
            navigate('/');
          }, 800);
        } else {
          setApiError(data.error || data.detail || 'Registration failed. Please try again.');
        }
      } else {
        const { ok, data } = await login(form.email, form.password);

        if (ok) {
          setApiSuccess('Login successful!');
          setTimeout(() => {
            onLogin();
            navigate('/');
          }, 500);
        } else {
          setApiError(data.error || data.detail || 'Invalid email or password.');
        }
      }
    } catch (err) {
      setApiError('Cannot connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setApiError('');
    setApiSuccess('');
    setForm({ email: '', password: '', confirmPassword: '', fullName: '', role: 'client', rememberMe: false });
  };

  return (
    <main className="logout-page page-fade">
      <div className="login-card">
        <img src="/assets/splash-icon-light-resized.png" alt="Createch Logo" className="logout-logo" />
        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
        <p>{isSignUp ? 'Sign up to get started with CREATECH' : 'Log in to your CREATECH account'}</p>

        {apiError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {apiError}
          </div>
        )}
        {apiSuccess && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {apiSuccess}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input className={`form-input${errors.fullName ? ' form-input--error' : ''}`} type="text" id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Juan Dela Cruz" />
              {errors.fullName && <span className="form-error">{errors.fullName}</span>}
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input className={`form-input${errors.email ? ' form-input--error' : ''}`} type="email" id="login-email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="password-wrapper">
              <input className={`form-input${errors.password ? ' form-input--error' : ''}`} type={showPassword ? 'text' : 'password'} id="login-password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          {isSignUp && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <input className={`form-input${errors.confirmPassword ? ' form-input--error' : ''}`} type="password" id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="role">I want to join as</label>
                <select id="role" name="role" className="form-input sort-select" style={{ maxWidth: '100%' }} value={form.role} onChange={handleChange}>
                  <option value="client">Client — I want to hire creators</option>
                  <option value="creator">Creator — I want to offer services</option>
                </select>
              </div>
            </>
          )}

          {!isSignUp && (
            <div className="checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '16px' }}>
              <input id="rememberMe" type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={handleChange} />
              <label htmlFor="rememberMe" className="checkbox-label" style={{ margin: 0 }}>
                <span>Remember me</span>
              </label>
            </div>
          )}

          <Button variant="primary" type="submit" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </Button>
        </form>

        <p className="login-toggle" style={{ marginTop: '16px' }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }} style={{ color: '#818cf8', textDecoration: 'none' }}>
            {isSignUp ? 'Log In' : 'Sign Up'}
          </a>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
