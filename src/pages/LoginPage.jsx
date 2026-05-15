import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';
import { ArrowLeft, Star, Quote, Eye, EyeOff } from 'lucide-react';
import { login, register, googleLoginAPI, forgotPassword } from '../api';
import { signInWithGooglePopup } from '../lib/firebase';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const LoginPage = ({ onLogin }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState(searchParams.get('mode') === 'signup');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [authNotice, setAuthNotice] = useState(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        dob: '',
        phone: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { setIsLoaded(true); }, []);

    const handleChange = (field, value) => {
        let cleanValue = value;

        if (field === 'firstName' || field === 'middleName' || field === 'lastName') {
            cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
            if (cleanValue.startsWith(' ')) cleanValue = cleanValue.trimStart();
        } else if (field === 'phone') {
            cleanValue = value.replace(/[^0-9]/g, '');
            if (cleanValue.length > 11) cleanValue = cleanValue.slice(0, 11);
        }

        setFormData(prev => ({ ...prev, [field]: cleanValue }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
        setAuthError(null);
        setAuthNotice(null);
    };

    const validateForm = () => {
        const newErrors = {};

        if (isRegistering) {
            if (!formData.firstName.trim()) newErrors.firstName = 'First name required';
            if (!formData.lastName.trim()) newErrors.lastName = 'Last name required';
            if (!formData.dob) newErrors.dob = 'Date of birth required';
            if (!formData.phone) newErrors.phone = 'Phone required';
            else if (!/^09\d{9}$/.test(formData.phone)) newErrors.phone = 'Enter valid 11-digit PH number (09...)';
            if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
            if (!formData.termsAccepted) newErrors.terms = 'You must accept the terms';
        }

        if (!formData.email) newErrors.email = 'Email required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
        if (!formData.password) newErrors.password = 'Password required';
        else if (formData.password.length < 8) newErrors.password = 'Minimum 8 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setAuthError(null);
        setAuthNotice(null);

        try {
            if (isRegistering) {
                const { ok, data } = await register({
                    email: formData.email,
                    password: formData.password,
                    confirm_password: formData.confirmPassword,
                    first_name: formData.firstName.trim(),
                    last_name: [formData.middleName.trim(), formData.lastName.trim()].filter(Boolean).join(' '),
                    phone: `+63${formData.phone.startsWith('0') ? formData.phone.slice(1) : formData.phone}`,
                    role: searchParams.get('role') || 'client',
                });

                if (!ok) {
                    setAuthError(data?.error || data?.detail || 'Registration failed');
                    return;
                }

                setTimeout(() => {
                    onLogin();
                    navigate('/');
                }, 600);
            } else {
                const { ok, data } = await login(formData.email, formData.password);
                if (!ok) {
                    setAuthError(data?.error || data?.detail || 'Invalid email or password');
                    return;
                }

                setTimeout(() => {
                    onLogin();
                    navigate('/');
                }, 450);
            }
        } catch {
            setAuthError('Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!formData.email) {
            setAuthError('Enter your email first so the reset link knows where to go.');
            return;
        }

        setIsLoading(true);
        setAuthError(null);
        setAuthNotice(null);
        try {
            const { ok, data } = await forgotPassword(formData.email);
            if (!ok) {
                setAuthError(data?.detail || 'Unable to send password reset email');
                return;
            }
            setAuthNotice(data?.detail || 'Password reset link sent.');
            setShowForgotPassword(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const role = searchParams.get('role') || 'client';
            const result = await signInWithGooglePopup();
            const idToken = await result.user.getIdToken();
            await googleLoginAPI(idToken, role);
            setTimeout(() => {
                onLogin();
                navigate('/');
            }, 450);
        } catch (err) {
            setAuthError(err?.message || 'Google sign-in failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#050505] font-sans overflow-hidden">
            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
            `}</style>

            {/* LEFT SIDE: Brand */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#0A0A0A] items-center justify-center p-12">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px] animate-blob" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
                    <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[120px] animate-blob animation-delay-4000" />
                </div>

                <div className="relative z-10 max-w-lg space-y-8">
                    <div className="flex items-center mb-8">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src="/assets/splash-icon-light-resized.png" alt="Logo" className="w-7 h-7 object-contain" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">CREATECH</span>
                    </div>

                    <h1 className="text-5xl font-bold text-white leading-tight">
                        The operating system for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">creative work.</span>
                    </h1>

                    <p className="text-lg text-zinc-400 leading-relaxed">
                        Join thousands of creators and clients building the future. Secure payments, smart matching, and zero friction.
                    </p>

                    <div className="pt-8">
                        <GlassCard className="p-6 border-white/5 bg-white/5 backdrop-blur-xl">
                            <div className="flex gap-1 text-yellow-500 mb-4">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                            </div>
                            <p className="text-zinc-300 italic mb-6 relative">
                                <Quote size={40} className="absolute -top-4 -left-2 text-white/5 -z-10" />
                                "CREATECH transformed how we scale our design operations. The talent quality is unmatched."
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                                    <img src="https://picsum.photos/id/1005/80/80" className="w-full h-full object-cover" alt="" />
                                </div>
                                <div>
                                    <div className="text-white font-medium text-sm">Fel Kirstian Raut</div>
                                    <div className="text-zinc-500 text-xs">Product Director, GORRP Tech</div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Form */}
            <div className="w-full lg:w-1/2 flex flex-col relative z-10 bg-[#050505] border-l border-white/5 h-full">
                <div className="lg:hidden absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-600/10 rounded-full blur-[100px]" />
                </div>

                <div className="p-6 lg:p-10 flex justify-between items-center z-20 shrink-0">
                    <button
                        onClick={() => navigate('/landing')}
                        className="text-zinc-500 hover:text-white text-sm flex items-center gap-2 transition-all hover:-translate-x-1 px-4 py-2 rounded-full hover:bg-white/5"
                    >
                        <ArrowLeft size={16} />
                        <span className="font-medium">Back to Landing Page</span>
                    </button>
                    <div className="lg:hidden flex items-center gap-2">
                        <span className="font-bold text-white tracking-tight">CREATECH</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 lg:p-12">
                    <div className="min-h-full flex items-center justify-center">
                        <div className={`w-full max-w-md transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="space-y-8 pb-10">
                                <div className="text-center lg:text-left">
                                    <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                                        {isRegistering ? 'Create an account' : 'Welcome back'}
                                    </h2>
                                    <p className="text-zinc-400 text-sm">
                                        {isRegistering ? 'Enter your details to get started.' : 'Please enter your details to sign in.'}
                                    </p>
                                </div>

                                <button
                                    onClick={handleGoogleSignIn}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 transition-all shadow-lg"
                                >
                                    <GoogleIcon />
                                    <span>{isRegistering ? 'Sign up with Google' : 'Sign in with Google'}</span>
                                </button>

                                <div className="relative flex items-center">
                                    <div className="flex-grow border-t border-white/10"></div>
                                    <span className="flex-shrink-0 mx-4 text-zinc-600 text-[10px] uppercase tracking-widest font-semibold">Or</span>
                                    <div className="flex-grow border-t border-white/10"></div>
                                </div>

                                {authError && (
                                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                                        {authError}
                                    </div>
                                )}

                                {authNotice && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-lg text-sm">
                                        {authNotice}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {isRegistering && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-zinc-400">First Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.firstName}
                                                        onChange={(e) => handleChange('firstName', e.target.value)}
                                                        className={`w-full bg-white/5 border ${errors.firstName ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all`}
                                                        placeholder="John"
                                                    />
                                                    {errors.firstName && <p className="text-xs text-red-400">{errors.firstName}</p>}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-zinc-400">Middle Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.middleName}
                                                        onChange={(e) => handleChange('middleName', e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-zinc-400">Last Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.lastName}
                                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                                    className={`w-full bg-white/5 border ${errors.lastName ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all`}
                                                    placeholder="Doe"
                                                />
                                                {errors.lastName && <p className="text-xs text-red-400">{errors.lastName}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-zinc-400">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    value={formData.dob}
                                                    onChange={(e) => handleChange('dob', e.target.value)}
                                                    className={`w-full bg-white/5 border ${errors.dob ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all`}
                                                />
                                                {errors.dob && <p className="text-xs text-red-400">{errors.dob}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-zinc-400">Phone Number (PH)</label>
                                                <div className="flex gap-2">
                                                    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-400 flex items-center">+63</div>
                                                    <input
                                                        type="text"
                                                        value={formData.phone}
                                                        onChange={(e) => handleChange('phone', e.target.value)}
                                                        className={`flex-1 bg-white/5 border ${errors.phone ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all`}
                                                        placeholder="0912 345 6789"
                                                    />
                                                </div>
                                                {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-400">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            className={`w-full bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all`}
                                            placeholder="you@example.com"
                                        />
                                        {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-400">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => handleChange('password', e.target.value)}
                                                className={`w-full bg-white/5 border ${errors.password ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-white/30 transition-all`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                                        {!isRegistering && (
                                            <div className="mt-2 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowForgotPassword((prev) => !prev)}
                                                    className="text-xs text-blue-300 hover:text-white"
                                                >
                                                    Forgot password?
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {!isRegistering && showForgotPassword && (
                                        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                                            Send a reset link to <span className="text-white">{formData.email || 'your email'}</span>.
                                            <button
                                                type="button"
                                                onClick={handleForgotPassword}
                                                className="mt-3 block rounded-md bg-blue-500 px-3 py-2 text-xs font-medium text-white"
                                            >
                                                Send reset link
                                            </button>
                                        </div>
                                    )}

                                    {isRegistering && (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-zinc-400">Confirm Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        value={formData.confirmPassword}
                                                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                                        className={`w-full bg-white/5 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-white/30 transition-all`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                                {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.termsAccepted}
                                                        onChange={(e) => handleChange('termsAccepted', e.target.checked)}
                                                        className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0"
                                                    />
                                                    <span className="text-xs text-zinc-400">
                                                        I accept the <span className="text-white font-medium">Terms</span> and <span className="text-white font-medium">Privacy Policy</span>
                                                    </span>
                                                </label>
                                                {errors.terms && <p className="text-xs text-red-400">{errors.terms}</p>}
                                            </div>
                                        </>
                                    )}

                                    <Button type="submit" disabled={isLoading} className="w-full">
                                        {isLoading ? 'Processing...' : isRegistering ? 'Create Account' : 'Sign In'}
                                    </Button>
                                </form>

                                <p className="text-center text-sm text-zinc-500">
                                    {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                                    <button
                                        type="button"
                                        onClick={() => setIsRegistering(!isRegistering)}
                                        className="text-white font-medium hover:underline"
                                    >
                                        {isRegistering ? 'Sign In' : 'Sign Up'}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
