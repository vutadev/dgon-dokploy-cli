import { useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/app-context.js';
import { getCachedApps, setCachedApps } from '../../lib/cache.js';
import type { Resource, DatabaseType, Database, DatabaseWithId, Environment } from '../../types/index.js';

// Map database type to ID field name
const dbIdFields: Record<DatabaseType, keyof Database> = {
  postgres: 'postgresId',
  mysql: 'mysqlId',
  mongo: 'mongoId',
  redis: 'redisId',
  mariadb: 'mariadbId',
};

/**
 * Hook to manage resources (apps, databases, compose) for active project/environment
 * Filters resources by selected environment
 */
export function useApps() {
  const {
    apps,
    resources,
    setApps,
    setResources,
    activeProject,
    activeEnvironment,
    activeApp,
    activeResource,
    setActiveApp,
    setActiveResource,
    setActiveEnvironment,
  } = useAppContext();

  // Extract resources from a single environment
  const extractResourcesFromEnv = useCallback((env: Environment, projectId: string): Resource[] => {
    const resourceList: Resource[] = [];

    // Applications
    (env.applications || []).forEach(app => {
      resourceList.push({
        type: 'application',
        data: app,
        projectId,
        environmentId: env.environmentId,
      });
    });

    // Compose
    (env.compose || []).forEach(c => {
      resourceList.push({
        type: 'compose',
        data: c,
        projectId,
        environmentId: env.environmentId,
      });
    });

    // Databases (postgres, mysql, mongo, redis, mariadb)
    const dbTypes: DatabaseType[] = ['postgres', 'mysql', 'mongo', 'redis', 'mariadb'];
    dbTypes.forEach(dbType => {
      const dbs = env[dbType] || [];
      dbs.forEach(db => {
        const idField = dbIdFields[dbType];
        const id = db[idField] as string || '';
        const dbWithId: DatabaseWithId = { ...db, id, dbType };
        resourceList.push({
          type: 'database',
          dbType,
          data: dbWithId,
          projectId,
          environmentId: env.environmentId,
        });
      });
    });

    return resourceList;
  }, []);

  // Use refs to access state without adding as dependencies (prevents infinite loops)
  const activeResourceRef = useRef(activeResource);
  const activeAppRef = useRef(activeApp);
  const activeEnvironmentRef = useRef(activeEnvironment);
  activeResourceRef.current = activeResource;
  activeAppRef.current = activeApp;
  activeEnvironmentRef.current = activeEnvironment;

  // Extract resources for active environment only
  const extractResources = useCallback((projectId: string, project: Project | null, useCache = true) => {
    // Try cache first for apps
    if (useCache) {
      const cached = getCachedApps(projectId);
      if (cached) {
        setApps(cached);
      }
    }

    if (!project || project.projectId !== projectId) {
      return [];
    }

    // Always look up fresh environment from project.environments
    // Use ref to get current activeEnvironment without causing dependency loop
    const currentActiveEnv = activeEnvironmentRef.current;
    const environments = project.environments || [];
    const targetEnv = currentActiveEnv
      ? environments.find(e => e.environmentId === currentActiveEnv.environmentId) || environments[0]
      : environments[0];

    if (!targetEnv) {
      // No environments available
      setApps([]);
      setResources([]);
      setActiveApp(null);
      setActiveResource(null);
      return [];
    }

    // Extract resources from target environment only
    const resourceList = extractResourcesFromEnv(targetEnv, project.projectId);

    // Update apps list (only apps from active environment)
    const appsList = (targetEnv.applications || []);
    setApps(appsList);
    setCachedApps(projectId, appsList);

    setResources(resourceList);

    // Set active resource/app - preserve current selection if it still exists
    // Use refs to get current values without causing dependency loop
    const currentActiveResource = activeResourceRef.current;
    const currentActiveApp = activeAppRef.current;

    if (resourceList.length > 0) {
      // Helper to get resource ID for comparison
      const getResourceId = (resource: Resource): string => {
        switch (resource.type) {
          case 'application':
            return `app:${resource.data.applicationId}`;
          case 'database':
            return `db:${resource.data.id}`;
          case 'compose':
            return `compose:${resource.data.composeId}`;
        }
      };

      if (!currentActiveResource) {
        // No resource selected, select first one
        setActiveResource(resourceList[0]);
        if (resourceList[0].type === 'application') {
          setActiveApp(resourceList[0].data);
        } else {
          setActiveApp(appsList[0] || null);
        }
      } else {
        // Resource already selected, update to fresh data if it still exists
        const currentResourceId = getResourceId(currentActiveResource);
        const updatedResource = resourceList.find(r => getResourceId(r) === currentResourceId);

        if (updatedResource) {
          // Selected resource still exists, update to fresh data
          setActiveResource(updatedResource);
          if (updatedResource.type === 'application') {
            setActiveApp(updatedResource.data);
          } else if (currentActiveApp) {
            // Preserve app selection if it still exists
            const updatedApp = appsList.find(a => a.applicationId === currentActiveApp.applicationId);
            setActiveApp(updatedApp || appsList[0] || null);
          }
        } else {
          // Selected resource no longer exists, select first one
          setActiveResource(resourceList[0]);
          if (resourceList[0].type === 'application') {
            setActiveApp(resourceList[0].data);
          } else {
            setActiveApp(appsList[0] || null);
          }
        }
      }
    } else {
      setActiveResource(null);
      setActiveApp(null);
    }

    return resourceList;
  }, [extractResourcesFromEnv, setApps, setResources, setActiveApp, setActiveResource]);

  // Auto-select default environment when project changes
  // Use projectId as dependency to avoid infinite loops when activeProject object changes
  useEffect(() => {
    if (activeProject) {
      const environments = activeProject.environments || [];
      const currentActiveEnv = activeEnvironmentRef.current;
      if (environments.length > 0) {
        if (!currentActiveEnv) {
          // No environment selected, select default environment (isDefault=true) or first one
          const defaultEnv = environments.find(e => e.isDefault) || environments[0];
          setActiveEnvironment(defaultEnv);
        } else {
          // Environment already selected, update to fresh data if it still exists
          const updatedEnv = environments.find(e => e.environmentId === currentActiveEnv.environmentId);
          if (updatedEnv) {
            // Only update if data actually changed to prevent unnecessary re-renders
            if (JSON.stringify(updatedEnv) !== JSON.stringify(currentActiveEnv)) {
              setActiveEnvironment(updatedEnv);
            }
          } else {
            // Selected environment no longer exists, select default or first one
            const defaultEnv = environments.find(e => e.isDefault) || environments[0];
            setActiveEnvironment(defaultEnv);
          }
        }
      } else {
        if (currentActiveEnv !== null) {
          setActiveEnvironment(null);
        }
      }
    } else {
      const currentActiveEnv = activeEnvironmentRef.current;
      if (currentActiveEnv !== null) {
        setActiveEnvironment(null);
      }
    }
  }, [activeProject?.projectId, setActiveEnvironment]); // Use projectId to trigger on project change only

  // Track last processed project/environment to avoid redundant processing
  const lastProcessedRef = useRef<string | null>(null);

  // Load resources when project or environment changes (or project data updates)
  useEffect(() => {
    if (activeProject) {
      const currentEnvId = activeEnvironmentRef.current?.environmentId;
      const processKey = `${activeProject.projectId}:${currentEnvId}`;

      // Only process if project/environment actually changed
      if (lastProcessedRef.current !== processKey) {
        lastProcessedRef.current = processKey;
        extractResources(activeProject.projectId, activeProject, false);
      }
    } else {
      lastProcessedRef.current = null;
      setApps([]);
      setResources([]);
      setActiveApp(null);
      setActiveResource(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.projectId, activeEnvironment?.environmentId, extractResources, setApps, setResources, setActiveApp, setActiveResource]);

  // Force refresh - re-extract from project data
  const refresh = useCallback(() => {
    if (activeProject) {
      // Reset process key to force re-extraction
      lastProcessedRef.current = null;
      return Promise.resolve(extractResources(activeProject.projectId, activeProject, false));
    }
    return Promise.resolve([]);
  }, [activeProject, extractResources]);

  return {
    apps,
    resources,
    refresh,
  };
}
