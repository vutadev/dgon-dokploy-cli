import { Box, Text, useInput } from 'ink';
import { useConfirm } from '../hooks/use-confirm.js';

/**
 * Simple confirmation prompt displayed in status bar area
 * Responds to y/n/Escape keys
 */
export function ConfirmDialog() {
  const { showConfirm, confirmMessage, confirm, cancel } = useConfirm();

  useInput(
    (input, key) => {
      if (!showConfirm) return;

      if (input.toLowerCase() === 'y') {
        confirm();
      } else if (input.toLowerCase() === 'n' || key.escape) {
        cancel();
      }
    },
    { isActive: showConfirm }
  );

  if (!showConfirm) return null;

  return (
    <Box paddingX={1}>
      <Text color="yellow">{confirmMessage}</Text>
      <Text> </Text>
      <Text dimColor>[y/N]</Text>
    </Box>
  );
}
