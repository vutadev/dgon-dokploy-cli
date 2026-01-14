import { render } from 'ink';
import { useCallback } from 'react';
import { writeFile } from 'fs/promises';
import { Layout } from './components/layout.js';
import { AppProvider, useAppContext } from './context/app-context.js';
import { useProjects } from './hooks/use-projects.js';
import { useApps } from './hooks/use-apps.js';
import { useAppActions } from './hooks/use-app-actions.js';
import { useKeyboard } from './hooks/use-keyboard.js';
import { useLogs } from './hooks/use-logs.js';
import { useSearch } from './hooks/use-search.js';
import { useServers } from './hooks/use-servers.js';
import { useAuth } from './hooks/use-auth.js';
import { useConfirm } from './hooks/use-confirm.js';
import { useDetail } from './hooks/use-detail.js';
import { useAutoRefresh } from './hooks/use-auto-refresh.js';
import { useImport } from './hooks/use-import.js';
import { useOpenBrowser } from './hooks/use-open-browser.js';
import { api } from '../lib/api.js';
import type { ApplicationFull, AppExport } from '../types/index.js';

/**
 * Inner app component that wires up all hooks
 */
function TUIApp() {
  // Context
  const {
    activeApp,
    activeProject,
    activeResource,
    setActionMessage,
    setActionRunning,
    autoRefreshEnabled,
    setAutoRefreshEnabled
  } = useAppContext();

  // Data fetching hooks
  const { refresh: refreshProjects } = useProjects();
  const { refresh: refreshApps } = useApps();

  // Action hooks
  const appActions = useAppActions();
  const { isRunning } = appActions;

  // Logs hooks
  const { toggleAutoScroll, clearLogs } = useLogs();

  // Search hooks
  const { startSearch, isSearching } = useSearch();

  // Server hooks
  const { toggleSelector, showServerSelector } = useServers();

  // Auth hooks
  const { openLoginForm, showLoginForm } = useAuth();

  // Confirm hooks
  const { requestConfirm, showConfirm } = useConfirm();

  // Detail hooks
  const { openDetail, showDetailPanel } = useDetail();

  // Import hooks
  const { openImportDialog, showImportDialog } = useImport();

  // Browser hooks
  const { openBrowser } = useOpenBrowser();

  // Refresh all data with visual feedback
  const handleRefresh = useCallback(async () => {
    setActionRunning('Refreshing...');
    setActionMessage(null);
    try {
      await refreshProjects();
      await refreshApps();
      setActionRunning(null);
      setActionMessage({ text: 'Refreshed', type: 'success' });
      setTimeout(() => setActionMessage(null), 2000);
    } catch {
      setActionRunning(null);
      setActionMessage({ text: 'Refresh failed', type: 'error' });
    }
  }, [refreshProjects, refreshApps, setActionMessage, setActionRunning]);

  // Auto-refresh polling (5s default)
  useAutoRefresh({
    interval: 5000,
    enabled: autoRefreshEnabled,
    onRefresh: handleRefresh,
  });

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  }, [autoRefreshEnabled, setAutoRefreshEnabled]);

  // Generic action executor for all resource types
  const executeResourceAction = useCallback(
    async (action: 'deploy' | 'start' | 'stop' | 'restart') => {
      if (!activeResource) return;

      const name = activeResource.data.name;
      const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);

      setActionRunning(`${actionLabel}ing...`);
      setActionMessage(null);

      try {
        let endpoint: string;
        let payload: Record<string, string>;

        switch (activeResource.type) {
          case 'application':
            endpoint = `/application.${action}`;
            payload = { applicationId: activeResource.data.applicationId };
            break;
          case 'database': {
            // Database endpoints use type-specific names (postgres.start, mysql.start, etc.)
            endpoint = `/${activeResource.dbType}.${action}`;
            // Payload uses type-specific ID field
            const idKey = `${activeResource.dbType}Id`;
            payload = { [idKey]: activeResource.data.id };
            break;
          }
          case 'compose':
            endpoint = `/compose.${action}`;
            payload = { composeId: activeResource.data.composeId };
            break;
        }

        await api.post(endpoint, payload);

        // Refresh to get updated status from API
        await refreshProjects();

        setActionRunning(null);
        setActionMessage({
          text: `${actionLabel} successful for ${name}`,
          type: 'success',
        });

        // Auto-clear success message after 3s
        setTimeout(() => setActionMessage(null), 3000);
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${action}`;
        setActionRunning(null);
        setActionMessage({
          text: message,
          type: 'error',
        });
      }
    },
    [activeResource, setActionRunning, setActionMessage, refreshProjects]
  );

  // Deploy with confirmation
  const handleDeploy = useCallback(() => {
    if (!activeResource) return;
    requestConfirm(
      `Deploy "${activeResource.data.name}"?`,
      () => executeResourceAction('deploy')
    );
  }, [activeResource, requestConfirm, executeResourceAction]);

  // Start with confirmation
  const handleStart = useCallback(() => {
    if (!activeResource) return;
    requestConfirm(
      `Start "${activeResource.data.name}"?`,
      () => executeResourceAction('start')
    );
  }, [activeResource, requestConfirm, executeResourceAction]);

  // Stop with confirmation
  const handleStop = useCallback(() => {
    if (!activeResource) return;
    requestConfirm(
      `Stop "${activeResource.data.name}"?`,
      () => executeResourceAction('stop')
    );
  }, [activeResource, requestConfirm, executeResourceAction]);

  // Restart with confirmation (applications only)
  const handleRestart = useCallback(() => {
    if (!activeResource || activeResource.type !== 'application') return;
    requestConfirm(
      `Restart "${activeResource.data.name}"?`,
      () => executeResourceAction('restart')
    );
  }, [activeResource, requestConfirm, executeResourceAction]);

  // Delete with confirmation
  const handleDelete = useCallback(() => {
    if (!activeApp) return;
    requestConfirm(
      `Delete "${activeApp.name}"? This cannot be undone.`,
      async () => {
        try {
          await api.post('/application.delete', { applicationId: activeApp.applicationId });
          setActionMessage({ text: `Deleted "${activeApp.name}"`, type: 'success' });
          // Must refresh projects to get fresh data from API, then apps will auto-update
          await refreshProjects();
        } catch {
          setActionMessage({ text: 'Failed to delete app', type: 'error' });
        }
      }
    );
  }, [activeApp, requestConfirm, setActionMessage, refreshProjects]);

  // Export current app
  const handleExport = useCallback(async () => {
    if (!activeApp) return;
    const filename = `${activeApp.name}-export.json`;
    try {
      const fullApp = await api.getWithParams<ApplicationFull>('/application.one', {
        applicationId: activeApp.applicationId,
      });
      const exportData: AppExport = {
        version: '1.0',
        type: 'application',
        exportedAt: new Date().toISOString(),
        source: activeProject ? {
          applicationId: activeApp.applicationId,
          projectId: activeProject.projectId,
          projectName: activeProject.name,
        } : undefined,
        data: {
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
        },
      };
      await writeFile(filename, JSON.stringify(exportData, null, 2));
      setActionMessage({ text: `Exported to ${filename}`, type: 'success' });
    } catch {
      setActionMessage({ text: 'Export failed', type: 'error' });
    }
  }, [activeApp, activeProject, setActionMessage]);

  // Keyboard navigation and shortcuts
  useKeyboard({
    onDeploy: handleDeploy,
    onStop: handleStop,
    onStart: handleStart,
    onRestart: handleRestart,
    onRefresh: handleRefresh,
    onToggleAutoScroll: toggleAutoScroll,
    onClearLogs: clearLogs,
    onStartSearch: startSearch,
    onToggleServerSelector: toggleSelector,
    onAddServer: openLoginForm,
    onDelete: handleDelete,
    onOpenDetail: openDetail,
    onExport: handleExport,
    onImport: openImportDialog,
    onTogglePolling: toggleAutoRefresh,
    onOpenBrowser: openBrowser,
    disabled: isRunning || isSearching || showServerSelector || showLoginForm || showConfirm || showDetailPanel || showImportDialog,
  });

  return <Layout />;
}

/**
 * Launch the TUI dashboard
 */
export async function launchTUI(): Promise<void> {
  const { waitUntilExit } = render(
    <AppProvider>
      <TUIApp />
    </AppProvider>
  );

  await waitUntilExit();
}
