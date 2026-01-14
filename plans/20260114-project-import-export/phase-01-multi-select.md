# Phase 1: Multi-Select Infrastructure

## Context

Both export and import dialogs need multi-select capability for service selection. Create reusable components.

## Overview

Build a multi-select hook and component that handles checkbox state, keyboard navigation, and visual feedback.

## Requirements

1. **Keyboard bindings**:
   - `Space` - toggle current item
   - `a` - select all
   - `d` - deselect all
   - `j/k` or arrows - navigate
   - `Enter` - confirm selection
   - `Escape` - cancel

2. **Visual feedback**:
   - Checkbox indicator: `[x]` selected, `[ ]` unselected
   - Current item highlighting (inverse/cyan)
   - Selection count in header

3. **API**:
   ```typescript
   interface MultiSelectItem<T> {
     id: string;
     label: string;
     data: T;
     selected: boolean;
   }
   ```

## Architecture

```
src/tui/
  hooks/
    use-multi-select.ts     # State management + keyboard handlers
  components/
    multi-select-list.tsx   # Render component
```

## Implementation Steps

### Step 1: Create `use-multi-select.ts` hook

```typescript
// /src/tui/hooks/use-multi-select.ts
import { useState, useCallback } from 'react';

interface UseMultiSelectOptions<T> {
  items: Array<{ id: string; label: string; data: T }>;
  initialSelected?: string[];
}

interface UseMultiSelectReturn<T> {
  items: Array<{ id: string; label: string; data: T; selected: boolean }>;
  selectedIndex: number;
  selectedCount: number;
  toggle: (id: string) => void;
  toggleCurrent: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  moveUp: () => void;
  moveDown: () => void;
  getSelected: () => Array<{ id: string; label: string; data: T }>;
}
```

Logic:
- Maintain `selectedIds: Set<string>` and `currentIndex: number`
- `toggle(id)` - add/remove from set
- `selectAll()` - add all item IDs to set
- `deselectAll()` - clear set
- `getSelected()` - filter items by selectedIds

### Step 2: Create `multi-select-list.tsx` component

```tsx
// /src/tui/components/multi-select-list.tsx
import { Box, Text, useInput } from 'ink';

interface Props<T> {
  items: Array<{ id: string; label: string; selected: boolean; data: T }>;
  selectedIndex: number;
  onToggle: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  maxVisible?: number;
}
```

Features:
- Scrollable list when items exceed `maxVisible` (default 8)
- Show selection count: "3/10 selected"
- Hint bar: "[Space] toggle  [a] all  [d] none  [Enter] confirm"

### Step 3: Export types for reuse

Add to hook file:
```typescript
export type { MultiSelectItem, UseMultiSelectReturn };
```

## Success Criteria

- [ ] Hook manages selection state correctly
- [ ] All keyboard shortcuts functional
- [ ] Component renders checkbox states
- [ ] Scrolling works for long lists
- [ ] Selection count updates in real-time
- [ ] Hook file under 80 lines
- [ ] Component file under 80 lines

## Testing Notes

Manual test scenarios:
1. Select/deselect individual items
2. Select all, then deselect specific items
3. Navigate list with j/k
4. List scrolling with >8 items
