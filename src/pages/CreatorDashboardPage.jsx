import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/useProjects';
import { CheckCircle2, Briefcase, Banknote, Search, Filter, Clock } from 'lucide-react';

const CreatorDashboardPage = () => {
    const navigate = useNavigate();
    const { projects, completedProjects, activeProjects, totalRevenue } = useProjects();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const recentProjects = projects.filter((p) => p.status !== 'Completed');

    const filteredProjects = recentProjects.filter((project) => {
        const matchesSearch =
            project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.client.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            filterStatus === 'all' || project.status.toLowerCase().replace(' ', '-') === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            <header className="hero-gradient" style={{ padding: '3rem 2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Creator Hub</h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Manage your services and track your freelance business.</p>
            </header>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer' }} onClick={() => navigate('/projects')}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '1rem', borderRadius: '16px' }}>
                        <CheckCircle2 size={28} />
                    </div>
                    <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Services Completed</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>{completedProjects.length}</p>
                    </div>
                </div>

                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '1rem', borderRadius: '16px' }}>
                        <Briefcase size={28} />
                    </div>
                    <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Projects</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>{activeProjects.length}</p>
                    </div>
                </div>

                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '1rem', borderRadius: '16px' }}>
                        <Banknote size={28} />
                    </div>
                    <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>₱{totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
            </section>

            <section className="glass-card">
                <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Active Orders</h2>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                            <label htmlFor="dashboardSearch" className="sr-only">Search active orders</label>
                            <input
                                id="dashboardSearch"
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px 8px 36px', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                            />
                        </div>
                        <label htmlFor="dashboardFilter" className="sr-only">Filter active orders by status</label>
                        <select
                            id="dashboardFilter"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', appearance: 'none' }}
                        >
                            <option value="all" style={{ color: 'black' }}>All Status</option>
                            <option value="in-progress" style={{ color: 'black' }}>In Progress</option>
                            <option value="pending" style={{ color: 'black' }}>Pending</option>
                        </select>
                    </div>
                </div>

                <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map((project) => (
                            <div key={project.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '4px' }}>{project.title}</h3>
                                    <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Client: {project.client} • ₱{(project.budget || 0).toLocaleString()}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={14} color="#a1a1aa" />
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        background: project.status === 'In Progress' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(250, 204, 21, 0.1)',
                                        color: project.status === 'In Progress' ? '#38bdf8' : '#facc15'
                                    }}>
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#71717a' }}>
                            <Filter size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p>No active orders found.</p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
};

export default CreatorDashboardPage;
