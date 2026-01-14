# Phase 2: Path Input Component

## Context

Export dialog needs file path input with validation. Users may enter relative paths, tildes, or invalid paths.

## Overview

Create validated file path input that normalizes paths and provides real-time feedback.

## Requirements

1. **Path handling**:
   - Resolve `~` to home directory
   - Normalize with `path.normalize()`
   - Validate parent directory exists (for export)
   - Support relative and absolute paths

2. **Input behavior**:
   - Inline text editing (similar to login-form.tsx)
   - Backspace to delete
   - Printable characters to append
   - Show validation state

3. **Validation messages**:
   - "Parent directory does not exist"
   - "Invalid path"
   - Green checkmark when valid

## Architecture

```
src/tui/
  hooks/
    use-path-input.ts       # Path normalization + validation
  components/
    path-input.tsx          # Render input field
```

## Implementation Steps

### Step 1: Create `use-path-input.ts` hook

```typescript
// /src/tui/hooks/use-path-input.ts
import { useState, useCallback, useEffect } from 'react';
import { stat } from 'fs/promises';
import { homedir } from 'os';
import { normalize, dirname, resolve, isAbsolute } from 'path';

interface UsePathInputOptions {
  initialValue?: string;
  mode: 'export' | 'import'; // export validates parent, import validates file
}

interface UsePathInputReturn {
  value: string;
  normalizedPath: string;
  isValid: boolean;
  error: string | null;
  isValidating: boolean;
  setValue: (value: string) => void;
  appendChar: (char: string) => void;
  deleteChar: () => void;
}
```

Path resolution logic:
```typescript
function resolvePath(input: string): string {
  let p = input.trim();
  if (p.startsWith('~')) {
    p = p.replace(/^~/, homedir());
  }
  p = normalize(p);
  if (!isAbsolute(p)) {
    p = resolve(process.cwd(), p);
  }
  return p;
}
```

Validation logic:
- `mode: 'export'` - check `dirname(path)` exists
- `mode: 'import'` - check `path` exists and is file
- Use debounced validation (200ms) to avoid excessive fs calls

### Step 2: Create `path-input.tsx` component

```tsx
// /src/tui/components/path-input.tsx
import { Box, Text } from 'ink';

interface Props {
  label: string;
  value: string;
  isValid: boolean;
  error: string | null;
  isValidating: boolean;
  isActive: boolean;
}
```

Render:
```
Path: [user input]_
       ^ validation status (green checkmark / red X / spinner)
```

### Step 3: Handle edge cases

- Empty input -> invalid, "Path required"
- Directory as input (export mode) -> append default filename
- Non-JSON extension -> warning but allow

## Success Criteria

- [ ] Tilde expansion works correctly
- [ ] Relative paths resolve to absolute
- [ ] Parent directory validation for export mode
- [ ] File existence validation for import mode
- [ ] Real-time validation feedback
- [ ] Hook file under 70 lines
- [ ] Component file under 50 lines

## Testing Notes

Test paths:
- `~/exports/app.json` - tilde expansion
- `./export.json` - relative path
- `/tmp/test.json` - absolute path
- `/nonexistent/path/file.json` - invalid parent
