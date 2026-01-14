import { Box, Text } from 'ink';

interface PathInputProps {
  label: string;
  value: string;
  normalizedPath: string;
  isValid: boolean;
  error: string | null;
  isValidating: boolean;
  isActive: boolean;
}

/**
 * File path input with validation feedback
 * Shows normalized path and validation status
 */
export function PathInput({
  label,
  value,
  normalizedPath,
  isValid,
  error,
  isValidating,
  isActive,
}: PathInputProps) {
  // Validation indicator
  let indicator = '';
  let indicatorColor: 'green' | 'red' | 'yellow' = 'yellow';

  if (isValidating) {
    indicator = '⋯';
    indicatorColor = 'yellow';
  } else if (value.trim() && isValid) {
    indicator = '✓';
    indicatorColor = 'green';
  } else if (value.trim() && !isValid) {
    indicator = '✗';
    indicatorColor = 'red';
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Box width={12}>
          <Text color={isActive ? 'cyan' : 'gray'}>{label}:</Text>
        </Box>
        <Text inverse={isActive}>{value || ' '}</Text>
        {isActive && <Text color="gray">_</Text>}
        {indicator && (
          <Box marginLeft={1}>
            <Text color={indicatorColor}>{indicator}</Text>
          </Box>
        )}
      </Box>

      {/* Show normalized path if different from input */}
      {value && normalizedPath && normalizedPath !== value && (
        <Box marginLeft={12}>
          <Text dimColor>→ {normalizedPath}</Text>
        </Box>
      )}

      {/* Show error message */}
      {error && value.trim() && (
        <Box marginLeft={12}>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  );
}
