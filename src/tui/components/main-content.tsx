import { Box, Text } from 'ink';
import { useAppContext } from '../context/app-context.js';
import { useSearch } from '../hooks/use-search.js';
import type { Resource, ResourceStatus } from '../../types/index.js';

// Status color and icon mapping
const statusDisplay = (status: ResourceStatus) => {
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

// Resource type icons and labels
const resourceTypeDisplay = (resource: Resource) => {
  switch (resource.type) {
    case 'application':
      return { icon: '◉', label: 'app', color: 'cyan' as const };
    case 'database':
      return { icon: '◆', label: resource.dbType.slice(0, 5), color: 'magenta' as const };
    case 'compose':
      return { icon: '▸', label: 'compose', color: 'yellow' as const };
    default:
      return { icon: '○', label: '?', color: 'gray' as const };
  }
};

// Get resource ID for selection comparison
const getResourceId = (resource: Resource): string => {
  switch (resource.type) {
    case 'application':
      return `app:${resource.data.applicationId}`;
    case 'database':
      return `db:${resource.data.id}`; // id is resolved in use-apps.ts
    case 'compose':
      return `compose:${resource.data.composeId}`;
  }
};

// Get resource status
const getResourceStatus = (resource: Resource): ResourceStatus => {
  switch (resource.type) {
    case 'application':
      return resource.data.applicationStatus;
    case 'database':
      return resource.data.applicationStatus; // API uses applicationStatus for DBs too
    case 'compose':
      return resource.data.composeStatus;
  }
};

// Get resource name
const getResourceName = (resource: Resource): string => {
  return resource.data.name;
};

// Get resource info (type-specific details)
const getResourceInfo = (resource: Resource): string => {
  switch (resource.type) {
    case 'application':
      return resource.data.buildType;
    case 'database':
      return resource.dbType;
    case 'compose':
      return resource.data.composeType;
  }
};

// Get resource source
const getResourceSource = (resource: Resource): string => {
  switch (resource.type) {
    case 'application':
      return resource.data.sourceType;
    case 'database':
      return '-';
    case 'compose':
      return resource.data.sourceType;
  }
};

/**
 * Main content area showing unified resource list
 * Displays apps, databases, and compose with type icons
 */
export function MainContent() {
  const { activePanel, activeProject, activeEnvironment, resources, activeResource } = useAppContext();
  const { filteredResources, searchQuery } = useSearch();
  const isActive = activePanel === 'main';
  const displayResources = searchQuery ? filteredResources : resources;

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
            RESOURCES
          </Text>
          {activeProject && (
            <Text dimColor>
              {' '}in {activeProject.name}
              <Text color="yellow"> [{activeEnvironment?.name || 'production'}]</Text>
            </Text>
          )}
        </Box>
        <Text dimColor>({displayResources.length})</Text>
      </Box>

      {/* Column headers */}
      {displayResources.length > 0 && (
        <Box paddingX={1} gap={1}>
          <Box width={3}>
            <Text dimColor>T</Text>
          </Box>
          <Box width={24}>
            <Text dimColor>NAME</Text>
          </Box>
          <Box width={12}>
            <Text dimColor>STATUS</Text>
          </Box>
          <Box width={15}>
            <Text dimColor>TYPE</Text>
          </Box>
          <Box width={15}>
            <Text dimColor>SOURCE</Text>
          </Box>
        </Box>
      )}

      {/* Resource list */}
      <Box flexDirection="column" paddingX={1} flexGrow={1} overflowY="hidden">
        {!activeProject ? (
          <Text dimColor>← Select a project</Text>
        ) : displayResources.length === 0 ? (
          <Text dimColor>{searchQuery ? 'No matches' : 'No resources in this project'}</Text>
        ) : (
          displayResources.map((resource) => {
            const resourceId = getResourceId(resource);
            const isSelected = activeResource && getResourceId(activeResource) === resourceId;
            const status = statusDisplay(getResourceStatus(resource));
            const typeInfo = resourceTypeDisplay(resource);

            return (
              <Box key={resourceId} gap={1}>
                {/* Type icon */}
                <Box width={3}>
                  <Text color={typeInfo.color}>{typeInfo.icon}</Text>
                </Box>
                {/* Name */}
                <Text
                  color={isSelected ? 'cyan' : undefined}
                  bold={isSelected ?? false}
                  inverse={(isSelected && isActive) ?? false}
                >
                  {isSelected ? '>' : ' '}{getResourceName(resource).padEnd(23).slice(0, 23)}
                </Text>
                {/* Status */}
                <Box width={12}>
                  <Text color={status.color}>
                    {status.icon} {getResourceStatus(resource)}
                  </Text>
                </Box>
                {/* Type info */}
                <Box width={15}>
                  <Text dimColor>{getResourceInfo(resource)}</Text>
                </Box>
                {/* Source */}
                <Box width={15}>
                  <Text dimColor>{getResourceSource(resource)}</Text>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* Action hints when resource selected */}
      {isActive && activeResource && (
        <Box paddingX={1} gap={2}>
          <Text dimColor>
            {activeResource.type === 'application' && (
              <>
                <Text color="yellow">d</Text>eploy{' '}
                <Text color="yellow">s</Text>top{' '}
                <Text color="yellow">S</Text>tart{' '}
                <Text color="yellow">r</Text>estart
              </>
            )}
            {activeResource.type === 'database' && (
              <>
                <Text color="yellow">s</Text>top{' '}
                <Text color="yellow">S</Text>tart
              </>
            )}
            {activeResource.type === 'compose' && (
              <>
                <Text color="yellow">d</Text>eploy{' '}
                <Text color="yellow">s</Text>top{' '}
                <Text color="yellow">S</Text>tart
              </>
            )}
          </Text>
        </Box>
      )}
    </Box>
  );
}
