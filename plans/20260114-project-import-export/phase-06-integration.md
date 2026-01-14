# Phase 6: Integration + Cleanup

## Context

All components built. Need integration, cleanup, and removal of old inline export code.

## Overview

Wire everything together, update keyboard shortcuts, clean up app.tsx.

## Requirements

1. Remove inline export from `app.tsx` (lines 210-261)
2. Update `layout.tsx` to render export dialog
3. Update keyboard disabled conditions
4. Ensure dialog z-ordering is correct
5. Add context state for export dialog

## Implementation Steps

### Step 1: Update `app-context.tsx`

Add export dialog state:
```typescript
// In AppState (add after importSelectedIndex)
showExportDialog: boolean;
exportStep: 'select' | 'path';
exportableResources: Array<{ id: string; name: string; type: string }>;

// In initial state
showExportDialog: false,
exportStep: 'select',
exportableResources: [],

// Add setters
setShowExportDialog: (show: boolean) => void;
setExportStep: (step: 'select' | 'path') => void;
setExportableResources: (resources: Array<...>) => void;
```

### Step 2: Update `app.tsx`

Remove lines 210-261 (inline handleExport).

Replace with:
```typescript
// Add import
import { useExport } from './hooks/use-export.js';

// In TUIApp()
const { openExportDialog, showExportDialog } = useExport();

// Update keyboard disabled condition
disabled: isRunning || isSearching || showServerSelector || showLoginForm ||
          showConfirm || showDetailPanel || showImportDialog || showExportDialog,
```

### Step 3: Update `layout.tsx`

Add export dialog:
```typescript
import { ExportDialog } from './export-dialog.js';
import { useAppContext } from '../context/app-context.js';

// In Layout()
const { ..., showExportDialog } = useAppContext();

// In render, add after ImportDialog
{showExportDialog && <ExportDialog />}
```

### Step 4: Update keyboard shortcut ('x')

In `use-keyboard.ts`, verify 'x' still triggers export:
```typescript
if (input === 'x' && onExport) {
  onExport();
  return;
}
```

Change behavior: 'x' should now work at project level (not just when app selected):
```typescript
// Move export shortcut outside of activeResource.type === 'application' block
// Allow 'x' when activeProject is set (export entire project)
if (input === 'x' && onExport && activeProject) {
  onExport();
  return;
}
```

### Step 5: Update status bar hints

In `status-bar.tsx`, update hints when project selected:
```typescript
// Project-level hints
<Text dimColor>[x] export project</Text>
```

### Step 6: Clean up imports

Remove unused imports from `app.tsx`:
```typescript
// Remove if no longer used
import { writeFile } from 'fs/promises';
import type { ApplicationFull, AppExport } from '../types/index.js';
```

### Step 7: Verify all files under 200 lines

File line counts target:
- `use-export.ts` - ~120 lines
- `use-import.ts` - ~180 lines (up from 128)
- `use-multi-select.ts` - ~80 lines
- `use-path-input.ts` - ~70 lines
- `export-dialog.tsx` - ~150 lines
- `import-dialog.tsx` - ~120 lines (up from 72)
- `multi-select-list.tsx` - ~80 lines
- `path-input.tsx` - ~50 lines
- `app-context.tsx` - ~230 lines (up from 205)

## Success Criteria

- [ ] Inline export removed from app.tsx
- [ ] Export dialog renders in layout
- [ ] 'x' key opens export dialog (project level)
- [ ] 'I' key still opens import dialog
- [ ] Dialog z-ordering correct (export/import on top)
- [ ] Keyboard disabled when dialogs open
- [ ] Status bar shows correct hints
- [ ] All files under 200 lines
- [ ] No TypeScript errors
- [ ] No unused imports

## Final Testing Checklist

### Export Flow
1. [ ] Select project in sidebar
2. [ ] Press 'x' to open export dialog
3. [ ] Services from active environment shown
4. [ ] Multi-select works (Space, a, d)
5. [ ] Navigate to path step
6. [ ] Enter custom path with tilde
7. [ ] Confirm export
8. [ ] File created with correct content
9. [ ] Success message shown

### Import Flow
1. [ ] Press 'I' to open import dialog
2. [ ] JSON files listed
3. [ ] Select project export file
4. [ ] Service selection shown (project exports)
5. [ ] Deselect some services
6. [ ] Confirm import
7. [ ] Only selected services created
8. [ ] Success message shown

### Edge Cases
1. [ ] Export with no resources selected -> warning
2. [ ] Import invalid JSON -> error message
3. [ ] Invalid export path -> validation error
4. [ ] Escape closes dialogs correctly
5. [ ] Keyboard disabled during dialog operations

## Unresolved Questions

None at this time. Implementation should proceed in sequence from Phase 1-6.
