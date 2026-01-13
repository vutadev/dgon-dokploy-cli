import { useEffect, useCallback } from 'react';
import { useAppContext } from '../context/app-context.js';
import { api } from '../../lib/api.js';
import { getCachedProjects, setCachedProjects } from '../../lib/cache.js';
import type { Project } from '../../types/index.js';

/**
 * Hook to fetch and manage projects data
 * Uses cache for instant startup, refreshes in background
 */
export function useProjects() {
  const { projects, setProjects, setLoading, setError, setActiveProject } = useAppContext();

  const loadProjects = useCallback(async (useCache = true) => {
    // Try cache first for instant display
    if (useCache) {
      const cached = getCachedProjects();
      if (cached && cached.length > 0) {
        setProjects(cached);
        if (cached.length > 0) {
          setActiveProject(cached[0]);
        }
      }
    }

    // Fetch fresh data
    setLoading(true);
    try {
      const data = await api.get<Project[]>('/project.all');
      setProjects(data);
      setCachedProjects(data);

      // Auto-select first project if none selected
      if (data.length > 0) {
        setActiveProject(data[0]);
      }
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading, setError, setActiveProject]);

  // Load on mount (with cache)
  useEffect(() => {
    loadProjects(true);
  }, [loadProjects]);

  // Force refresh (skip cache)
  const refresh = useCallback(() => loadProjects(false), [loadProjects]);

  return {
    projects,
    refresh,
  };
}
