# TUI Export Functionality Not Working

**Date**: 2026-01-14
**Issue**: Export dialog does not appear when user presses [x] key
**Severity**: High
**Status**: Root cause identified

---

## Executive Summary

Export functionality completely non-functional. When user presses [x], nothing happens - no UI, no errors, no feedback. Root cause identified as **incorrect keyboard binding scope** in `use-keyboard.ts`. Export key handler placed inside `application`-only conditional block, preventing it from triggering in all contexts.

**Impact**: Users cannot export projects/services at all. Feature completely broken despite UI showing [x] export shortcut as available.

**Root Cause**: Export handler scoped to `activeResource.type === 'application'` only, but should work at project level or globally.

---

## Technical Analysis

### 1. Implementation Flow

Export flow properly implemented across multiple files:

**State Management** (`app-context.tsx`):
- `showExportDialog: boolean` - controls dialog visibility
- `exportStep: 'select' | 'path'` - two-step wizard state
- Proper setters: `setShowExportDialog`, `setExportStep`

**Export Hook** (`use-export.ts`):
- `openExportDialog()` - validates project/env, sets state
- `getExportableResources()` - fetches exportable items
- `executeExport()` - performs actual export
- Proper validation: requires `activeProject` and `activeEnvironment`

**UI Components**:
- `ExportDialog` - two-step dialog (select services → enter path)
- `Layout` - correctly renders dialog when `showExportDialog === true`
- Multi-select, path input - properly integrated

**Hook Wiring** (`app.tsx`):
- Export hook called: `const { openExportDialog, showExportDialog } = useExport()`
- Handler passed to keyboard: `onExport: openExportDialog`
- Dialog disabled during other modals: correctly included in `disabled` condition

### 2. The Bug

**Location**: `src/tui/hooks/use-keyboard.ts` lines 239-268

**Current Code** (INCORRECT):
```typescript
// Resource actions (only when resource is selected and in main panel)
if (activeResource && activePanel === 'main') {
  // Application-specific actions
  if (activeResource.type === 'application') {
    if (input === 'd' && onDeploy) { ... }
    if (input === 's' && onStop) { ... }
    if (input === 'S' && onStart) { ... }
    if (input === 'r' && onRestart) { ... }
    if (input === 'D' && onDelete) { ... }

    // Export (x key) ← WRONG SCOPE!
    if (input === 'x' && onExport) {
      onExport();
      return;
    }
  }
  // ... other resource type handlers
}
```

**Problem**: Export handler inside `if (activeResource.type === 'application')` block

**Consequences**:
1. Export only available when activeResource type is 'application'
2. Does NOT work for databases, compose services, or when no resource selected
3. Does NOT work when in sidebar panel
4. Export is project-level operation, should not be resource-scoped

### 3. Status Bar Mismatch

**Location**: `src/tui/components/status-bar.tsx` lines 66-74

**Current Code**:
```typescript
// Global actions (always available)
if (activePanel !== 'logs') {
  shortcuts.push(
    { key: 'x', label: 'export' },  // ← Shows as "global"
    { key: 'I', label: 'import' },
    { key: 'P', label: 'poll' },
    { key: '/', label: 'search' }
  );
}
```

**Problem**: Status bar displays [x] as globally available action, but keyboard handler requires:
- `activeResource !== null`
- `activePanel === 'main'`
- `activeResource.type === 'application'`

This creates **misleading UX** - user sees [x] shortcut but pressing it does nothing in most contexts.

### 4. Import Comparison

Import functionality works correctly:

```typescript
// Import (I key) - works for any resource type in main panel
if (input === 'I' && onImport) {
  onImport();
  return;
}
```

Import handler placed OUTSIDE resource type conditionals, inside main `if (activeResource && activePanel === 'main')` block. Still scoped but works for any resource type.

---

## Evidence

### File Analysis

1. **Export Dialog** (`export-dialog.tsx`)
   - Correctly checks `showExportDialog` at line 96: `if (!showExportDialog) return null;`
   - Proper two-step UI implemented
   - No errors in component logic

2. **Export Hook** (`use-export.ts`)
   - `openExportDialog` validates project/env at lines 41-44
   - Properly sets state: `setExportStep('select')` and `setShowExportDialog(true)` at lines 46-47
   - Returns correct values at lines 222-229

3. **Layout** (`layout.tsx`)
   - Correct dialog rendering at lines 54-57:
     ```typescript
     : showExportDialog ? (
       <Box height={contentHeight}>
         <ExportDialog />
       </Box>
     ```
   - Dialog shown when `showExportDialog === true`

4. **App Wiring** (`app.tsx`)
   - Export hook initialized at line 65: `const { openExportDialog, showExportDialog } = useExport();`
   - Handler passed at line 226: `onExport: openExportDialog,`
   - Disabled correctly at line 230

5. **Keyboard Handler** (`use-keyboard.ts`)
   - **BUG LOCATION**: Lines 264-268
   - Export inside `application`-only block (line 243)
   - Import works (line 306-308) - placed outside type-specific blocks

### Scope Requirements Comparison

| Action | Scope | Panel | Resource Type | Notes |
|--------|-------|-------|---------------|-------|
| Deploy | Resource-level | main | application, compose | Correct |
| Import | Resource-level | main | any | Correct - outside type blocks |
| Export | **Project-level** | main | **application ONLY** | **INCORRECT** |
| Info (i) | Resource-level | main | any | Correct - outside type blocks |

Export should match Import's scope or be even broader (project-level, not resource-level).

---

## Solution Design

### Fix Option 1: Match Import Scope (Recommended)

Move export handler outside application-specific block, alongside import handler:

```typescript
// Resource actions (only when resource is selected and in main panel)
if (activeResource && activePanel === 'main') {
  // Application-specific actions
  if (activeResource.type === 'application') {
    // ... deploy, stop, start, restart, delete
  }

  // Info panel (i key) - works for all resource types
  if (input === 'i' && onOpenDetail) { ... }

  // Database actions ...
  // Compose actions ...

  // Import/Export (works for any resource type in main panel)
  if (input === 'I' && onImport) {
    onImport();
    return;
  }

  if (input === 'x' && onExport) {  // ← MOVE HERE
    onExport();
    return;
  }
}
```

**Pros**: Simple, consistent with import, allows export from any resource in main panel
**Cons**: Still requires resource selection and main panel

### Fix Option 2: Global Export (Most Flexible)

Move export outside resource requirement (sidebar + main panels):

```typescript
// Export (x key) - works in sidebar or main panel
if (input === 'x' && onExport && activePanel !== 'logs') {
  onExport();
  return;
}
```

**Pros**: Matches status bar's "global" presentation, works from sidebar (project view)
**Cons**: More permissive, might conflict with future features

### Fix Option 3: Sidebar + Main Panels

Allow export from sidebar OR main panel:

```typescript
// Export (x key) - works when project is selected
if (input === 'x' && onExport && (activePanel === 'sidebar' || activePanel === 'main')) {
  onExport();
  return;
}
```

**Pros**: Works in both project view (sidebar) and resource view (main)
**Cons**: Slightly more complex condition

---

## Recommended Fix

**Option 1** - move export handler to match import scope.

**Justification**:
1. Minimal code change
2. Consistent with existing import pattern
3. Export hook already validates `activeProject` and `activeEnvironment`
4. Maintains some scoping (requires main panel + resource selection)

**Alternative**: If export should work from sidebar (project level without resource selection), use Option 3.

**Status Bar Update**: If using Option 1, move export from "Global actions" to resource-specific shortcuts or keep as-is since it works in main panel with any resource.

---

## Additional Observations

1. **No Error Handling**: When user presses [x] in wrong context (database, compose, sidebar), no feedback shown. Silent failure.

2. **Import Works**: Import correctly scoped outside type-specific blocks, demonstrates proper pattern.

3. **Export Logic Sound**: All export implementation code (hook, dialog, state) correctly designed. Only keyboard binding scoped incorrectly.

4. **Validation Present**: `openExportDialog()` validates project/environment and shows error message if missing. This validation prevents issues even with broader scoping.

---

## Files Involved

**To Fix**:
- `src/tui/hooks/use-keyboard.ts` - move export handler (lines 264-268)

**Optional Update**:
- `src/tui/components/status-bar.tsx` - adjust shortcut placement if scoping changes

**No Changes Needed**:
- `src/tui/components/export-dialog.tsx` - working correctly
- `src/tui/hooks/use-export.ts` - working correctly
- `src/tui/app.tsx` - wired correctly
- `src/tui/components/layout.tsx` - renders correctly
- `src/tui/context/app-context.tsx` - state management correct

---

## Testing Checklist

After fix:
1. ✓ Press [x] when application resource selected in main panel
2. ✓ Press [x] when database resource selected in main panel
3. ✓ Press [x] when compose resource selected in main panel
4. ✓ Press [x] in sidebar panel (if Option 2/3 chosen)
5. ✓ Verify export dialog appears with correct resources
6. ✓ Complete export flow (select services → enter path → export)
7. ✓ Check export works without resource selection (if Option 2/3)
8. ✓ Verify validation error shown when no project selected
9. ✓ Confirm [I] import still works after changes

---

## Unresolved Questions

1. Should export work from sidebar (project view) without resource selection?
2. Should status bar show [x] only when available, or always (with validation)?
3. Should silent key press failures show feedback/error messages?
