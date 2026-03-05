import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProjectsContext } from '../contexts/ProjectsContext';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { DEFAULT_PROJECTS } from '../utils/defaults';

const STORAGE_KEY = 'createch_projects';

const loadProjects = () => loadFromStorage(STORAGE_KEY, DEFAULT_PROJECTS);

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState(loadProjects);

  useEffect(() => {
    saveToStorage(STORAGE_KEY, projects);
  }, [projects]);

  const addProject = useCallback((project) => {
    const newProject = { ...project, id: Date.now(), budget: Number(project.budget) };
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  }, []);

  const updateProject = useCallback((id, data) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data, budget: data.budget !== undefined ? Number(data.budget) : p.budget } : p))
    );
  }, []);

  const deleteProject = useCallback((id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const completedProjects = useMemo(() => projects.filter((p) => p.status === 'Completed'), [projects]);
  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'In Progress'), [projects]);
  const pendingProjects = useMemo(() => projects.filter((p) => p.status === 'Pending'), [projects]);
  const totalRevenue = useMemo(() => completedProjects.reduce((sum, p) => sum + (p.budget || 0), 0), [completedProjects]);

  const contextValue = useMemo(() => ({
    projects,
    addProject,
    updateProject,
    deleteProject,
    completedProjects,
    activeProjects,
    pendingProjects,
    totalRevenue,
  }), [projects, addProject, updateProject, deleteProject, completedProjects, activeProjects, pendingProjects, totalRevenue]);

  return (
    <ProjectsContext.Provider value={contextValue}>
      {children}
    </ProjectsContext.Provider>
  );
};
