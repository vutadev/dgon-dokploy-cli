import { Box, Text } from 'ink';
import { useServers } from '../hooks/use-servers.js';
import { useAppContext } from '../context/app-context.js';
import { VERSION } from '../../lib/version.js';

/**
 * Top bar showing CLI version and active server
 */
export function Header() {
  const { currentServer } = useServers();
  const { showDetailPanel, showImportDialog, showExportDialog, showLoginForm, servers } = useAppContext();
  const serverUrl = currentServer?.serverUrl || 'not connected';
  const alias = currentServer?.alias || 'none';
  // Extract hostname from URL
  const serverName = serverUrl.replace(/^https?:\/\//, '').split('/')[0];

  const needsLogin = servers.length === 0 || showLoginForm;

  // Hide server switcher hints when dialogs are open or login form is active
  const showHints = !showDetailPanel && !showImportDialog && !showExportDialog && !needsLogin;

  return (
    <Box
      borderStyle="single"
      borderBottom={false}
      paddingX={1}
      justifyContent="space-between"
    >
      <Text bold color="cyan">
        Dokploy CLI v{VERSION}
      </Text>
      <Box gap={1}>
        <Box>
          <Text dimColor>[</Text>
          <Text color="yellow">{alias}</Text>
          <Text dimColor>:</Text>
          <Text>{serverName}</Text>
          <Text dimColor>]</Text>
        </Box>
        {showHints && (
          <>
            <Box>
              <Text dimColor>[</Text>
              <Text color="green">M</Text>
              <Text dimColor>]switch </Text>
              <Text dimColor>[</Text>
              <Text color="green">A</Text>
              <Text dimColor>]add</Text>
            </Box>
            <Box>
              <Text dimColor>[</Text>
              <Text color="blue">?</Text>
              <Text dimColor>]help</Text>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
