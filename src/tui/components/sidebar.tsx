import { Box, Text } from 'ink';
import { useAppContext } from '../context/app-context.js';
import { useSearch } from '../hooks/use-search.js';

/**
 * Left sidebar panel showing project list
 * Highlights active project, shows selection indicator
 */
export function Sidebar() {
  const { activePanel, activeProject, isLoading, projects } = useAppContext();
  const { filteredProjects, searchQuery } = useSearch();
  const isActive = activePanel === 'sidebar';
  const displayProjects = searchQuery ? filteredProjects : projects;

  return (
    <Box
      flexDirection="column"
      width={22}
      borderStyle="single"
      borderColor={isActive ? 'cyan' : 'gray'}
      borderRight={false}
      borderTop={false}
      borderBottom={false}
    >
      <Box paddingX={1} justifyContent="space-between">
        <Text bold color={isActive ? 'cyan' : undefined}>
          PROJECTS
        </Text>
        <Text dimColor>({displayProjects.length})</Text>
      </Box>
      <Box flexDirection="column" paddingX={1} flexGrow={1} overflowY="hidden">
        {isLoading && displayProjects.length === 0 ? (
          <Text dimColor>Loading...</Text>
        ) : displayProjects.length === 0 ? (
          <Text dimColor>{searchQuery ? 'No matches' : 'No projects'}</Text>
        ) : (
          displayProjects.map((project) => {
            const isSelected = activeProject?.projectId === project.projectId;
            return (
              <Box key={project.projectId}>
                <Text
                  color={isSelected ? 'cyan' : undefined}
                  bold={isSelected}
                  inverse={isSelected && isActive}
                >
                  {isSelected ? '>' : ' '} {project.name.slice(0, 18)}
                </Text>
              </Box>
            );
          })
        )}
      </Box>
      {isActive && (
        <Box paddingX={1}>
          <Text dimColor>j/k to navigate</Text>
        </Box>
      )}
    </Box>
  );
}
