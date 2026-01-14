import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import { useAuth } from '../hooks/use-auth.js';

type Field = 'url' | 'token' | 'alias';

const FIELDS: Field[] = ['url', 'token', 'alias'];

/**
 * Login form component for adding new server
 * Multi-field text input with validation
 */
export function LoginForm() {
  const { login, closeLoginForm, isVerifying, isConfigured } = useAuth();

  const [activeField, setActiveField] = useState<Field>('url');
  const [values, setValues] = useState({
    url: 'https://',
    token: '',
    alias: 'default',
  });
  const [error, setError] = useState<string | null>(null);

  // Handle text input
  useInput(
    (input, key) => {
      if (isVerifying) return;

      // Escape - close form (only if servers exist)
      if (key.escape) {
        if (isConfigured) {
          closeLoginForm();
        }
        return;
      }

      // Tab - next field
      if (key.tab && !key.shift) {
        const idx = FIELDS.indexOf(activeField);
        setActiveField(FIELDS[(idx + 1) % FIELDS.length]);
        setError(null);
        return;
      }

      // Shift+Tab - previous field
      if (key.tab && key.shift) {
        const idx = FIELDS.indexOf(activeField);
        setActiveField(FIELDS[(idx - 1 + FIELDS.length) % FIELDS.length]);
        setError(null);
        return;
      }

      // Enter - submit with verification
      if (key.return) {
        handleSubmit(false);
        return;
      }

      // Ctrl+S - save without verification
      if (key.ctrl && input === 's') {
        handleSubmit(true);
        return;
      }

      // Backspace - delete char
      if (key.backspace || key.delete) {
        setValues((v) => ({ ...v, [activeField]: v[activeField].slice(0, -1) }));
        setError(null);
        return;
      }

      // Add character (printable, non-control)
      if (input && !key.ctrl && !key.meta) {
        setValues((v) => ({ ...v, [activeField]: v[activeField] + input }));
        setError(null);
      }
    },
    { isActive: true }
  );

  const handleSubmit = async (skipVerify = false) => {
    const result = await login(values.url, values.token, values.alias, skipVerify);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const renderField = (field: Field, label: string, masked = false) => {
    const isActive = activeField === field;
    const value = masked ? '•'.repeat(values[field].length) : values[field];

    return (
      <Box>
        <Box width={14}>
          <Text color={isActive ? 'cyan' : 'gray'}>{label}:</Text>
        </Box>
        <Text inverse={isActive}>{value}</Text>
        {isActive && <Text color="gray">_</Text>}
      </Box>
    );
  };

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
          {isConfigured ? 'ADD SERVER' : 'WELCOME TO DOKPLOY CLI'}
        </Text>
      </Box>

      {!isConfigured && (
        <Box paddingBottom={1}>
          <Text dimColor>Connect to your Dokploy server to get started</Text>
        </Box>
      )}

      {/* Form fields */}
      <Box flexDirection="column" flexGrow={1}>
        {renderField('url', 'Server URL')}
        {renderField('token', 'API Token', true)}
        {renderField('alias', 'Alias')}

        {error && (
          <Box marginTop={1}>
            <Text color="red">✗ {error}</Text>
          </Box>
        )}

        {isVerifying && (
          <Box marginTop={1}>
            <Text color="yellow">⟳ Verifying connection...</Text>
          </Box>
        )}
      </Box>

      {/* Help text */}
      <Box paddingTop={1}>
        <Text dimColor>
          [Tab] next  [Enter] connect  [^S] save without verify
          {isConfigured && '  [Esc] cancel'}
        </Text>
      </Box>
    </Box>
  );
}
