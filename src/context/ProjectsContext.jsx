import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import defaultProjects from '../components/defaultProjects';

const STORAGE_KEY = 'createch_projects';

const loadProjects = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration: if stored data lacks `type` field, clear and reload defaults
      if (parsed.length > 0 && !parsed[0].type) {
        localStorage.removeItem(STORAGE_KEY);
        return defaultProjects;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load projects from localStorage', e);
  }
  return defaultProjects;
};

const ProjectsContext = createContext();

export { ProjectsContext };

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState(loadProjects);

  // Sync to localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  // ── Creator actions ──

  /** Creator publishes a new service (no client assigned) */
  const addService = useCallback((serviceData) => {
    const newService = {
      ...serviceData,
      id: Date.now(),
      type: 'service',
      status: 'Active',
      creator: 'You',
      budget: Number(serviceData.budget),
    };
    setProjects((prev) => [...prev, newService]);
    return newService;
  }, []);

  /** Update any project/service/order */
  const updateProject = useCallback((id, data) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data, budget: data.budget !== undefined ? Number(data.budget) : p.budget } : p))
    );
  }, []);

  /** Delete a project/service */
  const deleteProject = useCallback((id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── Client actions ──

  /** Client hires a creator's service → creates an order from the service */
  const hireCreator = useCallback((serviceId, clientName) => {
    const service = projects.find((p) => p.id === serviceId && p.type === 'service');
    if (!service) return null;

    const newOrder = {
      ...service,
      id: Date.now(),
      type: 'order',
      status: 'Pending',
      clientName,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
    };

    setProjects((prev) => [...prev, newOrder]);
    return newOrder;
  }, [projects]);

  // ── Derived data ──

  const services = useMemo(() => projects.filter((p) => p.type === 'service'), [projects]);
  const orders = useMemo(() => projects.filter((p) => p.type === 'order'), [projects]);
  const completedProjects = useMemo(() => orders.filter((p) => p.status === 'Completed'), [orders]);
  const activeProjects = useMemo(() => orders.filter((p) => p.status === 'In Progress'), [orders]);
  const pendingProjects = useMemo(() => orders.filter((p) => p.status === 'Pending'), [orders]);
  const totalRevenue = useMemo(() => completedProjects.reduce((sum, p) => sum + (p.budget || 0), 0), [completedProjects]);

  const contextValue = useMemo(() => ({
    projects,
    services,
    orders,
    addService,
    updateProject,
    deleteProject,
    hireCreator,
    completedProjects,
    activeProjects,
    pendingProjects,
    totalRevenue,
  }), [projects, services, orders, addService, updateProject, deleteProject, hireCreator, completedProjects, activeProjects, pendingProjects, totalRevenue]);

  return (
    <ProjectsContext.Provider value={contextValue}>
      {children}
    </ProjectsContext.Provider>
  );
};
