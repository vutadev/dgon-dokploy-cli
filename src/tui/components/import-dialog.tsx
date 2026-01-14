import { Box, Text, useInput } from 'ink';
import { useImport } from '../hooks/use-import.js';

/**
 * Import file selection dialog
 * Lists JSON export files and allows selection with j/k/Enter/Escape
 */
export function ImportDialog() {
  const {
    showImportDialog,
    importFiles,
    importSelectedIndex,
    closeImportDialog,
    selectNext,
    selectPrev,
    executeImport,
  } = useImport();

  useInput(
    (input, key) => {
      if (!showImportDialog) return;

      if (key.escape) {
        closeImportDialog();
      } else if (key.return) {
        executeImport();
      } else if (input === 'j' || key.downArrow) {
        selectNext();
      } else if (input === 'k' || key.upArrow) {
        selectPrev();
      }
    },
    { isActive: showImportDialog }
  );

  if (!showImportDialog) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      paddingX={1}
      position="absolute"
      marginTop={5}
      marginLeft={10}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">Import Application</Text>
      </Box>

      {importFiles.map((file, i) => (
        <Box key={file}>
          <Text
            color={i === importSelectedIndex ? 'cyan' : undefined}
            inverse={i === importSelectedIndex}
          >
            {i === importSelectedIndex ? '>' : ' '} {file}
          </Text>
        </Box>
      ))}

      <Box marginTop={1}>
        <Text dimColor>
          <Text color="yellow">j/k</Text> select{' '}
          <Text color="yellow">Enter</Text> import{' '}
          <Text color="yellow">Esc</Text> cancel
        </Text>
      </Box>
    </Box>
  );
}
