import { Box, Text } from 'ink';
import { useServers } from '../hooks/use-servers.js';

/**
 * Top bar showing CLI version and active server
 */
export function Header() {
  const { currentServer, servers } = useServers();
  const serverUrl = currentServer?.serverUrl || 'not connected';
  const alias = currentServer?.alias || 'none';
  // Extract hostname from URL
  const serverName = serverUrl.replace(/^https?:\/\//, '').split('/')[0];

  return (
    <Box
      borderStyle="single"
      borderBottom={false}
      paddingX={1}
      justifyContent="space-between"
    >
      <Text bold color="cyan">
        Dokploy CLI v0.2.0
      </Text>
      <Box>
        <Text dimColor>[</Text>
        <Text color="yellow">{alias}</Text>
        <Text dimColor>:</Text>
        <Text>{serverName}</Text>
        {servers.length > 1 && <Text dimColor> M:switch</Text>}
        <Text dimColor>] </Text>
        <Text dimColor>[</Text>
        <Text color="blue">?</Text>
        <Text dimColor>] help</Text>
      </Box>
    </Box>
  );
}
