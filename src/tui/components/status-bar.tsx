import { Box, Text } from 'ink';
import { useAppContext } from '../context/app-context.js';

interface Shortcut {
  key: string;
  label: string;
}

const shortcuts: Shortcut[] = [
  { key: 'd', label: 'deploy' },
  { key: 's', label: 'stop' },
  { key: 'S', label: 'start' },
  { key: 'r', label: 'restart' },
  { key: 'l', label: 'logs' },
  { key: '/', label: 'search' },
  { key: 'A', label: 'add server' },
  { key: 'R', label: 'refresh' },
  { key: 'q', label: 'quit' },
];

const searchShortcuts: Shortcut[] = [
  { key: 'Esc', label: 'cancel' },
  { key: 'Enter', label: 'keep filter' },
];

/**
 * Bottom bar showing keyboard shortcuts and action feedback
 */
export function StatusBar() {
  const { actionRunning, actionMessage, isLoading, isSearching } = useAppContext();
  const activeShortcuts = isSearching ? searchShortcuts : shortcuts;

  return (
    <Box
      borderStyle="single"
      borderTop={false}
      paddingX={1}
      justifyContent="space-between"
    >
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
      <Box>
        {actionRunning ? (
          <Text color="yellow">⟳ {actionRunning}</Text>
        ) : actionMessage ? (
          <Text color={actionMessage.type === 'success' ? 'green' : 'red'}>
            {actionMessage.type === 'success' ? '✓' : '✗'} {actionMessage.text}
          </Text>
        ) : isLoading ? (
          <Text dimColor>Loading...</Text>
        ) : null}
      </Box>
    </Box>
  );
}
