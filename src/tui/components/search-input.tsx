import { Box, Text, useInput } from 'ink';
import { useSearch } from '../hooks/use-search.js';

/**
 * Search input component shown when in search mode
 * Handles text input and escape to cancel
 */
export function SearchInput() {
  const { searchQuery, isSearching, updateQuery, stopSearch, currentItems } = useSearch();

  useInput(
    (input, key) => {
      if (!isSearching) return;

      // Escape cancels search
      if (key.escape) {
        stopSearch();
        return;
      }

      // Enter exits search mode but keeps filter
      if (key.return) {
        // Keep the filter active, just exit input mode
        return;
      }

      // Backspace removes last character
      if (key.backspace || key.delete) {
        updateQuery(searchQuery.slice(0, -1));
        return;
      }

      // Add printable characters
      if (input && !key.ctrl && !key.meta) {
        updateQuery(searchQuery + input);
      }
    },
    { isActive: isSearching }
  );

  if (!isSearching) return null;

  return (
    <Box>
      <Text color="yellow">/</Text>
      <Text>{searchQuery}</Text>
      <Text color="gray">_</Text>
      <Text dimColor> ({currentItems.length} results)</Text>
    </Box>
  );
}
