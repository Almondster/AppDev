import React from 'react';

const LandingPage = () => {
    return (
        <section className="section page-fade" style={{ textAlign: 'center', paddingTop: '4rem' }}>
            <header>
                <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '1rem' }}>Welcome to CREATECH</h1>
                <p style={{ color: '#a1a1aa', fontSize: '1.2rem', marginBottom: '2rem' }}>
                    Connect with top creators. Bring your projects to life.
                </p>
            </header>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <a href="/login" className="btn btn--primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>Get Started</a>
            </div>

            <div className="stats-grid" style={{ marginTop: '4rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card" style={{ flexDirection: 'column', textAlign: 'center', padding: '2rem' }}>
                    <div className="stat-card__icon" style={{ margin: '0 auto 1rem auto', width: '60px', height: '60px', fontSize: '2rem' }}>🎨</div>
                    <span className="stat-card__title" style={{ color: '#fff', fontWeight: '600' }}>For Creators</span>
                    <p style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '0.5rem' }}>Showcase your portfolio and find clients worldwide.</p>
                </div>
                <div className="stat-card" style={{ flexDirection: 'column', textAlign: 'center', padding: '2rem' }}>
                    <div className="stat-card__icon" style={{ margin: '0 auto 1rem auto', width: '60px', height: '60px', fontSize: '2rem' }}>🤝</div>
                    <span className="stat-card__title" style={{ color: '#fff', fontWeight: '600' }}>For Clients</span>
                    <p style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '0.5rem' }}>Hire vetted professionals for your next big idea.</p>
                </div>
                <div className="stat-card" style={{ flexDirection: 'column', textAlign: 'center', padding: '2rem' }}>
                    <div className="stat-card__icon" style={{ margin: '0 auto 1rem auto', width: '60px', height: '60px', fontSize: '2rem' }}>🛡️</div>
                    <span className="stat-card__title" style={{ color: '#fff', fontWeight: '600' }}>Secure Escrow</span>
                    <p style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '0.5rem' }}>Your payments are protected until the job is done.</p>
                </div>
            </div>
        </section>
    );
};

export default LandingPage;
