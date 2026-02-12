
const Dashboard = () => {
    // Mock Data
    const stats = [
        { id: 1, label: 'Total Creators', value: 1250 },
        { id: 2, label: 'Active Projects', value: 45 },
        { id: 3, label: 'Revenue', value: '$24,500' },
    ];

    const recentProjects = [
        { id: 1, title: 'Logo Design for EcoBrand', client: 'GreenCo', status: 'In Progress', budget: '$500' },
        { id: 2, title: 'Website Redesign', client: 'TechStart', status: 'Completed', budget: '$1200' },
        { id: 3, title: 'Social Media Campaign', client: 'FashionHub', status: 'Pending', budget: '$800' },
    ];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Createch Dashboard</h1>
                <nav>
                    <ul>
                        <li><a href="#overview">Overview</a></li>
                        <li><a href="#projects">Projects</a></li>
                        <li><a href="#creators">Creators</a></li>
                        <li><a href="#settings">Settings</a></li>
                    </ul>
                </nav>
            </header>

            <main>
                {/* Stats Section */}
                <section className="stats-grid">
                    {stats.map((stat) => (
                        <article key={stat.id} className="stat-card">
                            <h3>{stat.label}</h3>
                            <p>{stat.value}</p>
                        </article>
                    ))}
                </section>

                {/* Recent Projects Section */}
                <section className="projects-section">
                    <h2>Recent Projects</h2>
                    <div className="projects-list">
                        {recentProjects.map((project) => (
                            <article key={project.id} className="project-card">
                                <div className="project-header">
                                    <h3>{project.title}</h3>
                                    <span className={`status ${project.status.toLowerCase().replace(' ', '-')}`}>
                                        {project.status}
                                    </span>
                                </div>
                                <p><strong>Client:</strong> {project.client}</p>
                                <p><strong>Budget:</strong> {project.budget}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </main>

            <footer>
                <p>&copy; 2026 Createch Platform. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Dashboard;
