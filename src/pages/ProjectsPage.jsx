import { useState } from 'react';
import { useProjects } from '../context/useProjects';
import Card from '../components/Card';
import Button from '../components/Button';

const emptyForm = { title: '', client: '', status: 'Pending', budget: '', deadline: '', description: '' };

const ProjectsPage = ({ userRole = 'creator' }) => {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const [formData, setFormData] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.client.trim()) return;

    if (editingId) {
      updateProject(editingId, formData);
      showNotification('Project updated successfully!');
      setEditingId(null);
    } else {
      addProject(formData);
      showNotification('Project added successfully!');
    }
    setFormData(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (project) => {
    setFormData({ ...project, budget: String(project.budget) });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    deleteProject(id);
    showNotification('Project removed.', 'info');
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const filtered = projects
    .filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = filterStatus === 'all' || p.status.toLowerCase().replace(' ', '-') === filterStatus;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'budget') return b.budget - a.budget;
      if (sortBy === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
      return a.title.localeCompare(b.title);
    });

  return (
    <section className="section page-fade">
      {notification && (
        <div className={`notification notification--${notification.type}`}>
          {notification.message}
        </div>
      )}

      <header className="section__header">
        <h2 className="section__title">Projects ({projects.length})</h2>
        {userRole !== 'client' && (
          <Button variant="primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(emptyForm); }}>
            {showForm ? 'Close' : '+ New Project'}
          </Button>
        )}
      </header>

      {showForm && (
        <form className="form-card page-fade" onSubmit={handleSubmit}>
          <h3 className="form-card__title">{editingId ? 'Edit Project' : 'Add New Project'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="title">Project Title *</label>
              <input className="form-input" type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Enter project title" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="client">Client Name *</label>
              <input className="form-input" type="text" id="client" name="client" value={formData.client} onChange={handleChange} placeholder="Enter client name" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="status">Status</label>
              <select className="form-input" id="status" name="status" value={formData.status} onChange={handleChange}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="budget">Budget (₱)</label>
              <input className="form-input" type="number" id="budget" name="budget" value={formData.budget} onChange={handleChange} placeholder="0" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="deadline">Deadline</label>
              <input className="form-input" type="date" id="deadline" name="deadline" value={formData.deadline} onChange={handleChange} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea className="form-input form-textarea" id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Project description..." rows="3" />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="primary" type="submit">{editingId ? 'Update Project' : 'Add Project'}</Button>
            <Button variant="ghost" type="button" onClick={handleCancel}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <div className="search-wrapper">
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <label htmlFor="projectsSearch" className="sr-only">Search projects</label>
          <input id="projectsSearch" type="text" className="search-input" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="filter-group">
          {['all', 'in-progress', 'pending', 'completed', 'suspended'].map((s) => (
            <button key={s} className={`filter-btn${filterStatus === s ? ' filter-btn--active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'All' : s === 'in-progress' ? 'Active' : s === 'pending' ? 'Pending' : s === 'suspended' ? 'Suspended' : 'Done'}
            </button>
          ))}
        </div>
        <label htmlFor="projectsSort" className="sr-only">Sort projects</label>
        <select id="projectsSort" className="form-input sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="title">Sort: Name</option>
          <option value="budget">Sort: Budget</option>
          <option value="deadline">Sort: Deadline</option>
        </select>
      </div>

      <div className="card-grid">
        {filtered.length > 0 ? (
          filtered.map((project) => (
            <Card key={project.id} title={project.title} status={project.status}>
              <p><strong>Client:</strong> {project.client}</p>

              {userRole === 'admin' ? (
                <>
                  <p><strong>Creator:</strong> {project.creator || 'Unknown'}</p>
                  <p><strong>Raw Budget:</strong> ₱{project.budget.toLocaleString()}</p>
                  <p style={{ color: '#10b981' }}><strong>Platform Fee (15%):</strong> ₱{(project.budget * 0.15).toLocaleString()}</p>
                  {project.adminNote && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <strong style={{ color: '#ef4444' }}>Admin Note:</strong> {project.adminNote}
                    </div>
                  )}
                </>
              ) : (
                <p><strong>Budget:</strong> ₱{project.budget.toLocaleString()}</p>
              )}

              {project.deadline && <p><strong>Deadline:</strong> {project.deadline}</p>}
              {project.description && <p className="card__desc">{project.description}</p>}

              {/* Creator/Admin standard actions */}
              {userRole !== 'client' && (
                <div className="card__actions">
                  <button className="card-action-btn card-action-btn--edit" onClick={() => handleEdit(project)}>Edit</button>
                  <button className="card-action-btn card-action-btn--delete" onClick={() => handleDelete(project.id)}>Delete</button>
                </div>
              )}

              {/* Admin moderation actions */}
              {userRole === 'admin' && (
                <div className="card__actions" style={{ marginTop: '1rem' }}>
                  <button
                    className="card-action-btn card-action-btn--delete"
                    style={{ width: '100%' }}
                    onClick={() => {
                      updateProject(project.id, { status: 'Suspended', adminNote: 'Force suspended by Administrator.' });
                      showNotification(`Project ${project.id} Suspended.`, 'info');
                    }}
                  >
                    Force Suspend Project
                  </button>
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon">📂</span>
            <p>No projects found.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsPage;
