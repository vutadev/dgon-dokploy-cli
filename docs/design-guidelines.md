# Design Guidelines - Dokploy CLI TUI

## Layout Patterns

### Dialog/Panel Wrapper Pattern
All overlays (dialogs, panels) MUST follow consistent height wrapper pattern:

**Standard Pattern:**
```tsx
{showDialog ? (
  <Box height={contentHeight}>
    <DialogComponent />
  </Box>
) : (
  // normal content
)}
```

**Key Points:**
- `contentHeight` calculated as `Math.max(rows - 6 - searchHeight, 10)`
- All dialogs/panels wrapped in `Box` with `height={contentHeight}`
- Individual components should NOT set fixed heights
- Use `flexGrow={1}` for content areas within dialogs

### Components Using Pattern
1. **ImportDialog** - Wrapped ✓
2. **ExportDialog** - Wrapped ✓
3. **AppDetailPanel** - Must be wrapped (FIX REQUIRED)
4. Normal content (Sidebar + MainContent/LogViewer) - Wrapped ✓

## Component Internal Structure

### Flexible Height Components
Components rendered inside height-constrained wrappers should:
- Remove fixed `height` props
- Use `flexGrow={1}` for expanding content areas
- Let parent container control overall height
- Use `minHeight` only when necessary for usability

### Border and Spacing
- Dialog/panel borders: `borderStyle="single"` + `borderColor="cyan"`
- Padding: `paddingX={1}` + `paddingY={1}` for dialog content
- Margins: `marginBottom={1}` for section spacing

## Color Scheme
- Primary: `cyan` (headers, borders, active states)
- Success: `green` (running status)
- Warning: `yellow` (pending, hotkeys)
- Error: `red` (error status)
- Muted: `dimColor` (helper text, metadata)
- Inverse: `inverse={true}` (active tab/selection)

## Typography
- Headers: `bold` + `color="cyan"`
- Active/selected: `bold` + `inverse`
- Labels: `dimColor`
- Status: contextual colors (green/yellow/red)

## Keyboard Navigation
- `Esc` - Close/back
- `Enter` - Confirm/next
- `↑/↓` or `j/k` - Navigate lists
- `←/→` or `h/l` - Navigate tabs
- `Space` - Toggle selection (multi-select)
- `a` - Select all
- `n` - Deselect all

## Accessibility
- Always show keyboard hints in dialogs
- Use consistent color coding for status
- Provide visual feedback for all interactions
- Maintain minimum content height (10 rows)

## Layout Calculation
```tsx
const searchHeight = isSearching ? 1 : 0;
const contentHeight = Math.max(rows - 6 - searchHeight, 10);
// 6 = header(3) + status bar(3)
// +1 if search active
// minimum 10 rows for usability
```
