import { useCallback, useState } from 'react';
import { readdir, readFile } from 'fs/promises';
import { useAppContext } from '../context/app-context.js';
import { api } from '../../lib/api.js';
import type {
  Application,
  AppExport,
  ProjectExport,
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

  const [parsedExport, setParsedExport] = useState<AppExport | ProjectExport | null>(null);
  const [importableServices, setImportableServices] = useState<ImportableService[]>([]);

  // Open import dialog with path input
  const openImportDialog = useCallback(async () => {
    if (!activeProject) {
      setActionMessage({ text: 'Select a project first', type: 'error' });
      return;
    }

    // Scan for suggested files (but don't fail if none found)
    try {
      const files = await readdir('.');
      const jsonFiles = files.filter(f => f.endsWith('.json') && f.includes('export'));
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
    async (appData: AppExport['data'], projectId: string) => {
      // Create application
      const app = await api.post<Application>('/application.create', {
        projectId,
        name: appData.name,
        description: appData.description,
      });

      // Update settings
      await api.post('/application.update', {
        applicationId: app.applicationId,
        buildType: appData.buildType,
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

      return app.applicationId;
    },
    []
  );

  // Load and parse file from given path
  const loadFileFromPath = useCallback(async (filePath: string) => {
    if (!activeProject) return;

    // Sanitize path to prevent path traversal
    const { basename, resolve } = await import('path');
    const safePath = resolve('.', basename(filePath));

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
          await importApplicationData(exportData.data, activeProject.projectId);
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
  }, [activeProject, parseProjectServices, setActionMessage, setImportStep, closeImportDialog, importApplicationData]);

  // Execute import for selected services
  const executeProjectImport = useCallback(
    async (selectedIds: string[]) => {
      if (!activeProject || !parsedExport || parsedExport.type !== 'project') return;

      closeImportDialog();
      setActionMessage({ text: 'Importing services...', type: 'info' });

      const projectData = parsedExport as ProjectExport;
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        const service = importableServices.find(s => s.id === id);
        if (!service) continue;

        try {
          if (service.type === 'application') {
            const appData = projectData.data.applications[service.index];
            await importApplicationData(appData, activeProject.projectId);
            successCount++;
          } else if (service.type === 'compose') {
            const compData = projectData.data.compose?.[service.index];
            if (compData) {
              await api.post('/compose.create', {
                projectId: activeProject.projectId,
                name: compData.name,
                description: compData.description,
                composeType: compData.composeType,
              });
              successCount++;
            }
          } else if (service.type === 'database') {
            const dbData = projectData.data.databases?.[service.index];
            if (dbData) {
              await api.post(`/${dbData.dbType}.create`, {
                projectId: activeProject.projectId,
                name: dbData.name,
                description: dbData.description,
                dockerImage: dbData.dockerImage,
                databaseName: dbData.databaseName,
                databaseUser: dbData.databaseUser,
              });
              successCount++;
            }
          }
        } catch {
          failCount++;
        }
      }

      const msg = `Imported ${successCount} service(s)${failCount > 0 ? `, ${failCount} failed` : ''}`;
      setActionMessage({ text: msg, type: successCount > 0 ? 'success' : 'error' });
    },
    [activeProject, parsedExport, importableServices, closeImportDialog, setActionMessage, importApplicationData]
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
