import { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  fetchOrders as apiFetchOrders,
  fetchServices as apiFetchServices,
  createService as apiCreateService,
  updateService as apiUpdateService,
  deleteService as apiDeleteService,
  createOrder as apiCreateOrder,
  updateOrder as apiUpdateOrder,
  invalidateCache,
} from '../services/api';

const ProjectsContext = createContext();

export { ProjectsContext };

export const ProjectsProvider = ({ children, userRole, firebaseUid }) => {
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);           // prevents stale updates

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Fetch data from backend with stale-request protection ──
  const refreshData = useCallback(async (opts = {}) => {
    if (!firebaseUid) return;

    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // Parallel fetch — services + orders at the same time
      const servicesParams = userRole === 'creator' ? { creator_id: firebaseUid } : {};
      const orderParams = userRole === 'admin' ? {} :
        userRole === 'creator' ? { creator_id: firebaseUid } :
        { client_id: firebaseUid };

      const [svcData, ordData] = await Promise.all([
        apiFetchServices(servicesParams),
        apiFetchOrders(orderParams),
      ]);

      // Stale guard: only apply if this is still the latest request
      if (fetchId !== fetchIdRef.current || !mountedRef.current) return;

      setServices((svcData?.results || svcData || []).map(s => ({
        ...s,
        type: 'service',
        title: s.title || s.label,
        budget: parseFloat(s.price) || 0,
        creator: s.creator_display_name || s.creator_name || s.creator_id,
        status: s.is_deleted ? 'Deleted' : 'Active',
        description: s.description || '',
      })));

      setOrders((ordData?.results || ordData || []).map(o => ({
        ...o,
        type: 'order',
        title: o.service_title,
        budget: parseFloat(o.price) || 0,
        creator: o.creator_display_name || o.creator_name || o.creator_id,
        clientName: o.client_display_name || o.client_name || o.client_id,
        deadline: o.due_date ? new Date(o.due_date).toISOString().split('T')[0] : null,
        status: formatStatus(o.status),
      })));

    } catch (err) {
      if (fetchId !== fetchIdRef.current || !mountedRef.current) return;
      setError(err.message);
      console.error('Failed to fetch project data:', err);
    } finally {
      if (fetchId === fetchIdRef.current && mountedRef.current) {
        setLoading(false);
      }
    }
  }, [firebaseUid, userRole]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ── Creator actions with optimistic updates ──

  const addService = useCallback(async (serviceData) => {
    const created = await apiCreateService({
      creator_id: firebaseUid,
      title: serviceData.title,
      label: serviceData.title,
      description: serviceData.description,
      price: String(serviceData.budget || 'Negotiable'),
      category: serviceData.category || '',
      is_public: true,
    });

    // Optimistic: add without full refetch, then bg-refresh
    if (mountedRef.current) {
      setServices(prev => [...prev, {
        ...created,
        type: 'service',
        title: created.title || created.label,
        budget: parseFloat(created.price) || 0,
        creator: firebaseUid,
        status: 'Active',
      }]);
    }

    // Background refresh for accurate data
    invalidateCache('/services/');
    refreshData();
    return created;
  }, [firebaseUid, refreshData]);

  const updateProject = useCallback(async (id, data) => {
    const isOrder = orders.some(o => o.id === id);
    if (isOrder) {
      await apiUpdateOrder(id, {
        ...data,
        price: data.budget !== undefined ? String(data.budget) : undefined,
      });
      invalidateCache('/orders/');
    } else {
      await apiUpdateService(id, {
        ...data,
        price: data.budget !== undefined ? String(data.budget) : undefined,
      });
      invalidateCache('/services/');
    }
    refreshData();
  }, [orders, refreshData]);

  const deleteProject = useCallback(async (id) => {
    await apiDeleteService(id);

    // Optimistic removal
    if (mountedRef.current) {
      setServices(prev => prev.filter(s => s.id !== id));
    }
    invalidateCache('/services/');
  }, []);

  // ── Client actions ──

  const hireCreator = useCallback(async (serviceId, clientName) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return null;

    const created = await apiCreateOrder({
      client_id: firebaseUid,
      creator_id: service.creator_id,
      service_title: service.title || service.label,
      price: service.price || 'Negotiable',
      status: 'pending',
      client_name: clientName,
    });

    // Optimistic add
    if (mountedRef.current) {
      setOrders(prev => [...prev, {
        ...created,
        type: 'order',
        title: created.service_title || service.title,
        budget: parseFloat(created.price) || 0,
        creator: service.creator,
        clientName: clientName,
        status: 'Pending',
      }]);
    }

    invalidateCache('/orders/');
    refreshData();
    return created;
  }, [services, firebaseUid, refreshData]);

  // ── Derived data (memoized) ──

  const completedProjects = useMemo(() => orders.filter((p) => p.status === 'Completed'), [orders]);
  const activeProjects = useMemo(() => orders.filter((p) => p.status === 'In Progress'), [orders]);
  const pendingProjects = useMemo(() => orders.filter((p) => p.status === 'Pending'), [orders]);
  const totalRevenue = useMemo(() => completedProjects.reduce((sum, p) => sum + (p.budget || 0), 0), [completedProjects]);

  const contextValue = useMemo(() => ({
    projects: [...services, ...orders],
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
    loading,
    error,
    refreshData,
  }), [services, orders, addService, updateProject, deleteProject, hireCreator, completedProjects, activeProjects, pendingProjects, totalRevenue, loading, error, refreshData]);

  return (
    <ProjectsContext.Provider value={contextValue}>
      {children}
    </ProjectsContext.Provider>
  );
};

/** Normalize backend status strings to display-friendly format */
function formatStatus(status) {
  if (!status) return 'Pending';
  const map = {
    'pending': 'Pending',
    'accepted': 'In Progress',
    'in_progress': 'In Progress',
    'active': 'In Progress',
    'delivered': 'Delivered',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'disputed': 'Disputed',
    'suspended': 'Suspended',
  };
  return map[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
}
