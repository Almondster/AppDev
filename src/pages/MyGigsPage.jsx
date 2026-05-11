import { useEffect, useMemo, useState } from 'react';
import { Briefcase, ImagePlus, Plus, Search, X, Edit2, Trash2 } from 'lucide-react';
import { createService, deleteService, fetchMyServices, getUserData, updateService } from '../api';

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
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const userData = getUserData();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const { ok, data } = await fetchMyServices();
      if (ok) {
        const servicesList = data.results || data || [];
        setServices(servicesList);
      } else {
        showToast(data?.detail || 'Failed to load services.', 'error');
      }
    } catch (err) {
      console.error('Failed to load services:', err);
      showToast('Cannot connect to server.', 'error');
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
      showToast('Please select an image file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image_url: String(reader.result || '') }));
    };
    reader.onerror = () => showToast('Failed to read image file.', 'error');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      creator_id: Number(userData?.id || userData?.firebase_uid || 0),
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
        showToast(editingId ? 'Service updated successfully!' : 'Service created successfully!');
      } else {
        showToast(data?.detail || 'Failed to save service.', 'error');
      }
    } catch (err) {
      console.error('Failed to save service:', err);
      showToast('Failed to save service.', 'error');
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
    if (!window.confirm(`Are you sure you want to delete "${service.title}"? This action cannot be undone.`)) return;
    try {
      const { ok, data } = await deleteService(service.id);
      if (ok) {
        setServices((prev) => prev.filter((svc) => svc.id !== service.id));
        showToast('Service deleted successfully.');
      } else {
        showToast(data?.detail || 'Failed to delete service.', 'error');
      }
    } catch (err) {
      console.error('Failed to delete service:', err);
      showToast('Failed to delete service.', 'error');
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
    <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg backdrop-blur-md shadow-lg ${
          toast.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          <p className="text-sm">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Briefcase size={22} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">My Gigs</h1>
              <p className="text-zinc-400 text-sm mt-1">Manage your service offerings</p>
            </div>
          </div>
          <button
            onClick={toggleForm}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
              showForm 
                ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20' 
                : 'bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
            }`}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Create Service'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Gigs</p>
          <p className="text-2xl font-bold text-white">{services.length}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">{services.filter(s => s.is_public).length}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Categories</p>
          <p className="text-2xl font-bold text-blue-400">{new Set(services.map(s => s.category)).size}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Avg Price</p>
          <p className="text-2xl font-bold text-purple-400">
            ₱{services.length > 0 ? Math.round(services.reduce((sum, s) => sum + (s.price || 0), 0) / services.length).toLocaleString() : 0}
          </p>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6" onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold text-white">{editingId ? 'Edit Service' : 'Create New Service'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300" htmlFor="title">Service Title *</label>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/20" 
                type="text" 
                id="title" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="e.g., Professional Logo Design" 
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300" htmlFor="price">Starting Price (₱) *</label>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/20" 
                type="number" 
                id="price" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                placeholder="5000" 
                min="1" 
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300" htmlFor="category">Category *</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white/20" 
                id="category" 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
              >
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
              <label 
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-lg hover:border-white/20 cursor-pointer transition-colors" 
                htmlFor="cover_image"
              >
                <ImagePlus size={24} className="text-zinc-500 mb-2" />
                <span className="text-sm text-zinc-400">Upload cover image</span>
                <span className="text-xs text-zinc-600 mt-1">PNG, JPG, or WebP</span>
              </label>
              <input className="hidden" type="file" id="cover_image" accept="image/*" onChange={handleImageUpload} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-zinc-300" htmlFor="description">Description *</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 resize-none" 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Describe what you offer to clients..." 
                rows="4" 
                required 
              />
            </div>

            {formData.image_url && (
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-zinc-300">Cover Preview</label>
                <div className="relative rounded-lg overflow-hidden border border-white/10">
                  <img src={formData.image_url} alt="Selected cover" className="w-full h-48 object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))} 
                    className="absolute top-3 right-3 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              className="px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              type="submit" 
              disabled={saving}
            >
              {saving ? 'Saving...' : editingId ? 'Update Service' : 'Create Service'}
            </button>
            <button 
              className="px-6 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-white font-medium transition-colors" 
              type="button" 
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
            placeholder="Search your services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:border-white/20"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Newest First</option>
          <option value="title">Name (A-Z)</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="category">Category</option>
        </select>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-500">Loading your services...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleServices.length > 0 ? (
            visibleServices.map((service) => (
              <div key={service.id} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:bg-white/[0.03] transition-all group">
                <div className="aspect-video bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                  {service.image_url ? (
                    <img src={service.image_url} alt={service.title || 'Service cover'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="text-zinc-700">
                      <ImagePlus size={32} />
                    </div>
                  )}
                </div>
                
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-white flex-1 line-clamp-2">{service.title || 'Untitled service'}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {service.category}
                    </span>
                    <span className="text-lg font-bold text-purple-400">₱{Number(service.price || 0).toLocaleString()}</span>
                  </div>
                  
                  {service.description && (
                    <p className="text-sm text-zinc-400 line-clamp-2">{service.description}</p>
                  )}
                </div>
                
                <div className="px-5 pb-5 flex gap-2">
                  <button 
                    className="flex-1 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2" 
                    onClick={() => handleEdit(service)}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button 
                    className="flex-1 px-4 py-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 text-sm font-medium transition-colors flex items-center justify-center gap-2" 
                    onClick={() => handleDelete(service)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Briefcase size={32} className="text-purple-400" />
              </div>
              <p className="text-zinc-400 text-lg mb-2">
                {searchTerm ? 'No services match your search' : 'No services yet'}
              </p>
              <p className="text-zinc-600 text-sm">
                {searchTerm ? 'Try a different search term' : 'Create your first service to start earning'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyGigsPage;
