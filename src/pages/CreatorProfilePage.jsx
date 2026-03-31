
import '../styles/CreatorProfilePage.css';

const CreatorProfilePage = () => {
    return (
        <section className="section page-fade">
            <header className="section__header" style={{ alignItems: 'flex-start', borderBottom: `1px solid var(--border-color)`, paddingBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                        👩‍🎨
                    </div>
                    <div>
                        <h2 className="section__title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Jane Doe</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1rem' }}>Senior Web Designer</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className="badge badge--completed">React</span>
                            <span className="badge badge--completed">TailwindCSS</span>
                            <span className="badge badge--completed">Figma</span>
                        </div>
                    </div>
                </div>
                <button className="btn btn--primary">Hire Me</button>
            </header>

            <div className="card-grid" style={{ marginTop: '2rem' }}>
                <div className="card">
                    <h3 className="card__title">About</h3>
                    <div className="card__body">
                        <p>I have over 5 years of experience creating stunning user interfaces for modern web applications. My focus is on robust accessibility and beautiful aesthetics.</p>
                    </div>
                </div>

                <div className="card">
                    <h3 className="card__title">Services</h3>
                    <div className="card__body">
                        <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.8' }}>
                            <li>Wireframing</li>
                            <li>High-fidelity Mockups</li>
                            <li>Interactive Prototypes</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CreatorProfilePage;