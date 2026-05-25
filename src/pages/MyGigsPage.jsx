import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImagePlus, Plus, Search, X } from 'lucide-react';
import { createService, deleteService, fetchMyServices, updateService } from '../api';
import Button from '../components/Button';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/ProjectsPage.css';
import { readCollection } from '../utils/collections';
import { getCurrentUser } from '../utils/currentUser';

const EMPTY_FORM = {
  title: '',
  category: 'Design & Creative',
  description: '',
  price: '',
  image_url: '',
};

const MyGigsPage = () => {
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, service: null });
  const [deleting, setDeleting] = useState(false);

  const userData = getCurrentUser();

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data } = await fetchMyServices();
      if (ok) setServices(readCollection({ data }));
      else showNotification(data?.detail || 'Failed to load services.', 'info');
    } catch {
      showNotification('Cannot connect to server.', 'info');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const visibleServices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filteredServices = query
      ? services.filter((service) => [
        service.title,
        service.category,
        service.description,
        String(service.price || ''),
      ].some((value) => String(value || '').toLowerCase().includes(query)))
      : services;

    return [...filteredServices].sort((a, b) => {
      if (sortBy === 'title') {
        return String(a.title || '').localeCompare(String(b.title || ''));
      }
      if (sortBy === 'price-low') {
        return Number(a.price || 0) - Number(b.price || 0);
      }
      if (sortBy === 'price-high') {
        return Number(b.price || 0) - Number(a.price || 0);
      }
      if (sortBy === 'category') {
        return String(a.category || '').localeCompare(String(b.category || ''));
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [services, searchTerm, sortBy]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotification('Please select an image file.', 'info');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image_url: String(reader.result || '') }));
    };
    reader.onerror = () => showNotification('Failed to read image file.', 'info');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      creator_id: Number(userData?.firebase_uid || userData?.id || 0),
      title: formData.title.trim(),
      category: formData.category,
      description: formData.description.trim(),
      price: Number(formData.price || 0),
      image_url: formData.image_url.trim() || null,
      is_public: true,
    };

    try {
      const { ok, data } = editingId
        ? await updateService(editingId, payload)
        : await createService(payload);

      if (ok) {
        setServices((prev) => editingId
          ? prev.map((svc) => (svc.id === editingId ? data : svc))
          : [data, ...prev]);
        setFormData(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
        showNotification(editingId ? 'Service updated.' : 'Service created.');
      } else {
        showNotification(data?.detail || 'Failed to save service.', 'info');
      }
    } catch {
      showNotification('Failed to save service.', 'info');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service) => {
    setFormData({
      title: service.title || '',
      category: service.category || 'Design & Creative',
      description: service.description || '',
      price: String(service.price || ''),
      image_url: service.image_url || '',
    });
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    const service = deleteConfirm.service;
    if (!service) return;
    setDeleting(true);
    try {
      const { ok, data } = await deleteService(service.id);
      if (ok) {
        setServices((prev) => prev.filter((svc) => svc.id !== service.id));
        showNotification('Service deleted.', 'info');
      } else {
        showNotification(data?.detail || 'Failed to delete service.', 'info');
      }
    } catch {
      showNotification('Failed to delete service.', 'info');
    }
    setDeleting(false);
    setDeleteConfirm({ open: false, service: null });
  };

  const handleCancel = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const toggleForm = () => {
    if (showForm) {
      handleCancel();
    } else {
      setFormData(EMPTY_FORM);
      setEditingId(null);
      setShowForm(true);
    }
  };

  return (
    <section className="section page-fade">
      {notification && (
        <div className={`notification notification--${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <div className="mygigs-breadcrumb">
          <span className="mygigs-bc-muted">Creator Workspace</span>
          <span className="mygigs-bc-sep">/</span>
          <span className="mygigs-bc-active">My Gigs</span>
      </div>

      <header className="section__header">
        <div>
          <h1 className="section__title" style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>My Gigs ({services.length})</h1>
          <p style={{ color: 'var(--text-muted, #71717a)', margin: '0', fontSize: '0.9rem' }}>Create, update, and manage the services clients can order.</p>
        </div>
      </header>

      {showForm && (
        <form className="form-card page-fade" onSubmit={handleSubmit}>
          <h3 className="form-card__title">{editingId ? 'Edit Service' : 'Create Service'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="title">Service Title *</label>
              <input className="form-input" type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Professional Logo Design" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="price">Starting Price (PHP)</label>
              <input className="form-input" type="number" id="price" name="price" value={formData.price} onChange={handleChange} placeholder="5000" min="1" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="category">Category</label>
              <select className="form-input" id="category" name="category" value={formData.category} onChange={handleChange}>
                <option>Design & Creative</option>
                <option>Development & IT</option>
                <option>Digital Marketing</option>
                <option>Music & Audio</option>
                <option>Video & Animation</option>
                <option>Writing & Translation</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cover_image">Cover Image</label>
              <label className="gig-upload" htmlFor="cover_image">
                <span className="gig-upload__icon"><ImagePlus size={18} /></span>
                <span className="gig-upload__text">Upload cover image</span>
                <span className="gig-upload__hint">PNG, JPG, or WebP</span>
              </label>
              <input className="gig-upload__input" type="file" id="cover_image" accept="image/*" onChange={handleImageUpload} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="description">Description *</label>
              <textarea className="form-input form-textarea" id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe what you offer to clients." rows="4" required />
            </div>
            {formData.image_url && (
              <div className="form-group form-group--full">
                <label className="form-label">Cover Preview</label>
                <div className="gig-cover-preview">
                  <img src={formData.image_url} alt="Selected cover" />
                  <div className="gig-cover-preview__meta">
                    <span>Cover selected</span>
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}>
                      <X size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Service' : 'Create Service'}</button>
            <button className="btn btn--ghost" type="button" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <div className="search-wrapper">
          <span className="search-icon">
            <Search size={14} />
          </span>
          <label htmlFor="gigsSearch" className="sr-only">Search services</label>
          <input
            id="gigsSearch"
            type="text"
            className="search-input"
            placeholder="Search your services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label htmlFor="gigsSort" className="sr-only">Sort services</label>
          <select
            id="gigsSort"
            className="form-input sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Sort: Newest</option>
            <option value="title">Sort: Name</option>
            <option value="price-low">Sort: Price low</option>
            <option value="price-high">Sort: Price high</option>
            <option value="category">Sort: Category</option>
          </select>
          <Button
            variant={showForm ? 'danger' : 'primary'}
            onClick={toggleForm}
            icon={showForm ? <X size={14} /> : <Plus size={14} />}
          >
            {showForm ? 'Close' : 'Create Service'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading services...</p></div>
      ) : (
        <div className="card-grid my-gigs-grid">
          {visibleServices.length > 0 ? (
            visibleServices.map((service) => (
              <article key={service.id} className="my-gig-card">
                <div className="my-gig-card__cover">
                  {service.image_url ? (
                    <img src={service.image_url} alt={service.title || 'Service cover'} />
                  ) : (
                    <div className="my-gig-card__placeholder">
                      <ImagePlus size={22} />
                    </div>
                  )}
                </div>
                <div className="my-gig-card__body">
                  <div className="my-gig-card__top">
                    <h3>{service.title || 'Untitled service'}</h3>
                    <span>PHP {Number(service.price || 0).toLocaleString()}</span>
                  </div>
                  <p className="my-gig-card__category">{service.category}</p>
                  {service.description && <p className="my-gig-card__desc">{service.description}</p>}
                </div>
                <div className="card__actions my-gig-card__actions">
                  <button className="card-action-btn card-action-btn--edit" onClick={() => handleEdit(service)}>Edit</button>
                  <button className="card-action-btn card-action-btn--delete" onClick={() => setDeleteConfirm({ open: true, service })}>Delete</button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <p>{searchTerm ? 'No services match your search.' : 'No services yet. Create your first service to start earning.'}</p>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={deleteConfirm.open}
        title="Delete Service?"
        message={deleteConfirm.service ? <>Are you sure you want to delete <strong>"{deleteConfirm.service.title}"</strong>? This action cannot be undone.</> : ''}
        variant="danger"
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, service: null })}
      />
    </section>
  );
};

export default MyGigsPage;
