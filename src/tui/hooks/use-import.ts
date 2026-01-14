import { useCallback } from 'react';
import { readdir, readFile } from 'fs/promises';
import { useAppContext } from '../context/app-context.js';
import { api } from '../../lib/api.js';
import type { Application, AppExport } from '../../types/index.js';

/**
 * Hook to manage import dialog and import operations
 * Lists JSON files in cwd and allows selection for import
 */
export function useImport() {
  const {
    activeProject,
    showImportDialog,
    importFiles,
    importSelectedIndex,
    setShowImportDialog,
    setImportFiles,
    setImportSelectedIndex,
    setActionMessage,
  } = useAppContext();

  // Open import dialog and scan for JSON files
  const openImportDialog = useCallback(async () => {
    if (!activeProject) {
      setActionMessage({ text: 'Select a project first', type: 'error' });
      return;
    }

    try {
      const files = await readdir('.');
      const jsonFiles = files.filter(f => f.endsWith('.json') && f.includes('export'));

      if (jsonFiles.length === 0) {
        setActionMessage({ text: 'No export files found', type: 'error' });
        return;
      }

      setImportFiles(jsonFiles);
      setImportSelectedIndex(0);
      setShowImportDialog(true);
    } catch {
      setActionMessage({ text: 'Failed to scan for files', type: 'error' });
    }
  }, [activeProject, setActionMessage, setImportFiles, setImportSelectedIndex, setShowImportDialog]);

  // Close import dialog
  const closeImportDialog = useCallback(() => {
    setShowImportDialog(false);
    setImportFiles([]);
    setImportSelectedIndex(0);
  }, [setShowImportDialog, setImportFiles, setImportSelectedIndex]);

  // Navigate selection
  const selectNext = useCallback(() => {
    setImportSelectedIndex(Math.min(importSelectedIndex + 1, importFiles.length - 1));
  }, [importSelectedIndex, importFiles.length, setImportSelectedIndex]);

  const selectPrev = useCallback(() => {
    setImportSelectedIndex(Math.max(importSelectedIndex - 1, 0));
  }, [importSelectedIndex, setImportSelectedIndex]);

  // Execute import of selected file
  const executeImport = useCallback(async () => {
    if (!activeProject || importFiles.length === 0) return;

    const filename = importFiles[importSelectedIndex];
    closeImportDialog();

    try {
      const content = await readFile(filename, 'utf-8');
      const exportData: AppExport = JSON.parse(content);

      if (exportData.type !== 'application' || !exportData.version) {
        setActionMessage({ text: 'Invalid export file', type: 'error' });
        return;
      }

      // Create application
      const app = await api.post<Application>('/application.create', {
        projectId: activeProject.projectId,
        name: exportData.data.name,
        description: exportData.data.description,
      });

      // Update settings
      await api.post('/application.update', {
        applicationId: app.applicationId,
        buildType: exportData.data.buildType,
        replicas: exportData.data.replicas,
        dockerImage: exportData.data.dockerImage,
        dockerfile: exportData.data.dockerfile,
      });

      // Set env if present
      if (exportData.data.env) {
        await api.post('/application.saveEnvironment', {
          applicationId: app.applicationId,
          env: exportData.data.env,
        });
      }

      // Create domains if present
      for (const domain of exportData.data.domains || []) {
        await api.post('/domain.create', {
          applicationId: app.applicationId,
          ...domain,
        });
      }

      setActionMessage({ text: `Imported "${exportData.data.name}"`, type: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setActionMessage({ text: msg, type: 'error' });
    }
  }, [activeProject, importFiles, importSelectedIndex, closeImportDialog, setActionMessage]);

  return {
    showImportDialog,
    importFiles,
    importSelectedIndex,
    openImportDialog,
    closeImportDialog,
    selectNext,
    selectPrev,
    executeImport,
  };
}
