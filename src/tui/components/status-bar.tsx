import { Box, Text } from 'ink';
import { useAppContext } from '../context/app-context.js';
import { ConfirmDialog } from './confirm-dialog.js';

interface Shortcut {
  key: string;
  label: string;
}

const searchShortcuts: Shortcut[] = [
  { key: 'Esc', label: 'cancel' },
  { key: 'Enter', label: 'keep filter' },
];

/**
 * Get contextual shortcuts based on active panel and resource type
 */
function getContextualShortcuts(
  activePanel: 'sidebar' | 'main' | 'logs',
  resourceType?: 'application' | 'database' | 'compose'
): Shortcut[] {
  const shortcuts: Shortcut[] = [];

  // Context-specific actions
  if (activePanel === 'sidebar') {
    // Sidebar: Project selection
    shortcuts.push({ key: 'o', label: 'open' });
  } else if (activePanel === 'main' && resourceType) {
    // Main panel: Resource-specific actions
    if (resourceType === 'application') {
      shortcuts.push(
        { key: 'd', label: 'deploy' },
        { key: 's', label: 'stop' },
        { key: 'S', label: 'start' },
        { key: 'r', label: 'restart' },
        { key: 'D', label: 'delete' },
        { key: 'i', label: 'info' },
        { key: 'o', label: 'open' },
        { key: 'l', label: 'logs' }
      );
    } else if (resourceType === 'database') {
      shortcuts.push(
        { key: 's', label: 'stop' },
        { key: 'S', label: 'start' },
        { key: 'i', label: 'info' },
        { key: 'o', label: 'open' }
      );
    } else if (resourceType === 'compose') {
      shortcuts.push(
        { key: 'd', label: 'deploy' },
        { key: 's', label: 'stop' },
        { key: 'S', label: 'start' },
        { key: 'i', label: 'info' },
        { key: 'o', label: 'open' }
      );
    }
  } else if (activePanel === 'logs') {
    // Logs panel
    shortcuts.push(
      { key: 'a', label: 'auto-scroll' },
      { key: 'c', label: 'clear' },
      { key: 'Esc', label: 'exit' }
    );
  }

  // Global actions (always available)
  if (activePanel !== 'logs') {
    shortcuts.push(
      { key: 'x', label: 'export' },
      { key: 'I', label: 'import' },
      { key: 'P', label: 'poll' },
      { key: '/', label: 'search' }
    );
  }
  shortcuts.push({ key: 'q', label: 'quit' });

  return shortcuts;
}

/**
 * Bottom bar showing keyboard shortcuts and action feedback
 * Shows confirm dialog when active, otherwise shortcuts
 */
export function StatusBar() {
  const {
    actionRunning,
    actionMessage,
    isSearching,
    showConfirm,
    showDetailPanel,
    showImportDialog,
    showExportDialog,
    showServerSelector,
    showLoginForm,
    servers,
    autoRefreshEnabled,
    activePanel,
    activeResource,
  } = useAppContext();

  const needsLogin = servers.length === 0 || showLoginForm;

  // Determine which shortcuts to show based on active state
  let activeShortcuts: Shortcut[];
  if (showDetailPanel) {
    // Detail panel shortcuts
    activeShortcuts = [
      { key: '←/→', label: 'tabs' },
      { key: 'Esc', label: 'close' },
    ];
  } else if (needsLogin) {
    // Login form shortcuts
    activeShortcuts = [
      { key: 'Tab', label: 'next' },
      { key: 'Enter', label: 'connect' },
      { key: '^S', label: 'save' },
    ];
    if (servers.length > 0) {
      activeShortcuts.push({ key: 'Esc', label: 'cancel' });
    }
  } else if (showServerSelector) {
    // Server selector shortcuts
    activeShortcuts = [
      { key: 'j/k', label: 'navigate' },
      { key: 'Enter', label: 'select' },
      { key: 'Esc', label: 'close' },
    ];
  } else if (showImportDialog || showExportDialog) {
    // Dialog shortcuts (simplified)
    activeShortcuts = [
      { key: 'Enter', label: 'confirm' },
      { key: 'Esc', label: 'cancel' },
    ];
  } else if (isSearching) {
    activeShortcuts = searchShortcuts;
  } else {
    activeShortcuts = getContextualShortcuts(activePanel, activeResource?.type);
  }

  return (
    <Box
      borderStyle="single"
      borderTop={false}
      paddingX={1}
      justifyContent="space-between"
    >
      {showConfirm ? (
        <ConfirmDialog />
      ) : (
        <>
          {/* Shortcuts */}
          <Box gap={1}>
            {activeShortcuts.map((shortcut) => (
              <Box key={shortcut.key}>
                <Text color="yellow">[{shortcut.key}]</Text>
                <Text dimColor>{shortcut.label}</Text>
              </Box>
            ))}
          </Box>

          {/* Action state / Loading indicator */}
          <Box gap={2}>
            {/* Auto-refresh indicator */}
            <Text color={autoRefreshEnabled ? 'cyan' : 'gray'}>
              {autoRefreshEnabled ? '⟳ Auto' : '◯ Paused'}
            </Text>
            {actionRunning ? (
              <Text color="yellow">⟳ {actionRunning}</Text>
            ) : actionMessage ? (
              <Text color={actionMessage.type === 'success' ? 'green' : 'red'}>
                {actionMessage.type === 'success' ? '✓' : '✗'} {actionMessage.text}
              </Text>
            ) : null}
          </Box>
        </>
      )}
    </Box>
  );
}
