import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Star } from 'lucide-react';
import { googleLoginAPI, login, register } from '../api';
import { signInWithGooglePopup } from '../lib/firebase';
import './LoginPage.css';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const initialForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  termsAccepted: false,
};

const AuthBrandPanel = () => (
  <aside className="auth-brand-panel">
    <div className="auth-ambient auth-ambient--blue" />
    <div className="auth-ambient auth-ambient--purple" />
    <div className="auth-brand-panel__content">
      <Link to="/landing" className="auth-brand">
        <img src="/assets/splash-icon-light-resized.png" alt="Createch" />
        <span>CREATECH</span>
      </Link>
      <div className="auth-brand-panel__headline">
        <h1>
          The operating system
          <br />
          for <span>creative work.</span>
        </h1>
        <p>
          Join thousands of creators and clients building the future. Secure payments,
          smart matching, and zero friction.
        </p>
      </div>
      <div className="auth-testimonial">
        <div className="auth-testimonial__stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={18} fill="currentColor" />
          ))}
        </div>
        <blockquote>
          CREATECH transformed how we scale our design operations. The talent quality is
          unmatched and the escrow system gives us total peace of mind.
        </blockquote>
        <div className="auth-testimonial__person">
          <img src="https://picsum.photos/id/1005/80/80" alt="" />
          <div>
            <strong>Fel Kristian Raut</strong>
            <span>Product Director, GORRP Tech</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
);

const LoginPage = ({ onLogin }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  useEffect(() => {
    setIsSignUp(searchParams.get('mode') === 'signup');
  }, [searchParams]);

  const fullName = useMemo(() => {
    return [form.firstName, form.middleName, form.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ');
  }, [form.firstName, form.middleName, form.lastName]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    let cleanValue = type === 'checkbox' ? checked : value;

    if (['firstName', 'middleName', 'lastName'].includes(name)) {
      cleanValue = value.replace(/[^a-zA-Z\s]/g, '').replace(/^\s+/, '');
    }
    if (name === 'phone') {
      cleanValue = value.replace(/\D/g, '').slice(0, 11);
    }

    setForm((prev) => ({ ...prev, [name]: cleanValue }));
    setErrors((prev) => ({ ...prev, [name]: '', terms: '' }));
    setApiError('');
    setApiSuccess('');
  };

  const validate = () => {
    const nextErrors = {};

    if (isSignUp) {
      if (!form.firstName.trim()) nextErrors.firstName = 'First name is required';
      if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required';
      if (!form.dob) nextErrors.dob = 'Date of birth is required';
      if (!/^09\d{9}$/.test(form.phone)) nextErrors.phone = 'Use an 11-digit PH number starting with 09';
      if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
      if (!form.termsAccepted) nextErrors.terms = 'You must accept the terms';
    }

    if (!form.email) nextErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Invalid email format';
    if (!form.password) nextErrors.password = 'Password is required';
    else if (form.password.length < 8) nextErrors.password = 'Minimum 8 characters';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      if (isSignUp) {
        const { ok, data } = await register({
          email: form.email,
          password: form.password,
          confirm_password: form.confirmPassword,
          first_name: form.firstName.trim(),
          last_name: [form.middleName.trim(), form.lastName.trim()].filter(Boolean).join(' '),
          phone: `+63${form.phone.startsWith('0') ? form.phone.slice(1) : form.phone}`,
          role: searchParams.get('role') || 'client',
        });

        if (!ok) {
          setApiError(data?.error || data?.detail || 'Registration failed. Please try again.');
          return;
        }

        setApiSuccess('Account created. Taking you to your workspace...');
        setTimeout(() => {
          onLogin();
          navigate('/');
        }, 600);
      } else {
        const { ok, data } = await login(form.email, form.password);
        if (!ok) {
          setApiError(data?.error || data?.detail || 'Invalid email or password.');
          return;
        }

        setApiSuccess('Welcome back. Opening your workspace...');
        setTimeout(() => {
          onLogin();
          navigate('/');
        }, 450);
      }
    } catch {
      setApiError('Cannot connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setApiError('');
    setApiSuccess('');
    try {
      const role = searchParams.get('role') || 'client';
      const result = await signInWithGooglePopup();
      const idToken = await result.user.getIdToken();
      await googleLoginAPI(idToken, role);
      setApiSuccess('Google sign-in successful. Opening your workspace...');
      setTimeout(() => {
        onLogin();
        navigate('/');
      }, 450);
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('Not Found') || msg.includes('(404)') || msg.includes('404')) {
        setApiError('Google login endpoint is not deployed yet on FastAPI (`/api/auth/google/`).');
      } else {
        setApiError(msg || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    const nextSignUp = !isSignUp;
    setSearchParams(nextSignUp ? { mode: 'signup' } : {});
    setIsSignUp(nextSignUp);
    setErrors({});
    setApiError('');
    setApiSuccess('');
    setForm(initialForm);
  };

  return (
    <main className="auth-page page-fade">
      <AuthBrandPanel />

      <section className="auth-form-panel" aria-label={isSignUp ? 'Create an account' : 'Sign in'}>
        <Link to="/landing" className="auth-back">
          <ArrowLeft size={17} />
          Back to Landing Page
        </Link>

        <div className={`auth-form-card ${isSignUp ? 'auth-form-card--signup' : ''}`}>
          <div className="auth-form-card__header">
            <h2>{isSignUp ? 'Create an account' : 'Welcome back'}</h2>
            <p>{isSignUp ? 'Enter your details to get started.' : 'Please enter your details to sign in.'}</p>
          </div>

          <button type="button" className="auth-google" onClick={handleGoogleSignIn} disabled={loading}>
            <GoogleIcon />
            {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
          </button>

          <div className="auth-divider"><span>OR</span></div>

          {apiError && <div className="auth-alert auth-alert--error">{apiError}</div>}
          {apiSuccess && <div className="auth-alert auth-alert--success">{apiSuccess}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <div className="auth-form__grid auth-form__grid--two">
                  <label>
                    <span>First Name</span>
                    <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" />
                    {errors.firstName && <small>{errors.firstName}</small>}
                  </label>
                  <label>
                    <span>Middle Name (Optional)</span>
                    <input name="middleName" value={form.middleName} onChange={handleChange} />
                  </label>
                </div>

                <label>
                  <span>Last Name</span>
                  <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" />
                  {errors.lastName && <small>{errors.lastName}</small>}
                </label>

                <label>
                  <span>Date of Birth</span>
                  <input type="date" name="dob" value={form.dob} onChange={handleChange} />
                  {errors.dob && <small>{errors.dob}</small>}
                </label>

                <label>
                  <span>Phone Number (PH)</span>
                  <div className="auth-phone">
                    <strong>+63</strong>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="0912 345 6789" />
                  </div>
                  {errors.phone && <small>{errors.phone}</small>}
                </label>
              </>
            )}

            <label>
              <span>Email Address</span>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
              {errors.email && <small>{errors.email}</small>}
            </label>

            <div className={isSignUp ? 'auth-form__grid auth-form__grid--two' : ''}>
              <label>
                <span>
                  Password
                  {!isSignUp && <button type="button">Forgot password?</button>}
                </span>
                <div className="auth-password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={isSignUp ? '' : 'Enter your password'}
                  />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <small>{errors.password}</small>}
              </label>

              {isSignUp && (
                <label>
                  <span>Confirm</span>
                  <div className="auth-password">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <small>{errors.confirmPassword}</small>}
                </label>
              )}
            </div>

            {isSignUp && (
              <div className="auth-terms-field">
                <label className="auth-terms">
                  <input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={handleChange} />
                  <em>I accept the <strong>Terms</strong> and <strong>Privacy Policy</strong>.</em>
                </label>
                {errors.terms && <small>{errors.terms}</small>}
              </div>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button type="button" onClick={switchMode}>{isSignUp ? 'Sign In' : 'Sign up'}</button>
          </p>

          {isSignUp && fullName && <p className="auth-preview">Creating profile for {fullName}</p>}
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
