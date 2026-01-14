import { Box } from 'ink';
import { Header } from './header.js';
import { Sidebar } from './sidebar.js';
import { MainContent } from './main-content.js';
import { LogViewer } from './log-viewer.js';
import { StatusBar } from './status-bar.js';
import { SearchInput } from './search-input.js';
import { ServerSelector } from './server-selector.js';
import { LoginForm } from './login-form.js';
import { AppDetailPanel } from './app-detail-panel.js';
import { ImportDialog } from './import-dialog.js';
import { useTerminalSize } from '../hooks/use-terminal-size.js';
import { useAppContext } from '../context/app-context.js';

/**
 * Main TUI layout with header, sidebar, main content/logs, and status bar
 * Shows log viewer when logs panel is active, detail panel when info is active
 */
export function Layout() {
  const { rows } = useTerminalSize();
  const { activePanel, isSearching, showServerSelector, showLoginForm, showDetailPanel, showImportDialog, servers } = useAppContext();

  // Show login form if no servers configured OR user requested it
  const needsLogin = servers.length === 0 || showLoginForm;

  // Reserve rows for header (3), status bar (3), and search (1 if active)
  const searchHeight = isSearching ? 1 : 0;
  const contentHeight = Math.max(rows - 6 - searchHeight, 10);
  const showLogs = activePanel === 'logs';

  // Login form takes over the whole screen
  if (needsLogin) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" height={rows}>
        <LoginForm />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Header />
      {isSearching && <SearchInput />}
      {showServerSelector && <ServerSelector />}
      {showImportDialog && <ImportDialog />}
      {showDetailPanel ? (
        <AppDetailPanel />
      ) : (
        <Box height={contentHeight}>
          <Sidebar />
          {showLogs ? <LogViewer /> : <MainContent />}
        </Box>
      )}
      <StatusBar />
    </Box>
  );
}
