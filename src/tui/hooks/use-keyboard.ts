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
    apps,
    activeProject,
    activeApp,
    activePanel,
    setActiveProject,
    setActiveApp,
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
    disabled,
  } = options;

  // Navigation helper
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
      } else if (activePanel === 'main' && apps.length > 0) {
        const currentIndex = apps.findIndex(
          (a) => a.applicationId === activeApp?.applicationId
        );
        const newIndex = Math.max(
          0,
          Math.min(apps.length - 1, currentIndex + direction)
        );
        setActiveApp(apps[newIndex]);
      }
    },
    [activePanel, projects, apps, activeProject, activeApp, setActiveProject, setActiveApp]
  );

  // Switch between sidebar and main panels
  const switchPanel = useCallback(() => {
    if (activePanel === 'logs') {
      setActivePanel('main');
    } else {
      setActivePanel(activePanel === 'sidebar' ? 'main' : 'sidebar');
    }
  }, [activePanel, setActivePanel]);

  // Toggle logs panel
  const toggleLogs = useCallback(() => {
    if (activePanel === 'logs') {
      setActivePanel('main');
    } else if (activeApp) {
      setActivePanel('logs');
    }
  }, [activePanel, activeApp, setActivePanel]);

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

      // App actions (only when app is selected and in main panel)
      if (activeApp && activePanel === 'main') {
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
      }
    },
    { isActive: !disabled }
  );

  return {
    navigate,
    switchPanel,
    toggleLogs,
  };
}
