import { useState, useCallback, useMemo } from 'react';
import { useProjects } from '../useProjects';
import { useNotification } from './useNotification';

const EMPTY_FORM = { title: '', budget: '', deadline: '', description: '', active: true };

/**
 * Hook for managing project/gig form operations
 * @param {string} type - Either 'service' or 'gig'
 * @returns {Object} Form state and handlers
 */
export const useProjectForm = (type = 'service') => {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { notification, showNotification } = useNotification();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  const handleChange = useCallback((e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const actionMsg = editingId ? 'updated' : 'created';
    if (editingId) {
      updateProject(editingId, formData);
      showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} ${actionMsg} successfully!`);
      setEditingId(null);
    } else {
      addProject(formData);
      showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} ${actionMsg} successfully!`);
    }
    setFormData(EMPTY_FORM);
    setShowForm(false);
  }, [editingId, formData, type, updateProject, addProject, showNotification]);

  const handleEdit = useCallback((project) => {
    setFormData({ ...project, budget: String(project.budget) });
    setEditingId(project.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id) => {
    deleteProject(id);
    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} removed.`, 'info');
  }, [deleteProject, showNotification, type]);

  const handleCancel = useCallback(() => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const toggleForm = useCallback(() => {
    setShowForm((prev) => !prev);
    if (!showForm) {
      setEditingId(null);
      setFormData(EMPTY_FORM);
    }
  }, [showForm]);

  const filtered = useMemo(() => {
    let result = projects;

    // Filter by search
    if (searchTerm) {
      result = result.filter((p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter((p) => {
        if (filterStatus === 'active') return p.active;
        if (filterStatus === 'inactive') return !p.active;
        return true;
      });
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === 'budget') return b.budget - a.budget;
      if (sortBy === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
      return a.title.localeCompare(b.title);
    });
  }, [projects, searchTerm, filterStatus, sortBy]);

  return {
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
  };
};
