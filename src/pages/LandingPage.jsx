import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import {
    ArrowRight, CheckCircle2, Shield, Zap, LayoutGrid, Search,
    Sparkles, Star
} from 'lucide-react';

const LOGO_PATH = '/assets/splash-icon-light-resized.png';

const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);
    const [activeRole, setActiveRole] = useState(null);
    const scrollRef = useRef(null);
    const navigate = useNavigate();

    const handleScroll = (e) => {
        setScrolled(e.currentTarget.scrollTop > 50);
    };

    const handleGetStarted = () => {
        navigate('/login');
    };

    const handleSignIn = () => {
        navigate('/login');
    };

    return (
        <div className="h-screen w-full bg-[#050505] text-white selection:bg-purple-500/30 font-sans relative overflow-hidden">
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes float-delayed {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; animation-delay: 1s; }
                .animate-blob { animation: blob 7s infinite; }
            `}</style>

            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600/10 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-emerald-500/5 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'py-6 bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center group cursor-pointer" onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src={LOGO_PATH} alt="Logo" className="w-7 h-7 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <span className="font-semibold text-lg tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">
                            CREATECH
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#creators" className="hover:text-white transition-colors">For Creators</a>
                        <a href="#clients" className="hover:text-white transition-colors">For Clients</a>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleSignIn} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-2">
                            Sign In
                        </button>
                        <Button onClick={handleGetStarted} className="shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300">
                            Get Started
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Scrollable Content */}
            <div ref={scrollRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto z-10 scroll-smooth">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 relative z-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                v2.0 is now live with Smart Match AI
                            </div>

                            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.1]">
                                Professional creative work, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-white">trusted & delivered.</span>
                            </h1>

                            <p className="text-lg md:text-xl text-zinc-400 max-w-xl leading-relaxed">
                                The command center for high-fidelity creative projects. Connect with vetted pros, manage escrow-secured payments, and ship faster.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button onClick={handleGetStarted} className="h-12 px-8 text-base group">
                                    Start Hiring <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <button onClick={handleGetStarted} className="h-12 px-8 text-base bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg transition-all">
                                    Apply as Creator
                                </button>
                            </div>

                            <div className="flex items-center gap-4 pt-8 text-sm text-zinc-500">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 overflow-hidden">
                                            <img src={`https://picsum.photos/id/${100 + i}/100/100`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex text-yellow-500 gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={10} fill="currentColor" />)}
                                    </div>
                                    <span>Trusted by 3,000+ creative teams</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="relative h-[500px] lg:h-[600px] w-full">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-[2rem] blur-3xl opacity-50" />
                            <GlassCard className="absolute top-10 left-10 right-0 bottom-10 border-white/10 shadow-2xl bg-[#0A0A0A]/60 backdrop-blur-xl flex flex-col overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">MS</div>
                                        <div className="space-y-2">
                                            <div className="h-2 w-24 bg-white/20 rounded" />
                                            <div className="h-2 w-16 bg-white/10 rounded" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-1/3 space-y-4">
                                            <div className="h-32 rounded-xl bg-white/5 border border-white/5" />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="h-20 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <CheckCircle2 size={20} className="text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard className="absolute bottom-20 -left-6 w-72 p-4 z-30 animate-float-delayed">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400"><Sparkles size={16} /></div>
                                    <span className="text-sm font-medium text-white">Smart Match Found</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                                        <img src="https://picsum.photos/id/64/80/80" className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-white">Ronald Rafaela</div>
                                        <div className="text-xs text-zinc-400">98% Match Score</div>
                                    </div>
                                    <Button className="ml-auto text-xs h-8 px-3">View</Button>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </section>

                {/* Role Selection */}
                <section id="clients" className="py-20 px-6 relative z-20">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl md:text-4xl font-semibold text-white">Choose your workspace</h2>
                            <p className="text-zinc-400">A unified platform tailored for two distinct workflows.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Client Card */}
                            <div onClick={handleGetStarted} className="group relative h-96 rounded-3xl bg-[#080808] border border-white/10 p-1 transition-all duration-500 cursor-pointer overflow-hidden hover:shadow-[0_0_50px_rgba(37,99,235,0.15)] hover:scale-[1.01]">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="h-full bg-[#080808]/80 backdrop-blur-xl rounded-[20px] p-8 flex flex-col relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                        <Search size={28} />
                                    </div>
                                    <h3 className="text-2xl font-medium text-white mb-2">I want to hire talent</h3>
                                    <p className="text-zinc-400 mb-8 max-w-sm">
                                        Post a request, get matched with verified pros, and manage projects with escrow protection.
                                    </p>
                                    <ul className="space-y-3 mb-auto">
                                        {['Smart Match AI Recommendations', 'Secure Escrow Payments', 'Project Management Dashboard'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                                                <CheckCircle2 size={16} className="text-blue-500" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex items-center text-blue-400 font-medium mt-8">
                                        Enter Client Workspace <ArrowRight size={16} className="ml-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Creator Card */}
                            <div id="creators" onClick={handleGetStarted} className="group relative h-96 rounded-3xl bg-[#080808] border border-white/10 p-1 transition-all duration-500 cursor-pointer overflow-hidden hover:shadow-[0_0_50px_rgba(147,51,234,0.15)] hover:scale-[1.01]">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="h-full bg-[#080808]/80 backdrop-blur-xl rounded-[20px] p-8 flex flex-col relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                                        <Sparkles size={28} />
                                    </div>
                                    <h3 className="text-2xl font-medium text-white mb-2">I want to offer services</h3>
                                    <p className="text-zinc-400 mb-8 max-w-sm">
                                        Build your portfolio, receive high-quality leads, and get paid securely and on time.
                                    </p>
                                    <ul className="space-y-3 mb-auto">
                                        {['Zero Upfront Fees', 'Guaranteed Payouts', 'Creator Studio Tools'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                                                <CheckCircle2 size={16} className="text-purple-500" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex items-center text-purple-400 font-medium mt-8">
                                        Enter Creator Studio <ArrowRight size={16} className="ml-2" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-24 px-6 bg-gradient-to-b from-[#050505] to-[#0A0A0A] border-t border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Built for the modern creative economy</h2>
                            <p className="text-zinc-400 max-w-2xl mx-auto">
                                We've reimagined the freelance marketplace to prioritize speed, trust, and quality.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "Smart Match AI", desc: "Stop scrolling through thousands of profiles. Our AI matches your requirements with the top 1% of relevant talent instantly.", icon: <Zap size={24} className="text-amber-400" /> },
                                { title: "Transaction Room", desc: "A dedicated workspace for every order. Chat, file sharing, and timeline updates all in one secure place.", icon: <LayoutGrid size={24} className="text-blue-400" /> },
                                { title: "Escrow Protection", desc: "Funds are held safely in escrow until work is approved. Clients get peace of mind, creators get guaranteed pay.", icon: <Shield size={24} className="text-emerald-400" /> }
                            ].map((feature, i) => (
                                <GlassCard key={i} className="p-8 h-full hover:-translate-y-2 transition-transform duration-500">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-medium text-white mb-3">{feature.title}</h3>
                                    <p className="text-zinc-400 leading-relaxed text-sm">{feature.desc}</p>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="py-24 px-6 border-t border-white/5 bg-[#050505]">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { label: "Active Creators", value: "12k+" },
                                { label: "Projects Completed", value: "85k+" },
                                { label: "Escrow Secured", value: "₱42M" },
                                { label: "Avg. Match Time", value: "< 5mins" },
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                                    <div className="text-sm text-zinc-500 uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20 opacity-50" />
                    <div className="max-w-4xl mx-auto relative z-10 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to upgrade your workflow?</h2>
                        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                            Join the platform where professional creativity happens. Secure, fast, and built for you.
                        </p>
                        <Button onClick={handleGetStarted} className="h-14 px-10 text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            Get Started Now
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default LandingPage;
