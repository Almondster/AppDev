import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Plus, Search, X } from 'lucide-react';
import { createService, deleteService, fetchMyServices, getUserData, updateService } from '../api';
import { Button } from '../components/Button';

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

  const userData = getUserData();

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const { ok, data } = await fetchMyServices();
      if (ok) setServices(data.results || data || []);
      else showNotification(data?.detail || 'Failed to load services.', 'info');
    } catch {
      showNotification('Cannot connect to server.', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

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

  const handleDelete = async (service) => {
    if (!window.confirm(`Delete "${service.title}"?`)) return;
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
    <section className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-blue-500/90 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">My Gigs ({services.length})</h2>
          <p className="text-sm text-zinc-400">Create, update, and manage the services clients can order.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={showForm ? 'danger' : 'primary'}
            onClick={toggleForm}
            icon={showForm ? <X size={14} /> : <Plus size={14} />}
          >
            {showForm ? 'Close' : 'Create Service'}
          </Button>
        </div>
      </header>

      {showForm && (
        <form className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6 animate-in fade-in duration-300" onSubmit={handleSubmit}>
          <h3 className="text-xl font-medium text-white">{editingId ? 'Edit Service' : 'Create Service'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300" htmlFor="title">Service Title *</label>
              <input className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 placeholder-zinc-600" type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Professional Logo Design" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300" htmlFor="price">Starting Price (PHP)</label>
              <input className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 placeholder-zinc-600" type="number" id="price" name="price" value={formData.price} onChange={handleChange} placeholder="5000" min="1" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300" htmlFor="category">Category</label>
              <select className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20" id="category" name="category" value={formData.category} onChange={handleChange}>
                <option>Design & Creative</option>
                <option>Development & IT</option>
                <option>Digital Marketing</option>
                <option>Music & Audio</option>
                <option>Video & Animation</option>
                <option>Writing & Translation</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300" htmlFor="cover_image">Cover Image</label>
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-lg hover:border-white/20 cursor-pointer transition-colors" htmlFor="cover_image">
                <span className="text-zinc-400 mb-2"><ImagePlus size={18} /></span>
                <span className="text-sm text-zinc-300 mb-1">Upload cover image</span>
                <span className="text-xs text-zinc-500">PNG, JPG, or WebP</span>
              </label>
              <input className="hidden" type="file" id="cover_image" accept="image/*" onChange={handleImageUpload} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-zinc-300" htmlFor="description">Description *</label>
              <textarea className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 placeholder-zinc-600 resize-none" id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe what you offer to clients." rows="4" required />
            </div>
            {formData.image_url && (
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-zinc-300">Cover Preview</label>
                <div className="relative rounded-lg overflow-hidden border border-white/10">
                  <img src={formData.image_url} alt="Selected cover" className="w-full h-48 object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between">
                    <span className="text-sm text-white">Cover selected</span>
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <X size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Service' : 'Create Service'}</button>
            <button className="px-6 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors" type="button" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Search size={14} />
          </span>
          <label htmlFor="gigsSearch" className="sr-only">Search services</label>
          <input
            id="gigsSearch"
            type="text"
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 placeholder-zinc-600"
            placeholder="Search your services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label htmlFor="gigsSort" className="sr-only">Sort services</label>
        <select
          id="gigsSort"
          className="bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Sort: Newest</option>
          <option value="title">Sort: Name</option>
          <option value="price-low">Sort: Price low</option>
          <option value="price-high">Sort: Price high</option>
          <option value="category">Sort: Category</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-zinc-500">Loading services...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleServices.length > 0 ? (
            visibleServices.map((service) => (
              <article key={service.id} className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden hover:bg-white/[0.03] transition-colors">
                <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                  {service.image_url ? (
                    <img src={service.image_url} alt={service.title || 'Service cover'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-zinc-600">
                      <ImagePlus size={22} />
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-medium text-white flex-1 line-clamp-2">{service.title || 'Untitled service'}</h3>
                    <span className="text-sm font-semibold text-emerald-400 whitespace-nowrap">₱{Number(service.price || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{service.category}</p>
                  {service.description && <p className="text-sm text-zinc-400 line-clamp-2">{service.description}</p>}
                </div>
                <div className="px-5 pb-5 flex gap-2">
                  <button className="flex-1 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors" onClick={() => handleEdit(service)}>Edit</button>
                  <button className="flex-1 px-4 py-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 text-sm font-medium transition-colors" onClick={() => handleDelete(service)}>Delete</button>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center py-16">
              <p className="text-zinc-500">{searchTerm ? 'No services match your search.' : 'No services yet. Create your first service to start earning.'}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default MyGigsPage;
