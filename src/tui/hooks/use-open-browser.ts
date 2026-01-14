import { useCallback } from 'react';
import { useAppContext } from '../context/app-context.js';
import { getConfig } from '../../lib/config.js';
import { openResourceInBrowser } from '../../lib/browser.js';

/**
 * Hook to open current selection in browser
 * Provides callback for keyboard handler
 */
export function useOpenBrowser() {
  const {
    activeProject,
    activeResource,
    activePanel,
    setActionMessage,
  } = useAppContext();

  const openBrowser = useCallback(async () => {
    try {
      // Get server URL from config
      const config = getConfig();
      const { serverUrl } = config;

      // Validate server URL
      if (!serverUrl) {
        setActionMessage({
          text: 'Not authenticated - please login first',
          type: 'error',
        });
        return;
      }

      // Determine what to open based on active panel
      let target: any = null;

      if (activePanel === 'sidebar') {
        // In sidebar - open active project
        target = activeProject;
      } else if (activePanel === 'main') {
        // In main panel - open active resource
        target = activeResource;
      }

      // If no selection, silently do nothing
      if (!target) {
        return;
      }

      // Open in browser
      const result = await openResourceInBrowser(serverUrl, target);

      if (result.success) {
        setActionMessage({
          text: 'Opened in browser',
          type: 'success',
        });

        // Auto-clear success message after 2 seconds
        setTimeout(() => {
          setActionMessage(null);
        }, 2000);
      } else {
        setActionMessage({
          text: result.error || 'Failed to open browser',
          type: 'error',
        });
      }
    } catch (error) {
      setActionMessage({
        text: 'Unexpected error opening browser',
        type: 'error',
      });
    }
  }, [activeProject, activeResource, activePanel, setActionMessage]);

  return {
    openBrowser,
  };
}
