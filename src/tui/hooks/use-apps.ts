import { useEffect, useCallback } from 'react';
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

  // Extract resources for active environment only
  const extractResources = useCallback((projectId: string, useCache = true) => {
    // Try cache first for apps
    if (useCache) {
      const cached = getCachedApps(projectId);
      if (cached) {
        setApps(cached);
      }
    }

    if (!activeProject || activeProject.projectId !== projectId) {
      return [];
    }

    // Always look up fresh environment from activeProject.environments
    // (activeEnvironment state may be stale after refresh)
    const environments = activeProject.environments || [];
    const targetEnv = activeEnvironment
      ? environments.find(e => e.environmentId === activeEnvironment.environmentId) || environments[0]
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
    const resourceList = extractResourcesFromEnv(targetEnv, activeProject.projectId);

    // Update apps list (only apps from active environment)
    const appsList = (targetEnv.applications || []);
    setApps(appsList);
    setCachedApps(projectId, appsList);

    setResources(resourceList);

    // Set active resource/app - preserve current selection if it still exists
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

      if (!activeResource) {
        // No resource selected, select first one
        setActiveResource(resourceList[0]);
        if (resourceList[0].type === 'application') {
          setActiveApp(resourceList[0].data);
        } else {
          setActiveApp(appsList[0] || null);
        }
      } else {
        // Resource already selected, update to fresh data if it still exists
        const currentResourceId = getResourceId(activeResource);
        const updatedResource = resourceList.find(r => getResourceId(r) === currentResourceId);

        if (updatedResource) {
          // Selected resource still exists, update to fresh data
          setActiveResource(updatedResource);
          if (updatedResource.type === 'application') {
            setActiveApp(updatedResource.data);
          } else if (activeApp) {
            // Preserve app selection if it still exists
            const updatedApp = appsList.find(a => a.applicationId === activeApp.applicationId);
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
  }, [activeProject, activeEnvironment, extractResourcesFromEnv, setApps, setResources, setActiveApp, setActiveResource, activeResource, activeApp]);

  // Auto-select default environment when project changes
  useEffect(() => {
    if (activeProject) {
      const environments = activeProject.environments || [];
      if (environments.length > 0) {
        if (!activeEnvironment) {
          // No environment selected, select default environment (isDefault=true) or first one
          const defaultEnv = environments.find(e => e.isDefault) || environments[0];
          setActiveEnvironment(defaultEnv);
        } else {
          // Environment already selected, update to fresh data if it still exists
          const updatedEnv = environments.find(e => e.environmentId === activeEnvironment.environmentId);
          if (updatedEnv) {
            setActiveEnvironment(updatedEnv);
          } else {
            // Selected environment no longer exists, select default or first one
            const defaultEnv = environments.find(e => e.isDefault) || environments[0];
            setActiveEnvironment(defaultEnv);
          }
        }
      } else {
        setActiveEnvironment(null);
      }
    } else {
      setActiveEnvironment(null);
    }
  }, [activeProject, setActiveEnvironment, activeEnvironment]); // Depend on activeProject (not just projectId) to update on refresh

  // Load resources when project or environment changes (or project data updates)
  useEffect(() => {
    if (activeProject) {
      extractResources(activeProject.projectId, false);
    } else {
      setApps([]);
      setResources([]);
      setActiveApp(null);
      setActiveResource(null);
    }
  }, [activeProject, activeEnvironment?.environmentId]);

  // Force refresh - re-extract from project data
  const refresh = useCallback(() => {
    if (activeProject) {
      return Promise.resolve(extractResources(activeProject.projectId, false));
    }
    return Promise.resolve([]);
  }, [activeProject, extractResources]);

  return {
    apps,
    resources,
    refresh,
  };
}
