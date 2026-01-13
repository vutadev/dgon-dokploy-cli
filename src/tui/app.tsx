import { render } from 'ink';
import { Layout } from './components/layout.js';
import { AppProvider } from './context/app-context.js';
import { useProjects } from './hooks/use-projects.js';
import { useApps } from './hooks/use-apps.js';
import { useAppActions } from './hooks/use-app-actions.js';
import { useKeyboard } from './hooks/use-keyboard.js';
import { useLogs } from './hooks/use-logs.js';
import { useSearch } from './hooks/use-search.js';
import { useServers } from './hooks/use-servers.js';
import { useAuth } from './hooks/use-auth.js';

/**
 * Inner app component that wires up all hooks
 */
function TUIApp() {
  // Data fetching hooks
  const { refresh: refreshProjects } = useProjects();
  const { refresh: refreshApps } = useApps();

  // Action hooks
  const { deploy, stop, start, restart, isRunning } = useAppActions();

  // Logs hooks
  const { toggleAutoScroll, clearLogs } = useLogs();

  // Search hooks
  const { startSearch, isSearching } = useSearch();

  // Server hooks
  const { toggleSelector, showServerSelector } = useServers();

  // Auth hooks
  const { openLoginForm, showLoginForm } = useAuth();

  // Refresh all data
  const handleRefresh = async () => {
    await refreshProjects();
    await refreshApps();
  };

  // Keyboard navigation and shortcuts
  useKeyboard({
    onDeploy: deploy,
    onStop: stop,
    onStart: start,
    onRestart: restart,
    onRefresh: handleRefresh,
    onToggleAutoScroll: toggleAutoScroll,
    onClearLogs: clearLogs,
    onStartSearch: startSearch,
    onToggleServerSelector: toggleSelector,
    onAddServer: openLoginForm,
    disabled: isRunning || isSearching || showServerSelector || showLoginForm,
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
