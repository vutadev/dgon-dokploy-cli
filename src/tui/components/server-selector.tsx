import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import { useServers } from '../hooks/use-servers.js';

/**
 * Modal-like server selector overlay
 * Allows switching between configured servers
 */
export function ServerSelector() {
  const { servers, showServerSelector, switchServer, closeSelector, currentServerAlias } =
    useServers();
  const [selectedIndex, setSelectedIndex] = useState(() =>
    Math.max(
      servers.findIndex((s) => s.alias === currentServerAlias),
      0
    )
  );

  useInput(
    (input, key) => {
      if (!showServerSelector) return;

      // Close on escape
      if (key.escape) {
        closeSelector();
        return;
      }

      // Navigate
      if (input === 'j' || key.downArrow) {
        setSelectedIndex((i) => Math.min(i + 1, servers.length - 1));
        return;
      }
      if (input === 'k' || key.upArrow) {
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      // Select
      if (key.return) {
        const server = servers[selectedIndex];
        if (server) {
          switchServer(server.alias);
        }
        return;
      }
    },
    { isActive: showServerSelector }
  );

  if (!showServerSelector) return null;

  if (servers.length === 0) {
    return (
      <Box
        flexDirection="column"
        flexGrow={1}
        borderStyle="single"
        borderColor="cyan"
        borderTop={false}
        borderBottom={false}
        paddingX={1}
      >
        {/* Header */}
        <Box paddingBottom={1}>
          <Text bold color="cyan">
            SELECT SERVER
          </Text>
        </Box>
        <Text dimColor>No servers configured. Run: dokploy server add</Text>
        <Text dimColor>[Esc] to close</Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle="single"
      borderColor="cyan"
      borderTop={false}
      borderBottom={false}
      paddingX={1}
    >
      {/* Header */}
      <Box paddingBottom={1}>
        <Text bold color="cyan">
          SELECT SERVER
        </Text>
      </Box>

      {/* Server list */}
      <Box flexDirection="column" flexGrow={1}>
        {servers.map((server, index) => {
          const isSelected = index === selectedIndex;
          const isCurrent = server.isCurrent;
          // Extract hostname from URL
          const host = server.serverUrl.replace(/^https?:\/\//, '').split('/')[0];

          return (
            <Box key={server.alias}>
              <Text
                color={isSelected ? 'cyan' : undefined}
                bold={isSelected}
                inverse={isSelected}
              >
                {isSelected ? '>' : ' '} {server.alias.padEnd(12)}
              </Text>
              <Text dimColor> {host}</Text>
              {isCurrent && <Text color="green"> (current)</Text>}
            </Box>
          );
        })}
      </Box>

      {/* Help text */}
      <Box paddingTop={1}>
        <Text dimColor>[j/k] navigate [Enter] select [Esc] close</Text>
      </Box>
    </Box>
  );
}
