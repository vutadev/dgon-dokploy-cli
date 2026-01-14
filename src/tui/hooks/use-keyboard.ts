import { useCallback } from 'react';
import { useInput, useApp } from 'ink';
import { useAppContext } from '../context/app-context.js';

interface KeyboardOptions {
  onDeploy?: () => void;
  onStop?: () => void;
  onStart?: () => void;
  onRestart?: () => void;
  onRefresh?: () => void;
  onToggleAutoScroll?: () => void;
  onClearLogs?: () => void;
  onStartSearch?: () => void;
  onToggleServerSelector?: () => void;
  onAddServer?: () => void;
  onDelete?: () => void;
  onOpenDetail?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onTogglePolling?: () => void;
  onOpenBrowser?: () => void;
  disabled?: boolean;
}

/**
 * Hook to handle all keyboard navigation and shortcuts
 * Centralizes input handling for TUI
 */
export function useKeyboard(options: KeyboardOptions = {}) {
  const { exit } = useApp();
  const {
    projects,
    resources,
    activeProject,
    activeEnvironment,
    activeResource,
    activePanel,
    setActiveProject,
    setActiveEnvironment,
    setActiveApp,
    setActiveResource,
    setActivePanel,
  } = useAppContext();

  const {
    onDeploy,
    onStop,
    onStart,
    onRestart,
    onRefresh,
    onToggleAutoScroll,
    onClearLogs,
    onStartSearch,
    onToggleServerSelector,
    onAddServer,
    onDelete,
    onOpenDetail,
    onExport,
    onImport,
    onTogglePolling,
    onOpenBrowser,
    disabled,
  } = options;

  // Get resource ID for comparison
  const getResourceId = (r: typeof resources[0]): string => {
    switch (r.type) {
      case 'application': return `app:${r.data.applicationId}`;
      case 'database': return `db:${r.data.id}`;
      case 'compose': return `compose:${r.data.composeId}`;
    }
  };

  // Navigation helper - navigates resources in main panel
  const navigate = useCallback(
    (direction: 1 | -1) => {
      if (activePanel === 'sidebar' && projects.length > 0) {
        const currentIndex = projects.findIndex(
          (p) => p.projectId === activeProject?.projectId
        );
        const newIndex = Math.max(
          0,
          Math.min(projects.length - 1, currentIndex + direction)
        );
        setActiveProject(projects[newIndex]);
      } else if (activePanel === 'main' && resources.length > 0) {
        const currentIndex = activeResource
          ? resources.findIndex((r) => getResourceId(r) === getResourceId(activeResource))
          : -1;
        const newIndex = Math.max(
          0,
          Math.min(resources.length - 1, currentIndex + direction)
        );
        const newResource = resources[newIndex];
        setActiveResource(newResource);
        // Also update activeApp if it's an application
        if (newResource.type === 'application') {
          setActiveApp(newResource.data);
        }
      }
    },
    [activePanel, projects, resources, activeProject, activeResource, setActiveProject, setActiveResource, setActiveApp]
  );

  // Cycle through environments for current project
  const cycleEnvironment = useCallback(
    (direction: 1 | -1) => {
      if (!activeProject?.environments || activeProject.environments.length === 0) return;

      const environments = activeProject.environments;
      const currentIndex = activeEnvironment
        ? environments.findIndex((e) => e.environmentId === activeEnvironment.environmentId)
        : -1;
      const newIndex = (currentIndex + direction + environments.length) % environments.length;
      setActiveEnvironment(environments[newIndex]);
    },
    [activeProject, activeEnvironment, setActiveEnvironment]
  );

  // Switch between sidebar and main panels
  const switchPanel = useCallback(() => {
    if (activePanel === 'logs') {
      setActivePanel('main');
    } else {
      setActivePanel(activePanel === 'sidebar' ? 'main' : 'sidebar');
    }
  }, [activePanel, setActivePanel]);

  // Toggle logs panel (only for applications)
  const toggleLogs = useCallback(() => {
    if (activePanel === 'logs') {
      setActivePanel('main');
    } else if (activeResource?.type === 'application') {
      // Ensure activeApp is set when opening logs panel
      setActiveApp(activeResource.data);
      setActivePanel('logs');
    }
  }, [activePanel, activeResource, setActivePanel, setActiveApp]);

  useInput(
    (input, key) => {
      if (disabled) return;

      // Quit
      if (input === 'q') {
        exit();
        return;
      }

      // Help (future: show help modal)
      if (input === '?') {
        // TODO: Show help modal
        return;
      }

      // Search mode (only when not in logs)
      if (input === '/' && activePanel !== 'logs' && onStartSearch) {
        onStartSearch();
        return;
      }

      // Server selector (M key)
      if (input === 'M' && onToggleServerSelector) {
        onToggleServerSelector();
        return;
      }

      // Add server (A key)
      if (input === 'A' && onAddServer) {
        onAddServer();
        return;
      }

      // Refresh
      if (input === 'R' && onRefresh) {
        onRefresh();
        return;
      }

      // Toggle polling auto-refresh
      if (input === 'P' && onTogglePolling) {
        onTogglePolling();
        return;
      }

      // Logs toggle (works from any panel when app is selected)
      if (input === 'l') {
        toggleLogs();
        return;
      }

      // Log-specific shortcuts (only in logs panel)
      if (activePanel === 'logs') {
        if (input === 'a' && onToggleAutoScroll) {
          onToggleAutoScroll();
          return;
        }
        if (input === 'c' && onClearLogs) {
          onClearLogs();
          return;
        }
        // Escape from logs
        if (key.escape) {
          setActivePanel('main');
          return;
        }
      }

      // Panel navigation (not in logs)
      if (activePanel !== 'logs') {
        if (key.tab || input === 'h' || key.leftArrow || key.rightArrow) {
          switchPanel();
          return;
        }
      }

      // Vertical navigation
      if (input === 'j' || key.downArrow) {
        navigate(1);
        return;
      }
      if (input === 'k' || key.upArrow) {
        navigate(-1);
        return;
      }

      // Environment cycling (e/E in sidebar)
      if (activePanel === 'sidebar' && activeProject) {
        if (input === 'e') {
          cycleEnvironment(1);
          return;
        }
        if (input === 'E') {
          cycleEnvironment(-1);
          return;
        }
      }

      // Resource actions (only when resource is selected and in main panel)
      if (activeResource && activePanel === 'main') {
        // Application-specific actions
        if (activeResource.type === 'application') {
          if (input === 'd' && onDeploy) {
            onDeploy();
            return;
          }
          if (input === 's' && onStop) {
            onStop();
            return;
          }
          if (input === 'S' && onStart) {
            onStart();
            return;
          }
          if (input === 'r' && onRestart) {
            onRestart();
            return;
          }
          // Delete with confirm (D key)
          if (input === 'D' && onDelete) {
            onDelete();
            return;
          }
          // Export (x key)
          if (input === 'x' && onExport) {
            onExport();
            return;
          }
        }

        // Info panel (i key) - works for all resource types
        if (input === 'i' && onOpenDetail) {
          onOpenDetail();
          return;
        }

        // Database actions (start/stop only)
        if (activeResource.type === 'database') {
          if (input === 's' && onStop) {
            onStop();
            return;
          }
          if (input === 'S' && onStart) {
            onStart();
            return;
          }
        }

        // Compose actions (deploy/start/stop)
        if (activeResource.type === 'compose') {
          if (input === 'd' && onDeploy) {
            onDeploy();
            return;
          }
          if (input === 's' && onStop) {
            onStop();
            return;
          }
          if (input === 'S' && onStart) {
            onStart();
            return;
          }
        }

        // Import (I key) - works for any resource type in main panel
        if (input === 'I' && onImport) {
          onImport();
          return;
        }
      }

      // Open in browser (o key) - works in sidebar or main panel
      if (input === 'o' && onOpenBrowser && activePanel !== 'logs') {
        onOpenBrowser();
        return;
      }
    },
    { isActive: !disabled }
  );

  return {
    navigate,
    switchPanel,
    toggleLogs,
    cycleEnvironment,
  };
}
