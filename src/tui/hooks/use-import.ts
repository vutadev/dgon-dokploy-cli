import { useCallback, useState } from 'react';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { useAppContext } from '../context/app-context.js';
import { api } from '../../lib/api.js';
import { EXPORTS_DIR } from '../../lib/paths.js';
import { useProjects } from './use-projects.js';
import type {
  Application,
  Compose,
  AppExport,
  ProjectExport,
  ComposeExportData,
  DatabaseExportData,
} from '../../types/index.js';

export interface ImportableService {
  id: string;
  name: string;
  type: 'application' | 'compose' | 'database';
  dbType?: string;
  index: number; // Index in original data array
}

/**
 * Hook to manage import dialog and import operations
 * Supports both single-app and project-level imports with service selection
 */
export function useImport() {
  const {
    activeProject,
    activeEnvironment,
    showImportDialog,
    importFiles,
    importSelectedIndex,
    importStep,
    setShowImportDialog,
    setImportFiles,
    setImportSelectedIndex,
    setImportStep,
    setActionMessage,
  } = useAppContext();

  // Get refresh function to update UI after import
  const { refresh: refreshProjects } = useProjects();

  const [parsedExport, setParsedExport] = useState<AppExport | ProjectExport | null>(null);
  const [importableServices, setImportableServices] = useState<ImportableService[]>([]);

  // Open import dialog with path input
  const openImportDialog = useCallback(async () => {
    if (!activeProject) {
      setActionMessage({ text: 'Select a project first', type: 'error' });
      return;
    }

    // Scan for suggested files in ~/.dokploy/exports/ (but don't fail if none found)
    try {
      const files = await readdir(EXPORTS_DIR);
      const jsonFiles = files
        .filter(f => f.endsWith('.json'))
        .map(f => join(EXPORTS_DIR, f)); // Return full paths
      setImportFiles(jsonFiles);
    } catch {
      setImportFiles([]);
    }

    setImportSelectedIndex(0);
    setImportStep('path');
    setShowImportDialog(true);
  }, [activeProject, setActionMessage, setImportFiles, setImportSelectedIndex, setImportStep, setShowImportDialog]);

  // Close import dialog
  const closeImportDialog = useCallback(() => {
    setShowImportDialog(false);
    setImportFiles([]);
    setImportSelectedIndex(0);
    setImportStep('path');
    setParsedExport(null);
    setImportableServices([]);
  }, [setShowImportDialog, setImportFiles, setImportSelectedIndex, setImportStep]);

  // Navigate selection
  const selectNext = useCallback(() => {
    setImportSelectedIndex(Math.min(importSelectedIndex + 1, importFiles.length - 1));
  }, [importSelectedIndex, importFiles.length, setImportSelectedIndex]);

  const selectPrev = useCallback(() => {
    setImportSelectedIndex(Math.max(importSelectedIndex - 1, 0));
  }, [importSelectedIndex, setImportSelectedIndex]);

  // Parse project export and extract importable services
  const parseProjectServices = useCallback((exportData: ProjectExport): ImportableService[] => {
    const services: ImportableService[] = [];

    exportData.data.applications.forEach((app, i) => {
      services.push({
        id: `app-${i}`,
        name: app.name,
        type: 'application',
        index: i,
      });
    });

    (exportData.data.compose || []).forEach((comp, i) => {
      services.push({
        id: `compose-${i}`,
        name: comp.name,
        type: 'compose',
        index: i,
      });
    });

    (exportData.data.databases || []).forEach((db, i) => {
      services.push({
        id: `db-${i}`,
        name: db.name,
        type: 'database',
        dbType: db.dbType,
        index: i,
      });
    });

    return services;
  }, []);

  // Import application data (helper for both single and project imports)
  const importApplicationData = useCallback(
    async (appData: AppExport['data'], projectId: string, environmentId?: string) => {
      // Create application with environment
      const app = await api.post<Application>('/application.create', {
        projectId,
        ...(environmentId && { environmentId }),
        name: appData.name,
        description: appData.description,
      });

      // Update all settings including sourceType
      await api.post('/application.update', {
        applicationId: app.applicationId,
        buildType: appData.buildType,
        sourceType: appData.sourceType,
        replicas: appData.replicas,
        dockerImage: appData.dockerImage,
        dockerfile: appData.dockerfile,
      });

      // Set env if present
      if (appData.env) {
        await api.post('/application.saveEnvironment', {
          applicationId: app.applicationId,
          env: appData.env,
        });
      }

      // Create domains if present
      for (const domain of appData.domains || []) {
        await api.post('/domain.create', {
          applicationId: app.applicationId,
          ...domain,
        });
      }

      // Create mounts if present
      for (const mount of appData.mounts || []) {
        await api.post('/mount.create', {
          applicationId: app.applicationId,
          type: mount.type,
          hostPath: mount.hostPath,
          mountPath: mount.mountPath,
          content: mount.content,
        });
      }

      // Create ports if present
      for (const port of appData.ports || []) {
        await api.post('/port.create', {
          applicationId: app.applicationId,
          publishedPort: port.publishedPort,
          targetPort: port.targetPort,
          protocol: port.protocol,
        });
      }

      return app.applicationId;
    },
    []
  );

  // Import compose data with all fields
  const importComposeData = useCallback(
    async (compData: ComposeExportData, projectId: string, environmentId?: string) => {
      // Create compose with environment
      const compose = await api.post<Compose>('/compose.create', {
        projectId,
        ...(environmentId && { environmentId }),
        name: compData.name,
        description: compData.description,
        composeType: compData.composeType,
      });

      // Update with all settings
      await api.post('/compose.update', {
        composeId: compose.composeId,
        sourceType: compData.sourceType,
        composeFile: compData.composeFile,
        composePath: compData.composePath,
      });

      // Set env if present
      if (compData.env) {
        await api.post('/compose.saveEnvironment', {
          composeId: compose.composeId,
          env: compData.env,
        });
      }

      // Create domains if present
      for (const domain of compData.domains || []) {
        await api.post('/domain.create', {
          composeId: compose.composeId,
          ...domain,
        });
      }

      // Create mounts if present
      for (const mount of compData.mounts || []) {
        await api.post('/mount.create', {
          composeId: compose.composeId,
          type: mount.type,
          hostPath: mount.hostPath,
          mountPath: mount.mountPath,
          content: mount.content,
        });
      }

      return compose.composeId;
    },
    []
  );

  // Import database data with all fields
  const importDatabaseData = useCallback(
    async (dbData: DatabaseExportData, projectId: string, environmentId?: string) => {
      // Create database with environment
      const db = await api.post<{ [key: string]: string }>(`/${dbData.dbType}.create`, {
        projectId,
        ...(environmentId && { environmentId }),
        name: dbData.name,
        description: dbData.description,
        dockerImage: dbData.dockerImage,
        databaseName: dbData.databaseName,
        databaseUser: dbData.databaseUser,
      });

      // Get the database ID from response
      const dbIdKey = `${dbData.dbType}Id`;
      const dbId = db[dbIdKey];

      // Update with additional settings
      if (dbId) {
        await api.post(`/${dbData.dbType}.update`, {
          [dbIdKey]: dbId,
          replicas: dbData.replicas,
          ...(dbData.externalPort !== null && { externalPort: dbData.externalPort }),
          ...(dbData.memoryReservation && { memoryReservation: dbData.memoryReservation }),
          ...(dbData.memoryLimit && { memoryLimit: dbData.memoryLimit }),
        });

        // Set env if present
        if (dbData.env) {
          await api.post(`/${dbData.dbType}.saveEnvironment`, {
            [dbIdKey]: dbId,
            env: dbData.env,
          });
        }

        // Create mounts if present
        for (const mount of dbData.mounts || []) {
          await api.post('/mount.create', {
            [dbIdKey]: dbId,
            type: mount.type,
            hostPath: mount.hostPath,
            mountPath: mount.mountPath,
            content: mount.content,
          });
        }
      }

      return dbId;
    },
    []
  );

  // Load and parse file from given path
  const loadFileFromPath = useCallback(async (filePath: string) => {
    if (!activeProject) return;

    // Resolve path (supports both relative and absolute paths)
    const { resolve } = await import('path');
    const safePath = resolve(filePath);

    try {
      const content = await readFile(safePath, 'utf-8');
      const exportData: AppExport | ProjectExport = JSON.parse(content);

      if (!exportData.type || !exportData.version) {
        setActionMessage({ text: 'Invalid export file', type: 'error' });
        return;
      }

      setParsedExport(exportData);

      if (exportData.type === 'application') {
        // Direct import for single app
        closeImportDialog();
        setActionMessage({ text: 'Importing...', type: 'info' });
        try {
          await importApplicationData(
            exportData.data,
            activeProject.projectId,
            activeEnvironment?.environmentId
          );
          // Refresh projects to show imported app
          await refreshProjects();
          setActionMessage({ text: `Imported "${exportData.data.name}"`, type: 'success' });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Import failed';
          setActionMessage({ text: msg, type: 'error' });
        }
      } else if (exportData.type === 'project') {
        // Show service selection for project
        const services = parseProjectServices(exportData as ProjectExport);
        setImportableServices(services);
        setImportStep('select');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to read file';
      setActionMessage({ text: msg, type: 'error' });
    }
  }, [activeProject, activeEnvironment, parseProjectServices, setActionMessage, setImportStep, closeImportDialog, importApplicationData, refreshProjects]);

  // Execute import for selected services
  const executeProjectImport = useCallback(
    async (selectedIds: string[]) => {
      if (!activeProject || !parsedExport || parsedExport.type !== 'project') return;

      closeImportDialog();
      setActionMessage({ text: 'Importing services...', type: 'info' });

      const projectData = parsedExport as ProjectExport;
      const envId = activeEnvironment?.environmentId;
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        const service = importableServices.find(s => s.id === id);
        if (!service) continue;

        try {
          if (service.type === 'application') {
            const appData = projectData.data.applications[service.index];
            await importApplicationData(appData, activeProject.projectId, envId);
            successCount++;
          } else if (service.type === 'compose') {
            const compData = projectData.data.compose?.[service.index];
            if (compData) {
              await importComposeData(compData, activeProject.projectId, envId);
              successCount++;
            }
          } else if (service.type === 'database') {
            const dbData = projectData.data.databases?.[service.index];
            if (dbData) {
              await importDatabaseData(dbData, activeProject.projectId, envId);
              successCount++;
            }
          }
        } catch {
          failCount++;
        }
      }

      // Refresh projects to show imported services
      if (successCount > 0) {
        await refreshProjects();
      }

      const msg = `Imported ${successCount} service(s)${failCount > 0 ? `, ${failCount} failed` : ''}`;
      setActionMessage({ text: msg, type: successCount > 0 ? 'success' : 'error' });
    },
    [activeProject, activeEnvironment, parsedExport, importableServices, closeImportDialog, setActionMessage, importApplicationData, importComposeData, importDatabaseData, refreshProjects]
  );

  return {
    showImportDialog,
    importFiles,
    importSelectedIndex,
    importStep,
    importableServices,
    openImportDialog,
    closeImportDialog,
    selectNext,
    selectPrev,
    loadFileFromPath,
    executeProjectImport,
  };
}
