import { useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/app-context.js';
import { api } from '../../lib/api.js';
import { getCachedProjects, setCachedProjects } from '../../lib/cache.js';
import type { Project } from '../../types/index.js';

/**
 * Hook to fetch and manage projects data
 * Uses cache for instant startup, refreshes in background
 */
export function useProjects() {
  const { projects, setProjects, setLoading, setError, setActiveProject, activeProject } = useAppContext();

  // Use ref to access activeProject without adding it as dependency
  // This prevents infinite loops when activeProject changes
  const activeProjectRef = useRef(activeProject);
  activeProjectRef.current = activeProject;

  const loadProjects = useCallback(async (useCache = true, silent = false) => {
    const currentActiveProject = activeProjectRef.current;

    // Try cache first for instant display
    if (useCache) {
      const cached = getCachedProjects();
      if (cached && cached.length > 0) {
        setProjects(cached);
        if (cached.length > 0 && !currentActiveProject) {
          setActiveProject(cached[0]);
        }
      }
    }

    // Fetch fresh data (only show loading on initial load, not silent refresh)
    if (!silent) {
      setLoading(true);
    }
    try {
      const data = await api.get<Project[]>('/project.all');
      setProjects(data);
      setCachedProjects(data);

      // Auto-select first project if none selected
      // During refresh, preserve current selection if it still exists
      if (data.length > 0) {
        const latestActiveProject = activeProjectRef.current;
        if (!latestActiveProject) {
          // No project selected, select first one
          setActiveProject(data[0]);
        } else {
          // Project already selected, update to fresh data if it still exists
          const updatedProject = data.find(p => p.projectId === latestActiveProject.projectId);
          if (updatedProject) {
            setActiveProject(updatedProject);
          } else {
            // Selected project no longer exists, select first one
            setActiveProject(data[0]);
          }
        }
      }
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
      return [];
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [setProjects, setLoading, setError, setActiveProject]);

  // Load on mount (with cache)
  useEffect(() => {
    loadProjects(true, false);
  }, [loadProjects]);

  // Force refresh (skip cache, silent - no loading indicator)
  const refresh = useCallback(() => loadProjects(false, true), [loadProjects]);

  return {
    projects,
    refresh,
  };
}
