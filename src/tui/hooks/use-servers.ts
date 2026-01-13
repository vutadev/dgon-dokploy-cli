import { useEffect, useCallback } from 'react';
import { useAppContext } from '../context/app-context.js';
import {
  listServerAliases,
  setCurrentAlias,
  getCurrentAlias,
  setActiveAlias,
} from '../../lib/config.js';
import { invalidateServerCache } from '../../lib/cache.js';

/**
 * Hook to manage multi-server support in TUI
 * Loads server list, handles server switching
 */
export function useServers() {
  const {
    servers,
    currentServerAlias,
    showServerSelector,
    setServers,
    setCurrentServerAlias,
    setShowServerSelector,
    setProjects,
    setApps,
    setActiveProject,
    setActiveApp,
  } = useAppContext();

  // Load servers on mount only
  useEffect(() => {
    const serverList = listServerAliases();
    setServers(serverList);
    setCurrentServerAlias(getCurrentAlias());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle server selector
  const toggleSelector = useCallback(() => {
    setShowServerSelector(!showServerSelector);
  }, [showServerSelector, setShowServerSelector]);

  // Close server selector
  const closeSelector = useCallback(() => {
    setShowServerSelector(false);
  }, [setShowServerSelector]);

  // Switch to a different server
  const switchServer = useCallback(
    (alias: string) => {
      if (alias === currentServerAlias) {
        closeSelector();
        return;
      }

      // Update config
      setCurrentAlias(alias);
      setActiveAlias(alias);

      // Update state
      setCurrentServerAlias(alias);

      // Invalidate cache for old server
      invalidateServerCache();

      // Clear current data (will be reloaded by hooks)
      setProjects([]);
      setApps([]);
      setActiveProject(null);
      setActiveApp(null);

      // Refresh server list to update isCurrent flags
      const serverList = listServerAliases();
      setServers(serverList);

      closeSelector();
    },
    [
      currentServerAlias,
      setCurrentServerAlias,
      setServers,
      setProjects,
      setApps,
      setActiveProject,
      setActiveApp,
      closeSelector,
    ]
  );

  // Get current server info
  const currentServer = servers.find((s) => s.isCurrent);

  return {
    servers,
    currentServer,
    currentServerAlias,
    showServerSelector,
    toggleSelector,
    closeSelector,
    switchServer,
  };
}
