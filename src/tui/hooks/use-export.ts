import { useCallback } from 'react';
import { writeFile } from 'fs/promises';
import { useAppContext } from '../context/app-context.js';
import { api } from '../../lib/api.js';
import type {
  Resource,
  ApplicationFull,
  ComposeFull,
  DatabaseFull,
  ProjectExport,
  ComposeExportData,
  DatabaseExportData,
} from '../../types/index.js';

export interface ExportableResource {
  id: string;
  name: string;
  type: 'application' | 'compose' | 'database';
  dbType?: string;
  resource: Resource;
}

/**
 * Hook to manage export dialog and export operations
 * Supports project-level export with service selection
 */
export function useExport() {
  const {
    activeProject,
    activeEnvironment,
    resources,
    showExportDialog,
    exportStep,
    setShowExportDialog,
    setExportStep,
    setActionMessage,
  } = useAppContext();

  // Open export dialog and prepare resources
  const openExportDialog = useCallback(() => {
    if (!activeProject || !activeEnvironment) {
      setActionMessage({ text: 'Select a project first', type: 'error' });
      return;
    }

    setExportStep('select');
    setShowExportDialog(true);
  }, [activeProject, activeEnvironment, setActionMessage, setExportStep, setShowExportDialog]);

  // Close export dialog
  const closeExportDialog = useCallback(() => {
    setShowExportDialog(false);
    setExportStep('select');
  }, [setShowExportDialog, setExportStep]);

  // Get exportable resources from active environment
  const getExportableResources = useCallback((): ExportableResource[] => {
    if (!activeEnvironment) return [];

    return resources.map(resource => {
      let id = '';
      let name = '';
      let dbType: string | undefined;

      if (resource.type === 'application') {
        id = resource.data.applicationId;
        name = resource.data.name;
      } else if (resource.type === 'compose') {
        id = resource.data.composeId;
        name = resource.data.name;
      } else if (resource.type === 'database') {
        id = resource.data.id;
        name = resource.data.name;
        dbType = resource.dbType;
      }

      return {
        id,
        name,
        type: resource.type,
        dbType,
        resource,
      };
    });
  }, [activeEnvironment, resources]);

  // Execute export with selected resources
  const executeExport = useCallback(
    async (selectedIds: string[], outputPath: string) => {
      if (!activeProject || !activeEnvironment) return;

      closeExportDialog();
      setActionMessage({ text: 'Exporting...', type: 'info' });

      try {
        const exportableResources = getExportableResources();
        const selectedResources = exportableResources.filter(r =>
          selectedIds.includes(r.id)
        );

        const applications: ProjectExport['data']['applications'] = [];
        const compose: ComposeExportData[] = [];
        const databases: DatabaseExportData[] = [];

        // Fetch full details and build export data
        for (const res of selectedResources) {
          if (res.type === 'application') {
            const fullApp = await api.getWithParams<ApplicationFull>(
              '/application.one',
              { applicationId: res.id }
            );

            applications.push({
              name: fullApp.name,
              description: fullApp.description,
              buildType: fullApp.buildType,
              sourceType: fullApp.sourceType,
              env: fullApp.env || '',
              dockerfile: fullApp.dockerfile,
              dockerImage: fullApp.dockerImage,
              replicas: fullApp.replicas,
              domains: (fullApp.domains || []).map(d => ({
                host: d.host,
                path: d.path,
                port: d.port,
                https: d.https,
                certificateType: d.certificateType,
              })),
              mounts: (fullApp.mounts || []).map(m => ({
                type: m.type,
                hostPath: m.hostPath,
                mountPath: m.mountPath,
                content: m.content,
              })),
              ports: (fullApp.ports || []).map(p => ({
                publishedPort: p.publishedPort,
                targetPort: p.targetPort,
                protocol: p.protocol,
              })),
            });
          } else if (res.type === 'compose' && res.resource.type === 'compose') {
            // Fetch full compose details
            const fullCompose = await api.getWithParams<ComposeFull>('/compose.one', {
              composeId: res.id,
            });

            compose.push({
              name: fullCompose.name,
              description: fullCompose.description,
              composeType: fullCompose.composeType,
              sourceType: fullCompose.sourceType,
              env: fullCompose.env || '',
              composeFile: fullCompose.composeFile,
              composePath: fullCompose.composePath,
              domains: (fullCompose.domains || []).map(d => ({
                host: d.host,
                path: d.path,
                port: d.port,
                https: d.https,
                certificateType: d.certificateType,
              })),
              mounts: (fullCompose.mounts || []).map(m => ({
                type: m.type,
                hostPath: m.hostPath,
                mountPath: m.mountPath,
                content: m.content,
              })),
            });
          } else if (res.type === 'database' && res.resource.type === 'database') {
            // Fetch full database details
            const dbType = res.resource.dbType;
            const fullDb = await api.getWithParams<DatabaseFull>(`/${dbType}.one`, {
              [`${dbType}Id`]: res.id,
            });

            databases.push({
              name: fullDb.name,
              description: fullDb.description,
              dbType: res.resource.dbType,
              env: fullDb.env || '',
              dockerImage: fullDb.dockerImage,
              databaseName: fullDb.databaseName,
              databaseUser: fullDb.databaseUser,
              externalPort: fullDb.externalPort,
              replicas: fullDb.replicas,
              memoryReservation: fullDb.memoryReservation,
              memoryLimit: fullDb.memoryLimit,
              mounts: (fullDb.mounts || []).map(m => ({
                type: m.type,
                hostPath: m.hostPath,
                mountPath: m.mountPath,
                content: m.content,
              })),
            });
          }
        }

        const exportData: ProjectExport = {
          version: '1.0',
          type: 'project',
          schemaVersion: '2.0',
          exportedAt: new Date().toISOString(),
          data: {
            name: activeProject.name,
            description: activeProject.description,
            applications,
            compose,
            databases,
          },
        };

        await writeFile(outputPath, JSON.stringify(exportData, null, 2));
        setActionMessage({ text: `Exported to ${outputPath}`, type: 'success' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Export failed';
        setActionMessage({ text: msg, type: 'error' });
      }
    },
    [activeProject, activeEnvironment, getExportableResources, closeExportDialog, setActionMessage]
  );

  return {
    showExportDialog,
    exportStep,
    openExportDialog,
    closeExportDialog,
    getExportableResources,
    executeExport,
  };
}
