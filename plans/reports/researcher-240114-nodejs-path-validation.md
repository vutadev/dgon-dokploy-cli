# Node.js File Path Validation for Terminal UIs

## Executive Summary
Path validation in terminal UIs requires: normalization, existence verification, tilde expansion, and real-time feedback. Node.js provides native methods for the first two; tilde expansion needs manual handling. Ink.js integrates validation via TextInput onChange handlers with non-blocking fs operations.

## Core Path Validation Strategy

### 1. Path Normalization & Resolution
Use sequential validation pipeline:
```typescript
import path from 'path';
import { access, stat } from 'fs/promises';
import os from 'os';

// Normalize → Resolve → Verify
const validatePath = async (
  input: string,
  type: 'file' | 'directory' = 'file'
): Promise<{ valid: boolean; absolute: string; error?: string }> => {
  try {
    // Step 1: Expand tilde
    const expanded = expandTilde(input);

    // Step 2: Normalize (remove .., //, etc)
    const normalized = path.normalize(expanded);

    // Step 3: Resolve to absolute
    const absolute = path.isAbsolute(normalized)
      ? normalized
      : path.resolve(process.cwd(), normalized);

    // Step 4: Verify existence
    const stat_ = await stat(absolute);
    const isDirectory = stat_.isDirectory();

    if (type === 'file' && isDirectory) {
      return { valid: false, absolute, error: 'Is directory, not file' };
    }
    if (type === 'directory' && !isDirectory) {
      return { valid: false, absolute, error: 'Is file, not directory' };
    }

    return { valid: true, absolute };
  } catch (err) {
    return {
      valid: false,
      absolute: path.resolve(process.cwd(), input),
      error: err instanceof Error ? err.message : 'Invalid path'
    };
  }
};

// Tilde expansion (no npm package needed)
const expandTilde = (inputPath: string): string => {
  if (inputPath.startsWith('~')) {
    return inputPath.replace('~', os.homedir());
  }
  if (inputPath.startsWith('$HOME/')) {
    return inputPath.replace('$HOME', os.homedir());
  }
  return inputPath;
};
```

### 2. Real-time Validation in Ink.js

```typescript
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useState, useCallback, useEffect } from 'react';

interface PathInputProps {
  type?: 'file' | 'directory';
  onSelect: (path: string) => void;
  defaultValue?: string;
}

export function PathInput({ type = 'file', onSelect, defaultValue = '' }: PathInputProps) {
  const [input, setInput] = useState(defaultValue);
  const [validation, setValidation] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    message: string;
    absolute?: string;
  }>({ status: 'idle', message: '' });

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!input.trim()) {
        setValidation({ status: 'idle', message: '' });
        return;
      }

      setValidation(prev => ({ ...prev, status: 'validating' }));
      const result = await validatePath(input, type);

      setValidation({
        status: result.valid ? 'valid' : 'invalid',
        message: result.error || (result.valid ? 'Path OK' : 'Invalid'),
        absolute: result.absolute
      });
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [input, type]);

  const handleSubmit = (value: string) => {
    if (validation.status === 'valid' && validation.absolute) {
      onSelect(validation.absolute);
    }
  };

  const statusColor = {
    idle: 'gray',
    validating: 'yellow',
    valid: 'green',
    invalid: 'red'
  }[validation.status];

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text>Enter {type} path: </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="~/projects/app or /absolute/path"
        />
      </Box>

      {input && (
        <Box marginLeft={2}>
          <Text color={statusColor}>
            {validation.status === 'validating' && '⏳ '}
            {validation.status === 'valid' && '✓ '}
            {validation.status === 'invalid' && '✗ '}
            {validation.message}
          </Text>
          {validation.absolute && (
            <Text color="gray"> → {validation.absolute}</Text>
          )}
        </Box>
      )}
    </Box>
  );
}
```

### 3. Safe Path Sandboxing

Prevent directory traversal attacks:
```typescript
const isSafePath = (userPath: string, rootDir: string): boolean => {
  const absolute = path.resolve(process.cwd(), userPath);
  const safeRoot = path.resolve(rootDir);

  // Ensure resolved path stays within root
  const relative = path.relative(safeRoot, absolute);
  return !relative.startsWith('..');
};

// Usage
const allowedRoot = '/home/user/projects';
const userInput = '../../../etc/passwd';
console.log(isSafePath(userInput, allowedRoot)); // false
```

### 4. Autocomplete Suggestions

```typescript
const generatePathSuggestions = async (input: string): Promise<string[]> => {
  try {
    const expanded = expandTilde(input);
    const dir = path.dirname(expanded);
    const pattern = path.basename(expanded);

    const entries = await readdir(dir);
    return entries
      .filter(name => name.startsWith(pattern))
      .map(name => path.join(dir, name))
      .slice(0, 10); // Limit to 10
  } catch {
    return [];
  }
};

// In TextInput:
<TextInput
  value={input}
  onChange={setInput}
  suggestions={suggestions}
/>
```

## Implementation Checklist

| Feature | Method | Status |
|---------|--------|--------|
| Path normalization | path.normalize() | ✓ Built-in |
| Absolute conversion | path.resolve() | ✓ Built-in |
| Tilde expansion | os.homedir() | ✓ Manual |
| Existence check | fs.stat() | ✓ Built-in |
| Type verification (file/dir) | stat.isDirectory() | ✓ Built-in |
| Real-time feedback | Ink TextInput + debounce | ✓ Implementable |
| Traversal prevention | path.relative() | ✓ Built-in |
| Autocomplete | fs.readdir() + filter | ✓ Implementable |

## Integration with Existing TUI

Current codebase (use-import.ts) reads from cwd:
```typescript
const files = await readdir('.');
```

**Enhancement path:**
1. Add PathInput component for user-selected import paths
2. Replace hardcoded readdir('.') with validated input
3. Add suggestions from common locations (projects/, exports/)
4. Show validation status during input

## Performance Considerations

- Debounce fs.stat() calls (300-500ms recommended)
- Cache suggestions to avoid repeated readdir calls
- Use fs/promises (non-blocking) throughout
- Limit suggestions array to 10-15 items

## Security Notes

- Path traversal prevention essential (see isSafePath example)
- Always resolve to absolute paths before fs operations
- Validate type (file vs directory) before use
- Consider readonly operations for untrusted input

---

**Report Date:** 2026-01-14 | **Token Efficiency:** Prioritized practical code over exhaustive API coverage | **Unresolved:** Whether to use expand-tilde npm package vs manual expansion (manual recommended for simplicity)

## Sources

- [Node.js Path Module Documentation v25.3.0](https://nodejs.org/api/path.html)
- [GeeksforGeeks: Node.js path.resolve()](https://www.geeksforgeeks.org/javascript/node-js-path-resolve-method/)
- [2ality: Working with Node.js Paths](https://2ality.com/2022/07/nodejs-path.html)
- [GitHub: expand-tilde Package](https://github.com/jonschlinkert/expand-tilde)
- [npm: expand-tilde](https://www.npmjs.com/package/expand-tilde)
- [Snyk: expand-tilde Usage](https://snyk.io/advisor/npm-package/expand-tilde/functions/expand-tilde)
- [GitHub: Ink - React for CLIs](https://github.com/vadimdemedes/ink)
- [GitHub: ink-ui Documentation](https://github.com/vadimdemedes/ink-ui)
- [GitHub: ink-text-input Component](https://github.com/vadimdemedes/ink-text-input)
- [Medium: Terminal Apps with Ink + React + TypeScript](https://medium.com/@pixelreverb/creating-a-terminal-application-with-ink-react-typescript-an-introduction-da49f3c012a8)
- [LogRocket: Add Interactivity to CLIs with React](https://blog.logrocket.com/add-interactivity-to-your-clis-with-react/)
