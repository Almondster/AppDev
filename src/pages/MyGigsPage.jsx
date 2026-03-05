import { useProjectForm } from '../context/hooks/useProjectForm';
import Card from '../components/Card';
import Button from '../components/Button';
import '../styles/ProjectsPage.css';

const MyGigsPage = ({ userRole = 'creator' }) => {
  const {
    projects,
    formData,
    showForm,
    editingId,
    searchTerm,
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
    setSortBy,
    showNotification,
  } = useProjectForm('gig');

  return (
    <section className="section page-fade">
      {notification && (
        <div className={`notification notification--${notification.type}`}>
          {notification.message}
        </div>
      )}

      <header className="section__header">
        <h2 className="section__title">My Services ({projects.length})</h2>
        <Button variant="primary" onClick={toggleForm}>
          {showForm ? 'Close' : '+ Create New Service'}
        </Button>
      </header>

      {showForm && (
        <form className="form-card page-fade" onSubmit={handleSubmit}>
          <h3 className="form-card__title">{editingId ? 'Edit Service' : 'Create New Service'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="title">Service Title *</label>
              <input className="form-input" type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Professional Logo Design, Website Development" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="budget">Starting Price (₱)</label>
              <input className="form-input" type="number" id="budget" name="budget" value={formData.budget} onChange={handleChange} placeholder="0" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="deadline">Delivery Estimate (days)</label>
              <input className="form-input" type="number" id="deadline" name="deadline" value={formData.deadline} onChange={handleChange} placeholder="e.g., 2, 3, 7" min="1" />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="description">Service Description</label>
              <textarea className="form-input form-textarea" id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe what you offer to potential clients..." rows="3" />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="primary" type="submit">{editingId ? 'Update Service' : 'Create Service'}</Button>
            <Button variant="ghost" type="button" onClick={handleCancel}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <div className="search-wrapper">
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <label htmlFor="gigsSearch" className="sr-only">Search services</label>
          <input id="gigsSearch" type="text" className="search-input" placeholder="Search your services..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <label htmlFor="gigsSort" className="sr-only">Sort services</label>
        <select id="gigsSort" className="form-input sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="title">Sort: Name</option>
          <option value="budget">Sort: Price</option>
          <option value="deadline">Sort: Delivery</option>
        </select>
      </div>

      <div className="card-grid">
        {filtered.length > 0 ? (
          filtered.map((project) => (
            <Card key={project.id} title={project.title}>
              <p><strong>Starting Price:</strong> ₱{project.budget.toLocaleString()}</p>

              {project.deadline && <p><strong>Delivery Estimate:</strong> {project.deadline}</p>}
              {project.description && <p className="card__desc">{project.description}</p>}

              <div className="card__actions">
                <button className="card-action-btn card-action-btn--edit" onClick={() => handleEdit(project)}>Edit</button>
                <button className="card-action-btn card-action-btn--delete" onClick={() => handleDelete(project.id)}>Delete</button>
              </div>
            </Card>
          ))
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon">🎯</span>
            <p>No services yet. Create your first service to start earning!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default MyGigsPage;
