import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useNotification } from '../hooks/useNotification';
import Card from '../components/Card';
import Button from '../components/Button';
import '../styles/ProjectsPage.css';

const emptyForm = { title: '', status: 'Active', budget: '', description: '' };

const ProjectsPage = ({ userRole = 'creator' }) => {
  const { projects, services, orders, addService, updateProject, deleteProject } = useProjects();
  const [formData, setFormData] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const { notification, showNotification } = useNotification();

  // Determine which items to show based on role
  const getVisibleItems = () => {
    if (userRole === 'creator') {
      // Creator sees their own published services + orders assigned to them
      return projects.filter(p => p.creator === 'You');
    }
    if (userRole === 'client') {
      // Client sees orders where they are the client
      return orders.filter(p => p.clientName);
    }
    // Admin sees everything
    return projects;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingId) {
      updateProject(editingId, formData);
      showNotification('Service updated successfully!');
      setEditingId(null);
    } else {
      addService(formData);
      showNotification('Service published to marketplace!');
    }
    setFormData(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (project) => {
    setFormData({
      title: project.title,
      status: project.status,
      budget: String(project.budget),
      description: project.description || '',
    });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    deleteProject(id);
    showNotification('Item removed.', 'info');
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const filtered = getVisibleItems()
    .filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.creator || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = filterStatus === 'all' || p.status.toLowerCase().replace(' ', '-') === filterStatus;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'budget') return b.budget - a.budget;
      if (sortBy === 'deadline') return new Date(a.deadline || 0) - new Date(b.deadline || 0);
      return a.title.localeCompare(b.title);
    });

  // Different filter options per role
  const filterOptions = userRole === 'creator'
    ? ['all', 'active', 'in-progress', 'pending', 'completed', 'suspended']
    : ['all', 'in-progress', 'pending', 'completed'];
  const filterLabels = { all: 'All', active: 'Active', 'in-progress': 'In Progress', pending: 'Pending', completed: 'Done', suspended: 'Suspended' };

  const pageTitle = userRole === 'creator' ? 'My Gigs' : userRole === 'client' ? 'My Orders' : 'All Projects';

  return (
    <section className="section page-fade">
      {notification && (
        <div className={`notification notification--${notification.type}`}>
          {notification.message}
        </div>
      )}

      <header className="section__header">
        <h2 className="section__title">{pageTitle} ({filtered.length})</h2>
        {(userRole === 'creator' || userRole === 'admin') && (
          <Button variant="primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(emptyForm); }}>
            {showForm ? 'Close' : userRole === 'admin' ? '+ Add Item' : '+ New Service'}
          </Button>
        )}
      </header>

      {/* Edit/Create form — available to creator and admin */}
      {showForm && (userRole === 'creator' || userRole === 'admin') && (
        <form className="form-card page-fade" onSubmit={handleSubmit}>
          <h3 className="form-card__title">{editingId ? 'Edit Item' : userRole === 'admin' ? 'Add New Item' : 'Publish New Service'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="title">Title *</label>
              <input className="form-input" type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Logo Design, Website Development" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="budget">Price (₱)</label>
              <input className="form-input" type="number" id="budget" name="budget" value={formData.budget} onChange={handleChange} placeholder="0" min="0" />
            </div>
            {userRole === 'admin' && (
              <div className="form-group">
                <label className="form-label" htmlFor="status">Status</label>
                <select className="form-input" id="status" name="status" value={formData.status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            )}
            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea className="form-input form-textarea" id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe what this service includes..." rows="3" />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="primary" type="submit">{editingId ? 'Save Changes' : userRole === 'admin' ? 'Add Item' : 'Publish Service'}</Button>
            <Button variant="ghost" type="button" onClick={handleCancel}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <div className="search-wrapper">
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <label htmlFor="projectsSearch" className="sr-only">Search</label>
          <input id="projectsSearch" type="text" className="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="filter-group">
          {filterOptions.map((s) => (
            <button key={s} className={`filter-btn${filterStatus === s ? ' filter-btn--active' : ''}`} onClick={() => setFilterStatus(s)}>
              {filterLabels[s] || s}
            </button>
          ))}
        </div>
        <label htmlFor="projectsSort" className="sr-only">Sort</label>
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
              {/* Published service badge */}
              {project.type === 'service' && (
                <p style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
                  📢 Published Service
                </p>
              )}

              {/* Client shown only on hired orders */}
              {project.type === 'order' && project.clientName && (
                <p><strong>Client:</strong> {project.clientName}</p>
              )}

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
                <p><strong>{project.type === 'service' ? 'Price' : 'Budget'}:</strong> ₱{project.budget.toLocaleString()}</p>
              )}

              {project.deadline && <p><strong>Deadline:</strong> {project.deadline}</p>}
              {project.description && <p className="card__desc">{project.description}</p>}

              {/* Creator can edit/delete their own items */}
              {userRole === 'creator' && (
                <div className="card__actions">
                  <button className="card-action-btn card-action-btn--edit" onClick={() => handleEdit(project)}>Edit</button>
                  <button className="card-action-btn card-action-btn--delete" onClick={() => handleDelete(project.id)}>Delete</button>
                </div>
              )}

              {/* Admin moderation */}
              {userRole === 'admin' && (
                <div className="card__actions" style={{ marginTop: '1rem' }}>
                  <button className="card-action-btn card-action-btn--edit" onClick={() => handleEdit(project)}>Edit</button>
                  <button className="card-action-btn card-action-btn--delete" onClick={() => handleDelete(project.id)}>Delete</button>
                  {project.status !== 'Suspended' && (
                    <button
                      className="card-action-btn card-action-btn--delete"
                      onClick={() => {
                        updateProject(project.id, { status: 'Suspended', adminNote: 'Force suspended by Administrator.' });
                        showNotification(`Project ${project.id} Suspended.`, 'info');
                      }}
                    >
                      Suspend
                    </button>
                  )}
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
