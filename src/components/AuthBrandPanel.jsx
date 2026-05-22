import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

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

export default AuthBrandPanel;
