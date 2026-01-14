# Research Report: Multi-Select Checkbox Interfaces in Terminal UIs with Ink/React

**Conducted:** 2026-01-14 | **Report Version:** 1.0

## Executive Summary

Multi-select checkbox interfaces in Ink/React CLIs leverage `useFocus` and `useInput` hooks for keyboard control. Standard patterns include arrow key navigation (up/down), spacebar toggle, 'a' for select-all, 'd' for deselect-all, and visual indicators via `[x]`/`[ ]` symbols. Component composition separates state management (container) from rendering (presentational). Inquirer.js and similar tools establish industry conventions: space toggles items, 'a'/'i' modify all selections, with on-screen instructions guiding users.

## Research Methodology

- Sources consulted: 4 (Ink documentation + community examples, Inquirer.js lib, web search results)
- Date range: 2024-2026
- Key search terms: Ink React hooks, multi-select checkbox, inquirer.js, keyboard navigation, CLI conventions

## Key Findings

### 1. Ink Framework Keyboard Hooks

**`useFocus` Hook:**
- Manages global focus state; tab between interactive components
- Each component has unique `id`; returns `{ isFocused, focus, enableFocus, disableFocus }`
- Best for top-level interactive elements; enables visual distinction via `isFocused`

**`useInput` Hook:**
- Captures raw keyboard input within a component
- Signature: `(input: string, key: Key) => void` where `key` has flags like `upArrow`, `downArrow`, `return`, `escape`, `shift`, `ctrl`
- Keeps Node.js process alive; use only when needed
- Wrap in `useCallback` to prevent unnecessary re-renders
- Guard with `if (!isFocused) return;` to avoid global keybinding conflicts

### 2. Standard Keyboard Navigation Patterns

| Key(s) | Action | Notes |
|--------|--------|-------|
| **Up/Down arrows** | Navigate between items | Cycle through selected list |
| **Space** | Toggle current item selection | Standard across CLI tools (inquirer.js, npm prompts) |
| **'a' / 'A'** | Select All | Toggle all items; customizable shortcut |
| **'d' / 'D'** | Deselect All | Custom implementation; not standard |
| **'i' / 'I'** | Invert Selection | Toggle selected ↔ unselected |
| **Enter** | Confirm & close | Exit multi-select mode |
| **Escape** | Cancel / close | Abandon selection |
| **Shift + Arrow** | Range selection | GUI-like range picking |

### 3. Visual Indicators (Rendering Patterns)

```tsx
// Checkbox symbol patterns (ASCII-friendly)
const Checkbox = ({ isSelected }) => (
  <Text>{isSelected ? '[x]' : '[ ]'}</Text>
);

// Focus indicator (left margin)
const FocusIndicator = ({ isFocused }) => (
  <Text>{isFocused ? '> ' : '  '}</Text>
);

// Complete item line
const MultiSelectOption = ({ label, isSelected, isFocused }) => (
  <Box>
    <Text>{isFocused ? '>' : ' '} </Text>
    <Text>{isSelected ? '[x]' : '[ ]'}</Text>
    <Text> {label}</Text>
  </Box>
);
```

### 4. Component Composition Pattern

**Container Component (MultiSelect):**
- Manages state: `selectedIds` (Set), `focusedIndex`
- Implements `useInput` for navigation & selection
- Handles 'a'/'d' shortcuts
- Renders child options with props

**Presentational Component (MultiSelectOption):**
- Receives: `id`, `label`, `isSelected`, `isFocused`, `onToggle`
- Renders checkbox + focus indicator + label
- No state management

```tsx
function MultiSelect({ options, onSelectChange }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const { isFocused } = useFocus({ id: 'multiselect' });

  const toggleOption = useCallback((id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
    onSelectChange(Array.from(newSelected));
  }, [selectedIds, onSelectChange]);

  useInput(useCallback((input, key) => {
    if (!isFocused) return;

    if (key.upArrow) {
      setFocusedIndex(i => (i - 1 + options.length) % options.length);
    } else if (key.downArrow) {
      setFocusedIndex(i => (i + 1) % options.length);
    } else if (input === ' ') {
      toggleOption(options[focusedIndex].id);
    } else if (input === 'a' || input === 'A') {
      const allIds = options.map(o => o.id);
      setSelectedIds(new Set(allIds));
      onSelectChange(allIds);
    } else if (input === 'd' || input === 'D') {
      setSelectedIds(new Set());
      onSelectChange([]);
    }
  }, [isFocused, focusedIndex, options, toggleOption]));

  return (
    <Box flexDirection="column">
      {options.map((opt, idx) => (
        <MultiSelectOption
          key={opt.id}
          label={opt.label}
          isSelected={selectedIds.has(opt.id)}
          isFocused={focusedIndex === idx}
          onToggle={() => toggleOption(opt.id)}
        />
      ))}
    </Box>
  );
}
```

### 5. Industry Conventions (Inquirer.js Standard)

Inquirer.js checkbox prompt establishes baseline UX expectations:
- **Space**: Core toggle (non-customizable)
- **'a'**: Select/toggle all (customizable, default)
- **'i'**: Invert selection (customizable, default)
- **Up/Down**: Navigate items
- **Enter**: Confirm and exit

On-screen instructions persist or display contextually. Users familiar with npm install prompts expect these patterns.

## Code Examples

### Minimal Multi-Select with Focus

```tsx
import React, { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import { useFocus, useInput } from 'ink';

export function MultiSelect({ items, onSubmit }) {
  const [selected, setSelected] = useState(new Set());
  const [cursor, setCursor] = useState(0);
  const { isFocused } = useFocus({ id: 'select' });

  useInput((input, key) => {
    if (!isFocused) return;

    if (key.upArrow) setCursor(c => Math.max(0, c - 1));
    else if (key.downArrow) setCursor(c => Math.min(items.length - 1, c + 1));
    else if (input === ' ') {
      const newSet = new Set(selected);
      newSet.has(cursor) ? newSet.delete(cursor) : newSet.add(cursor);
      setSelected(newSet);
    } else if (input === 'a') {
      setSelected(new Set(items.map((_, i) => i)));
    } else if (key.return) {
      onSubmit(Array.from(selected).map(i => items[i]));
    }
  }, { isActive: isFocused });

  return (
    <Box flexDirection="column">
      {items.map((item, i) => (
        <Box key={i}>
          <Text>{i === cursor ? '> ' : '  '}</Text>
          <Text>{selected.has(i) ? '[x]' : '[ ]'} {item}</Text>
        </Box>
      ))}
      <Text dimColor>(Space: toggle, a: all, Enter: done)</Text>
    </Box>
  );
}
```

### Using ink-select-input (Simpler Alternative)

Ink ecosystem provides `ink-select-input` for single-select lists. For multi-select, adapt by tracking selected state externally and rendering custom checkbox in item label.

## Best Practices

1. **Guard `useInput` with focus check** — Prevent global keybinding collisions
2. **Wrap handlers in `useCallback`** — Avoid triggering re-renders from non-dependency changes
3. **Cycle navigation** — Up from top → bottom; down from bottom → top (circular navigation)
4. **Spacebar always toggles** — No shift-space variants; keep it simple
5. **Display instructions inline** — Show "(Space: toggle, a: all, Enter: done)" footer
6. **Color focus indicator** — Use Ink's `color` prop; cyan for focused, default for unfocused
7. **Reuse Checkbox component** — Make `[x]`/`[ ]` rendering atomic and generic
8. **Batch state updates** — Use `useReducer` for complex multi-select logic

## Unresolved Questions

- **Range selection with Shift+Arrow**: Few Ink examples demonstrate this; verify terminal capability variance (e.g., iTerm vs alacritty)
- **Performance at scale**: No benchmarks for 500+ items; likely need virtualization (implement custom or explore community libraries)
- **Accessibility (screen reader support)**: Ink community docs light on ARIA attributes; unclear if useful in TTY context

## References

- [Ink GitHub Repository](https://github.com/vadimdemedes/ink)
- [Inquirer.js Checkbox Package](https://www.npmjs.com/package/@inquirer/checkbox)
- [Inquirer.js GitHub](https://github.com/SBoudrias/Inquirer.js)
- [Inquirer.js Checkbox README](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/checkbox/README.md)
- [DigitalOcean: Interactive Command-line Prompts with Inquirer.js](https://www.digitalocean.com/community/tutorials/nodejs-interactive-command-line-prompts)

---

**Report Location:** `/Users/rainy/projects/side-pj/dokploy-cli/plans/reports/260114-terminal-ui-multiselectcheckbox.md`
