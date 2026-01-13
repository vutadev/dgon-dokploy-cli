import { Box, Text } from 'ink';
import { useAppContext } from '../context/app-context.js';
import { useSearch } from '../hooks/use-search.js';

// Status color and icon mapping
const statusDisplay = (status: string) => {
  switch (status) {
    case 'running':
      return { color: 'green' as const, icon: '●' };
    case 'done':
      return { color: 'blue' as const, icon: '●' };
    case 'error':
      return { color: 'red' as const, icon: '●' };
    case 'idle':
      return { color: 'yellow' as const, icon: '○' };
    default:
      return { color: 'gray' as const, icon: '○' };
  }
};

/**
 * Main content area showing apps list
 * Displays app name, status, build type, source
 */
export function MainContent() {
  const { activePanel, activeProject, apps, activeApp, isLoading } = useAppContext();
  const { filteredApps, searchQuery } = useSearch();
  const isActive = activePanel === 'main';
  const displayApps = searchQuery ? filteredApps : apps;

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle="single"
      borderColor={isActive ? 'cyan' : 'gray'}
      borderTop={false}
      borderBottom={false}
    >
      {/* Header */}
      <Box paddingX={1} justifyContent="space-between">
        <Box>
          <Text bold color={isActive ? 'cyan' : undefined}>
            APPLICATIONS
          </Text>
          {activeProject && (
            <Text dimColor> in {activeProject.name}</Text>
          )}
        </Box>
        <Text dimColor>({displayApps.length})</Text>
      </Box>

      {/* Column headers */}
      {displayApps.length > 0 && (
        <Box paddingX={1} gap={1}>
          <Text dimColor>{'  '}NAME</Text>
          <Box width={12}>
            <Text dimColor>STATUS</Text>
          </Box>
          <Box width={12}>
            <Text dimColor>BUILD</Text>
          </Box>
          <Text dimColor>SOURCE</Text>
        </Box>
      )}

      {/* App list */}
      <Box flexDirection="column" paddingX={1} flexGrow={1} overflowY="hidden">
        {!activeProject ? (
          <Text dimColor>← Select a project</Text>
        ) : isLoading ? (
          <Text dimColor>Loading apps...</Text>
        ) : displayApps.length === 0 ? (
          <Text dimColor>{searchQuery ? 'No matches' : 'No applications in this project'}</Text>
        ) : (
          displayApps.map((app) => {
            const isSelected = activeApp?.applicationId === app.applicationId;
            const status = statusDisplay(app.applicationStatus);

            return (
              <Box key={app.applicationId} gap={1}>
                <Text
                  color={isSelected ? 'cyan' : undefined}
                  bold={isSelected}
                  inverse={isSelected && isActive}
                >
                  {isSelected ? '>' : ' '} {app.name.padEnd(14).slice(0, 14)}
                </Text>
                <Box width={12}>
                  <Text color={status.color}>
                    {status.icon} {app.applicationStatus}
                  </Text>
                </Box>
                <Box width={12}>
                  <Text dimColor>{app.buildType}</Text>
                </Box>
                <Text dimColor>{app.sourceType}</Text>
              </Box>
            );
          })
        )}
      </Box>

      {/* Action hints when app selected */}
      {isActive && activeApp && (
        <Box paddingX={1} gap={2}>
          <Text dimColor>
            <Text color="yellow">d</Text>eploy{' '}
            <Text color="yellow">s</Text>top{' '}
            <Text color="yellow">S</Text>tart{' '}
            <Text color="yellow">r</Text>estart
          </Text>
        </Box>
      )}
    </Box>
  );
}
