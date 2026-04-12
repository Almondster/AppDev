import { createContext, useState, useEffect, useCallback } from 'react';
import { fetchMyOrders as apiFetchOrders, fetchMyCreatorOrders, fetchMyServices as apiFetchMyServices, getUserData } from '../api';

const ProjectsContext = createContext();

export { ProjectsContext };

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders and map them to the project shape
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const userData = getUserData();
      const role = userData?.role || 'client';
      const ordersFetcher = role === 'creator' ? fetchMyCreatorOrders : apiFetchOrders;
      const [ordersRes, servicesRes] = await Promise.all([
        ordersFetcher(),
        role === 'creator' ? apiFetchMyServices() : Promise.resolve({ ok: true, data: [] }),
      ]);

      const items = [];

      // Map orders to project-like objects
      if (ordersRes.ok) {
        const orders = ordersRes.data.results || ordersRes.data || [];
        orders.forEach((o) => {
          items.push({
            id: o.id,
            title: o.service_title || `Order #${o.id}`,
            creator: o.creator_display_name || o.creator_name || o.creator_id || 'Unknown',
            client: o.client_display_name || o.client_name || o.client_id || 'Unknown',
            status: mapStatus(o.status),
            budget: parseFloat(o.price) || 0,
            deadline: o.due_date ? o.due_date.split('T')[0] : '',
            description: o.service_title || '',
            _type: 'order',
          });
        });
      }

      // Only show services for creators (their own services)
      if (role === 'creator' && servicesRes.ok) {
        const services = servicesRes.data.results || servicesRes.data || [];
        services.forEach((s) => {
          items.push({
            id: `svc-${s.id}`,
            title: s.title || s.label,
            creator: s.creator_id || 'Unknown',
            client: '—',
            status: s.is_public ? 'Active' : 'Pending',
            budget: parseFloat(s.price) || 0,
            deadline: '',
            description: s.description || s.label || '',
            _type: 'service',
          });
        });
      }

      setProjects(items);
    } catch (err) {
      console.error('Failed to load projects from API:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // CRUD wrappers (local state for now; can wire to API later)
  const addProject = (project) => {
    const newProject = { ...project, id: Date.now(), budget: Number(project.budget) };
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  };

  const updateProject = (id, data) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data, budget: Number(data.budget) } : p))
    );
  };

  const deleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // Derived data
  const completedProjects = projects.filter((p) => p.status === 'Completed');
  const activeProjects = projects.filter((p) => p.status === 'In Progress');
  const pendingProjects = projects.filter((p) => p.status === 'Pending');
  const totalRevenue = completedProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <ProjectsContext.Provider value={{
      projects,
      addProject,
      updateProject,
      deleteProject,
      completedProjects,
      activeProjects,
      pendingProjects,
      totalRevenue,
      loading,
      refresh: loadProjects,
    }}>
      {children}
    </ProjectsContext.Provider>
  );
};

// Map API statuses to the UI status labels
function mapStatus(apiStatus) {
  const map = {
    pending: 'Pending',
    accepted: 'In Progress',
    in_progress: 'In Progress',
    delivered: 'In Progress',
    completed: 'Completed',
    cancelled: 'Suspended',
    rejected: 'Suspended',
    refunded: 'Suspended',
  };
  return map[apiStatus] || apiStatus || 'Pending';
}
