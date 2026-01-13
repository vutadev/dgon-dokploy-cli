import { Box, Text } from 'ink';
import { useAppContext } from '../context/app-context.js';
import { useLogs } from '../hooks/use-logs.js';

// Color mapping for log levels
const levelColors = {
  info: 'white' as const,
  warn: 'yellow' as const,
  error: 'red' as const,
};

/**
 * Log viewer panel showing deployment/app logs
 * Displays when 'logs' panel is active
 */
export function LogViewer() {
  const { activePanel, activeApp } = useAppContext();
  const { logs, isLoading, autoScroll } = useLogs();
  const isActive = activePanel === 'logs';

  if (!isActive) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle="single"
      borderColor="cyan"
      borderTop={false}
      borderBottom={false}
    >
      {/* Header */}
      <Box paddingX={1} justifyContent="space-between">
        <Box>
          <Text bold color="cyan">
            LOGS
          </Text>
          {activeApp && (
            <Text dimColor> ({activeApp.name})</Text>
          )}
        </Box>
        <Box gap={2}>
          <Text dimColor>
            auto-scroll: <Text color={autoScroll ? 'green' : 'gray'}>{autoScroll ? 'on' : 'off'}</Text>
          </Text>
          {isLoading && <Text color="yellow">refreshing...</Text>}
        </Box>
      </Box>

      {/* Log content */}
      <Box flexDirection="column" paddingX={1} flexGrow={1} overflowY="hidden">
        {!activeApp ? (
          <Text dimColor>Select an app to view logs</Text>
        ) : logs.length === 0 ? (
          <Text dimColor>{isLoading ? 'Loading logs...' : 'No logs available'}</Text>
        ) : (
          logs.map((log, index) => (
            <Box key={index}>
              <Text dimColor>[{log.timestamp}] </Text>
              <Text color={levelColors[log.level]}>{log.message}</Text>
            </Box>
          ))
        )}
      </Box>

      {/* Hint */}
      <Box paddingX={1}>
        <Text dimColor>
          <Text color="yellow">l</Text> close logs | <Text color="yellow">a</Text> toggle auto-scroll | <Text color="yellow">c</Text> clear
        </Text>
      </Box>
    </Box>
  );
}
