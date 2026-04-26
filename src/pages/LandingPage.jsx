import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  Search,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import '../styles/LandingPage.css';

const LOGO_PATH = '/assets/splash-icon-light-resized.png';

const featureCards = [
  {
    icon: <Zap size={22} />,
    tone: 'amber',
    title: 'Smart Match AI',
    text: 'Match project requirements with relevant creative talent without scrolling through endless profiles.',
  },
  {
    icon: <LayoutGrid size={22} />,
    tone: 'blue',
    title: 'Transaction Room',
    text: 'Keep chat, files, project updates, and timelines organized in one workspace for every order.',
  },
  {
    icon: <Shield size={22} />,
    tone: 'emerald',
    title: 'Escrow Protection',
    text: 'Funds stay protected until work is approved, giving clients confidence and creators reliable payouts.',
  },
];

const workspaceCards = [
  {
    icon: <Search size={24} />,
    tone: 'blue',
    title: 'I want to hire talent',
    text: 'Post a request, get matched with verified pros, and manage projects with escrow protection.',
    bullets: ['Smart Match AI Recommendations', 'Secure Escrow Payments', 'Project Management Dashboard'],
    action: 'Enter Client Workspace',
  },
  {
    icon: <Sparkles size={24} />,
    tone: 'purple',
    title: 'I want to offer services',
    text: 'Build your portfolio, receive high-quality leads, and get paid securely and on time.',
    bullets: ['Zero Upfront Fees', 'Guaranteed Payouts', 'Creator Studio Tools'],
    action: 'Enter Creator Studio',
  },
];

const stats = [
  ['12k+', 'Active Creators'],
  ['85k+', 'Projects Completed'],
  ['PHP 42M', 'Escrow Secured'],
  ['< 5mins', 'Avg. Match Time'],
];

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSectionScroll = (event, sectionId) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (!section) return;

    const headerOffset = 92;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: sectionTop, behavior: 'smooth' });
  };

  return (
    <main className="landing-shell page-fade">
      <div className="landing-ambient landing-ambient--blue" />
      <div className="landing-ambient landing-ambient--purple" />

      <header className={`landing-header ${scrolled ? 'landing-header--scrolled' : ''}`}>
        <nav className="landing-nav" aria-label="Primary">
          <Link className="landing-brand" to="/landing">
            <img src={LOGO_PATH} alt="Createch" />
            <span>CREATECH</span>
          </Link>
          <div className="landing-nav__links">
            <a href="#features" onClick={(event) => handleSectionScroll(event, 'features')}>Features</a>
            <a href="#creators" onClick={(event) => handleSectionScroll(event, 'creators')}>For Creators</a>
            <a href="#clients" onClick={(event) => handleSectionScroll(event, 'clients')}>For Clients</a>
          </div>
          <div className="landing-nav__actions">
            <Link to="/login">Sign In</Link>
          <Link className="landing-nav__cta" to="/login?mode=signup">Get Started</Link>
          </div>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <h1>
            Professional creative work,
            <br />
            <span>trusted and delivered.</span>
          </h1>
          <p>
            The command center for high-fidelity creative projects. Connect with vetted pros,
            manage escrow-secured payments, and ship faster.
          </p>
          <div className="landing-hero__actions">
            <Link className="landing-btn" to="/login?mode=signup">
              Start Hiring <ArrowRight size={17} />
            </Link>
            <Link className="landing-btn landing-btn--ghost" to="/login?mode=signup&role=creator">
              Apply as Creator
            </Link>
          </div>
          <div className="landing-proof">
            <div className="landing-proof__avatars" aria-hidden="true">
              {[101, 102, 103, 104].map((id) => (
                <img key={id} src={`https://picsum.photos/id/${id}/80/80`} alt="" />
              ))}
            </div>
            <div>
              <div className="landing-proof__stars">
                {[1, 2, 3, 4, 5].map((item) => (
                  <Star key={item} size={11} fill="currentColor" />
                ))}
              </div>
              <span>Trusted by 3,000+ creative teams</span>
            </div>
          </div>
        </div>

        <div className="landing-hero__visual" aria-hidden="true">
          <div className="landing-ui">
            <div className="landing-ui__bar">
              <div className="landing-ui__avatar">MS</div>
              <div className="landing-ui__lines">
                <span />
                <span />
              </div>
              <div className="landing-ui__button" />
            </div>
            <div className="landing-ui__body">
              <div className="landing-ui__panel" />
              <div className="landing-ui__column">
                <div className="landing-ui__notice">
                  <CheckCircle2 size={17} />
                  <div>
                    <span />
                    <span />
                  </div>
                </div>
                <div className="landing-ui__tiles">
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
          <div className="landing-float landing-float--bottom">
            <div className="landing-float__title">
              <Sparkles size={15} />
              Smart Match Found
            </div>
            <div className="landing-match">
              <img src="https://picsum.photos/id/64/80/80" alt="" />
              <div>
                <strong>Ronald Rafaela</strong>
                <span>98% Match Score</span>
              </div>
              <span>View</span>
            </div>
          </div>
        </div>
      </section>

      <section id="clients" className="landing-section">
        <div className="landing-section__heading">
          <h2>Choose your workspace</h2>
          <p>A unified platform tailored for two distinct workflows.</p>
        </div>
        <div className="workspace-grid">
          {workspaceCards.map((card) => (
            <Link
              key={card.title}
              to={`/login?mode=signup${card.tone === 'purple' ? '&role=creator' : ''}`}
              className={`workspace-card workspace-card--${card.tone}`}
            >
              <div className="workspace-card__icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <ul>
                {card.bullets.map((bullet) => (
                  <li key={bullet}>
                    <CheckCircle2 size={15} />
                    {bullet}
                  </li>
                ))}
              </ul>
              <span>
                {card.action} <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="features" className="landing-section landing-section--band">
        <div className="landing-section__heading">
          <h2>Built for the modern creative economy</h2>
          <p>We reimagined the freelance marketplace to prioritize speed, trust, and quality.</p>
        </div>
        <div className="landing-feature-grid">
          {featureCards.map((feature) => (
            <article key={feature.title} className="landing-feature">
              <div className={`landing-feature__icon landing-feature__icon--${feature.tone}`}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-stats" aria-label="Createch stats">
        {stats.map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section id="creators" className="landing-cta">
        <h2>Ready to upgrade your workflow?</h2>
        <p>Join the platform where professional creativity happens. Secure, fast, and built for you.</p>
        <Link className="landing-btn" to="/login?mode=signup">Get Started Now</Link>
      </section>
    </main>
  );
};

export default LandingPage;
