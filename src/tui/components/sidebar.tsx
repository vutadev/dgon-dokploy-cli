import { Box, Text } from 'ink';
import { useAppContext } from '../context/app-context.js';
import { useSearch } from '../hooks/use-search.js';

/**
 * Left sidebar panel showing project and environment selection
 * Hierarchy: Project → Environment → Resources
 */
export function Sidebar() {
  const { activePanel, activeProject, activeEnvironment, isLoading, projects } = useAppContext();
  const { filteredProjects, searchQuery } = useSearch();
  const isActive = activePanel === 'sidebar';
  const displayProjects = searchQuery ? filteredProjects : projects;

  // Get environments for active project
  const environments = activeProject?.environments || [];

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
      {/* Projects section */}
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

      {/* Environments section - shown when project is selected */}
      {activeProject && (
        <>
          <Box paddingX={1} justifyContent="space-between" marginTop={1}>
            <Text bold color={isActive ? 'yellow' : 'gray'}>
              ENVIRONMENT
            </Text>
            <Text dimColor>({environments.length})</Text>
          </Box>
          <Box flexDirection="column" paddingX={1}>
            {environments.length === 0 ? (
              <Box>
                <Text color={activeEnvironment === null ? 'yellow' : undefined} inverse={activeEnvironment === null && isActive}>
                  {'>'} production
                </Text>
              </Box>
            ) : (
              environments.map((env) => {
                const isEnvSelected = activeEnvironment?.environmentId === env.environmentId;
                return (
                  <Box key={env.environmentId}>
                    <Text
                      color={isEnvSelected ? 'yellow' : undefined}
                      bold={isEnvSelected}
                      inverse={isEnvSelected && isActive}
                    >
                      {isEnvSelected ? '>' : ' '} {env.name.slice(0, 18)}
                    </Text>
                  </Box>
                );
              })
            )}
          </Box>
        </>
      )}

      {/* Navigation hints */}
      {isActive && (
        <Box paddingX={1} marginTop={1}>
          <Text dimColor>j/k nav  e envs</Text>
        </Box>
      )}
    </Box>
  );
}
