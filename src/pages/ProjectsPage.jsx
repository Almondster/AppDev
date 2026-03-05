import { useProjectForm } from '../context/hooks/useProjectForm';
import Card from '../components/Card';
import Button from '../components/Button';
import '../styles/ProjectsPage.css';

const ProjectsPage = ({ userRole = 'creator' }) => {
  const {
    projects,
    formData,
    showForm,
    editingId,
    searchTerm,
    filterStatus,
    sortBy,
    notification,
    filtered,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleCancel,
    toggleForm,
    setSearchTerm,
    setFilterStatus,
    setSortBy,
    updateProject,
    showNotification,
  } = useProjectForm('service');

  return (
    <section className="section page-fade">
      {notification && (
        <div className={`notification notification--${notification.type}`}>
          {notification.message}
        </div>
      )}

      <header className="section__header">
        <h2 className="section__title">My Services ({projects.length})</h2>
        {userRole !== 'client' && (
          <Button variant="primary" onClick={toggleForm}>
            {showForm ? 'Close' : '+ New Service'}
          </Button>
        )}
      </header>

      {showForm && (
        <form className="form-card page-fade" onSubmit={handleSubmit}>
          <h3 className="form-card__title">{editingId ? 'Edit Service' : 'Add New Service'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="title">Service Title *</label>
              <input className="form-input" type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Enter service title (e.g., Logo Design)" required />
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
            <Button variant="primary" type="submit">{editingId ? 'Update Service' : 'Add Service'}</Button>
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
          {['all', 'active', 'inactive'].map((s) => (
            <button key={s} className={`filter-btn${filterStatus === s ? ' filter-btn--active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Inactive'}
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
            <Card key={project.id} title={project.title}>
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
                      updateProject(project.id, { active: !project.active });
                      showNotification(`Service ${project.active ? 'deactivated' : 'activated'}.`, 'info');
                    }}
                  >
                    {project.active ? 'Deactivate Service' : 'Activate Service'}
                  </button>
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon">📂</span>
            <p>No services found.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsPage;
