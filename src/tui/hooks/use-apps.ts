import { useEffect, useCallback } from 'react';
import { useAppContext } from '../context/app-context.js';
import { getCachedApps, setCachedApps } from '../../lib/cache.js';

/**
 * Hook to manage apps for active project
 * Extracts apps from project.environments (already loaded by useProjects)
 */
export function useApps() {
  const {
    apps,
    setApps,
    activeProject,
    setActiveApp,
  } = useAppContext();

  // Extract apps from active project's environments
  const extractApps = useCallback((projectId: string, useCache = true) => {
    // Try cache first
    if (useCache) {
      const cached = getCachedApps(projectId);
      if (cached) {
        setApps(cached);
        if (cached.length > 0) {
          setActiveApp(cached[0]);
        }
        return cached;
      }
    }

    // Extract from project environments (already loaded)
    if (activeProject && activeProject.projectId === projectId) {
      const appsList = (activeProject.environments || []).flatMap(env => env.applications || []);
      setApps(appsList);
      setCachedApps(projectId, appsList);

      if (appsList.length > 0) {
        setActiveApp(appsList[0]);
      } else {
        setActiveApp(null);
      }
      return appsList;
    }

    return [];
  }, [activeProject, setApps, setActiveApp]);

  // Load when project changes
  useEffect(() => {
    if (activeProject) {
      extractApps(activeProject.projectId, true);
    } else {
      setApps([]);
      setActiveApp(null);
    }
  }, [activeProject?.projectId, extractApps, setApps, setActiveApp]);

  // Force refresh - re-extract from project data
  const refresh = useCallback(() => {
    if (activeProject) {
      return Promise.resolve(extractApps(activeProject.projectId, false));
    }
    return Promise.resolve([]);
  }, [activeProject?.projectId, extractApps]);

  return {
    apps,
    refresh,
  };
}
