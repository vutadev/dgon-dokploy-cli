# Phase 3: Export Dialog + Hook

## Context

Current export is inline in `app.tsx` (lines 210-261), single app only. Need modal dialog with service selection.

## Overview

Create export dialog that shows all resources in active environment, allows multi-select, and custom file path.

## Requirements

1. **Export scope**:
   - Project-level (all resources in environment) OR
   - Selected services only

2. **Dialog flow**:
   ```
   1. Show services list (multi-select)
   2. Show path input (defaults to `{project-name}-export.json`)
   3. Confirm -> execute export
   ```

3. **Resource types to export**:
   - Applications (existing)
   - Compose services (new)
   - Databases (new)

## Architecture

```
src/tui/
  hooks/
    use-export.ts           # Export orchestration
  components/
    export-dialog.tsx       # Two-step dialog
```

## Implementation Steps

### Step 1: Create `use-export.ts` hook

```typescript
// /src/tui/hooks/use-export.ts
import { useState, useCallback } from 'react';
import { writeFile } from 'fs/promises';
import { useAppContext } from '../context/app-context.js';
import { api } from '../../lib/api.js';
import type { Resource, ApplicationFull, DatabaseFull, ComposeFull } from '../../types/index.js';

interface ExportableResource {
  id: string;
  name: string;
  type: 'application' | 'compose' | 'database';
  dbType?: string;
}

interface UseExportReturn {
  showExportDialog: boolean;
  exportStep: 'select' | 'path';
  exportableResources: ExportableResource[];
  openExportDialog: () => void;
  closeExportDialog: () => void;
  executeExport: (selectedIds: string[], outputPath: string) => Promise<void>;
  setExportStep: (step: 'select' | 'path') => void;
}
```

Logic:
1. `openExportDialog()` - gather resources from `activeEnvironment`, set step='select'
2. Step 'select' -> user picks services
3. Step 'path' -> user enters output path
4. `executeExport()` - fetch full data for selected, write to file

### Step 2: Add context state

Add to `app-context.tsx`:
```typescript
// In AppState
showExportDialog: boolean;
exportStep: 'select' | 'path';

// In AppContextValue
setShowExportDialog: (show: boolean) => void;
setExportStep: (step: 'select' | 'path') => void;
```

### Step 3: Create `export-dialog.tsx` component

```tsx
// /src/tui/components/export-dialog.tsx
import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import { MultiSelectList } from './multi-select-list.js';
import { PathInput } from './path-input.js';
import { useExport } from '../hooks/use-export.js';
import { useMultiSelect } from '../hooks/use-multi-select.js';
import { usePathInput } from '../hooks/use-path-input.js';
```

Dialog structure:
```
+-- Export Project ----------------------+
| Step 1: Select services                |
|                                        |
| [x] my-api (application)               |
| [x] my-db (postgres)                   |
| [ ] my-compose (compose)               |
|                                        |
| 2/3 selected                           |
|                                        |
| [Space] toggle [a] all [Enter] next    |
+-----------------------------------------+
```

Step 2:
```
+-- Export Project ----------------------+
| Step 2: Output path                    |
|                                        |
| Path: ~/my-project-export.json_        |
|       ✓ Valid                          |
|                                        |
| [Enter] export [Esc] back              |
+-----------------------------------------+
```

### Step 4: Wire up in app.tsx

Replace inline export (lines 210-261) with:
```typescript
const { openExportDialog, showExportDialog } = useExport();
```

Update keyboard handler:
```typescript
onExport: openExportDialog,
```

### Step 5: Update layout.tsx

Add export dialog render:
```tsx
{showExportDialog && <ExportDialog />}
```

## Success Criteria

- [ ] Dialog shows all resources from active environment
- [ ] Multi-select works for service selection
- [ ] Path input validates correctly
- [ ] Export creates valid JSON file
- [ ] Dialog closes after successful export
- [ ] Error handling for API/file failures
- [ ] Hook file under 120 lines
- [ ] Component file under 150 lines

## Testing Notes

1. Export single app -> verify JSON structure
2. Export multiple resource types -> verify all included
3. Invalid path -> verify error message
4. Empty selection -> prevent export or show warning
