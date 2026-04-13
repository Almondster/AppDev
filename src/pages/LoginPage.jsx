import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import '../styles/LoginPage.css';
import '../styles/LogoutPage.css';

const DEMO_ACCOUNTS = [
  { label: 'Client', email: 'client@createch.com', password: 'Client@1234' },
  { label: 'Creator', email: 'creator@createch.com', password: 'Creator@1234' },
  { label: 'Admin', email: 'admin@createch.com', password: 'Admin@1234' },
];

const LoginPage = ({ onLogin, onRegister }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'client',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Minimum 8 characters';
    if (isSignUp) {
      if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');

    try {
      if (isSignUp) {
        await onRegister({
          email: form.email,
          password: form.password,
          confirm_password: form.confirmPassword,
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          role: form.role,
        });
      } else {
        await onLogin(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email, password) => {
    setLoading(true);
    setServerError('');
    try {
      await onLogin(email, password);
      navigate('/');
    } catch (err) {
      setServerError(err.message || 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setServerError('');
    setForm({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phone: '', role: 'client', rememberMe: false });
  };

  return (
    <main className="logout-page page-fade">
      <div className="login-card">
        <img src="/assets/splash-icon-light-resized.png" alt="Createch Logo" className="logout-logo" />
        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
        <p>{isSignUp ? 'Sign up to get started with CREATECH' : 'Log in to your CREATECH account'}</p>

        {serverError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {serverError}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">First Name</label>
                  <input className={`form-input${errors.firstName ? ' form-input--error' : ''}`} type="text" id="firstName" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Juan" disabled={loading} />
                  {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">Last Name</label>
                  <input className={`form-input${errors.lastName ? ' form-input--error' : ''}`} type="text" id="lastName" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Dela Cruz" disabled={loading} />
                  {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone (optional)</label>
                <input className="form-input" type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="09123456789" disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="role">Account Type</label>
                <select id="role" name="role" className="form-input sort-select" style={{ maxWidth: '100%' }} value={form.role} onChange={handleChange} disabled={loading}>
                  <option value="client">Client</option>
                  <option value="creator">Creator</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input className={`form-input${errors.email ? ' form-input--error' : ''}`} type="email" id="login-email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" disabled={loading} />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="password-wrapper">
              <input className={`form-input${errors.password ? ' form-input--error' : ''}`} type={showPassword ? 'text' : 'password'} id="login-password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" disabled={loading} />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input className={`form-input${errors.confirmPassword ? ' form-input--error' : ''}`} type="password" id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" disabled={loading} />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          )}

          {!isSignUp && (
            <div className="checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '16px' }}>
              <input id="rememberMe" type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={handleChange} />
              <label htmlFor="rememberMe" className="checkbox-label" style={{ margin: 0 }}>
                <span>Remember me</span>
              </label>
            </div>
          )}

          <Button variant="primary" type="submit" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={loading}>
            {loading ? <><Loader2 size={16} className="spin" /> {isSignUp ? 'Creating...' : 'Signing in...'}</> : (isSignUp ? 'Sign Up' : 'Log In')}
          </Button>
        </form>

        {!isSignUp && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #333)' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Demo Accounts</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #333)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  onClick={() => handleDemoLogin(demo.email, demo.password)}
                  disabled={loading}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #333)',
                    background: 'var(--card-bg, #1a1a2e)',
                    color: 'var(--text-primary, #fff)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </>
        )}

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
