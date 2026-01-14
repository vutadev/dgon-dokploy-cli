# Design Report: Layout Height Consistency Fix

**Date:** 2026-01-14
**Type:** Bug Fix
**Component:** TUI Layout System
**Priority:** High

## Problem Statement

`AppDetailPanel` rendered without proper height wrapper, causing layout inconsistency compared to `ImportDialog` and `ExportDialog`.

### Root Cause
- `AppDetailPanel` rendered directly in `layout.tsx:48-49`
- `ImportDialog` and `ExportDialog` wrapped in `<Box height={contentHeight}>`
- `AppDetailPanel` had fixed `height={16}` internally, preventing responsive behavior

## Solution

### 1. Created Design Guidelines Document
**File:** `/docs/design-guidelines.md`

Established TUI design system covering:
- Dialog/panel wrapper pattern (height consistency)
- Component internal structure (flexible heights)
- Border and spacing standards
- Color scheme and typography
- Keyboard navigation conventions
- Accessibility requirements
- Layout calculation logic

### 2. Fixed Layout Wrapper Pattern
**File:** `src/tui/components/layout.tsx`

**Before:**
```tsx
{showDetailPanel ? (
  <AppDetailPanel />
) : showImportDialog ? (
  <Box height={contentHeight}>
    <ImportDialog />
  </Box>
) : ...}
```

**After:**
```tsx
{showDetailPanel ? (
  <Box height={contentHeight}>
    <AppDetailPanel />
  </Box>
) : showImportDialog ? (
  <Box height={contentHeight}>
    <ImportDialog />
  </Box>
) : ...}
```

### 3. Made AppDetailPanel Responsive
**File:** `src/tui/components/app-detail-panel.tsx`

**Changes:**
- Removed fixed `height={16}` prop
- Kept `flexGrow={1}` on content area
- Component now adapts to parent container height

## Design Principles Applied

### Dialog/Panel Wrapper Pattern
All overlays MUST follow consistent pattern:
```tsx
<Box height={contentHeight}>
  <DialogComponent />
</Box>
```

**Where:**
- `contentHeight = Math.max(rows - 6 - searchHeight, 10)`
- `6` = header(3) + status bar(3)
- `searchHeight` = 1 if search active, else 0
- Minimum 10 rows for usability

### Component Internal Guidelines
- No fixed heights in dialog components
- Use `flexGrow={1}` for expanding content
- Let parent container control overall height
- Use `minHeight` only when necessary

## Impact

### Fixed Components
1. ✅ **AppDetailPanel** - Now wrapped + responsive
2. ✅ **ImportDialog** - Already wrapped (verified)
3. ✅ **ExportDialog** - Already wrapped (verified)
4. ✅ Normal content - Already wrapped (verified)

### Benefits
- Consistent layout behavior across all dialogs
- Responsive to terminal size changes
- Better UX with uniform spacing
- Maintainable pattern documented in guidelines

## Testing

### Build Verification
```bash
npm run build
# ✅ Bundled 865 modules in 154ms
```

### Expected Behavior
- All dialogs render with same height
- Content adapts to available space
- No overflow or truncation issues
- Consistent visual appearance

### Test Scenarios
1. Open AppDetailPanel (Ctrl+I on resource)
2. Open ImportDialog (Ctrl+X)
3. Open ExportDialog (Ctrl+W)
4. Resize terminal window
5. Verify all dialogs maintain consistent height

## Files Modified

1. `/docs/design-guidelines.md` (created)
   - Comprehensive TUI design system documentation

2. `/src/tui/components/layout.tsx`
   - Wrapped `AppDetailPanel` in `<Box height={contentHeight}>`

3. `/src/tui/components/app-detail-panel.tsx`
   - Removed fixed `height={16}` prop
   - Component now responsive to parent container

## Design Standards Established

### Color Scheme
- Primary: `cyan` (headers, borders, active)
- Success: `green` (running status)
- Warning: `yellow` (pending, hotkeys)
- Error: `red` (error status)
- Muted: `dimColor` (helper text)

### Typography
- Headers: `bold` + `color="cyan"`
- Active: `bold` + `inverse`
- Labels: `dimColor`
- Status: contextual colors

### Keyboard Navigation
- `Esc` - Close/back
- `Enter` - Confirm/next
- `↑/↓` or `j/k` - Navigate lists
- `←/→` or `h/l` - Navigate tabs
- `Space` - Toggle (multi-select)
- `a` - Select all
- `n` - Deselect all

## Future Considerations

### Pattern Enforcement
- Use design guidelines for new dialogs
- Code review checklist: verify height wrapper
- Consider linting rule for pattern enforcement

### Responsive Behavior
- Test with various terminal sizes (min 80x24)
- Handle edge cases (very small terminals)
- Consider adding overflow indicators

### Accessibility
- Maintain keyboard hints visibility
- Ensure consistent color coding
- Provide visual feedback for all interactions

## Conclusion

Successfully established consistent layout pattern across all TUI dialogs. Created comprehensive design guidelines for future development. All dialogs now render with uniform height behavior.

**Status:** ✅ Complete
**Build:** ✅ Passing
**Pattern:** ✅ Documented
