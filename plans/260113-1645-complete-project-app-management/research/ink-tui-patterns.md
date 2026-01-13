# Ink TUI Implementation Patterns Research

**Date:** 2026-01-13 | **Focus:** Dialog, tabs, keyboard shortcuts, modal overlays

---

## 1. Confirm Dialogs

**Pattern:** Conditional render + state-driven focus

```tsx
const ConfirmDialog = ({ visible, onConfirm, onCancel }) => {
  const [selected, setSelected] = useState('cancel');

  useInput((input, key) => {
    if (!visible) return;

    if (key.leftArrow || key.rightArrow) {
      setSelected(s => s === 'confirm' ? 'cancel' : 'confirm');
    }
    if (key.return) {
      selected === 'confirm' ? onConfirm() : onCancel();
    }
  });

  if (!visible) return null;

  return (
    <Box flexDirection="column">
      <Text>Are you sure?</Text>
      <Box gap={2} marginTop={1}>
        <Text inverse={selected === 'confirm'}>Confirm</Text>
        <Text inverse={selected === 'cancel'}>Cancel</Text>
      </Box>
    </Box>
  );
};
```

**Key:** Manage selection state, use `inverse` for visual feedback, conditionally render.

---

## 2. Tabbed Detail Panels

**Pattern:** Tab state + content routing + focus context

```tsx
const TabbedPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Info', 'Logs', 'Settings'];

  useInput((input, key) => {
    if (key.rightArrow) setActiveTab(t => (t + 1) % tabs.length);
    if (key.leftArrow) setActiveTab(t => (t - 1 + tabs.length) % tabs.length);
  });

  return (
    <Box flexDirection="column">
      <Box gap={2}>
        {tabs.map((tab, i) => (
          <Text key={i} inverse={i === activeTab}>{tab}</Text>
        ))}
      </Box>
      <Box marginTop={1}>
        {activeTab === 0 && <InfoPanel />}
        {activeTab === 1 && <LogsPanel />}
        {activeTab === 2 && <SettingsPanel />}
      </Box>
    </Box>
  );
};
```

**Key:** Arrow keys for tab switching, render only active content, inverse styling for current tab.

---

## 3. Keyboard Shortcuts Handling

**Architecture:** Centralized input dispatcher

```tsx
const useKeyboardShortcuts = (shortcuts) => {
  useInput((input, key) => {
    // Check modifiers: key.ctrl, key.shift, key.meta
    if (key.ctrl && input === 'c') shortcuts.onCtrlC?.();
    if (key.ctrl && input === 'e') shortcuts.onCtrlE?.();
    if (input === '?') shortcuts.onHelp?.();
    if (input === 'q') shortcuts.onQuit?.();
  });
};

// Usage in app:
useKeyboardShortcuts({
  onCtrlC: () => process.exit(0),
  onCtrlE: () => toggleEditor(),
  onHelp: () => showHelp(),
  onQuit: () => process.exit(0)
});
```

**Key:** Leverage `key.ctrl`, `key.shift`, `key.meta` for modifiers. Centralize to avoid conflicts.

---

## 4. Modal-Like Overlays (Focus Capture)

**Pattern:** Portal-style conditional rendering + focus trapping

```tsx
const Modal = ({ visible, title, children, onClose }) => {
  const { focusManager } = useFocusManager();

  useInput((input, key) => {
    if (!visible) return;
    if (key.escape) onClose();
  });

  if (!visible) return null;

  // Render full-screen overlay with Box flexDirection="column" + justifyContent="center"
  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center">
      <Box borderStyle="round" padding={1} flexDirection="column">
        <Text bold>{title}</Text>
        <Box marginTop={1}>{children}</Box>
        <Text dimmed marginTop={1}>Press ESC to close</Text>
      </Box>
    </Box>
  );
};
```

**Key:**
- Render nothing if `visible` is false (don't render behind)
- Use `Box` with centering for positioning
- ESC to close
- Input blocking: `useInput` check `visible` early to prevent parent handling

---

## 5. Best Practices Summary

| Pattern | Implementation |
|---------|----------------|
| **Input Blocking** | Check visibility/mode in `useInput` early return |
| **Focus Flow** | Use `useFocusManager()` + `useFocus()` for Tab navigation |
| **Visual Feedback** | `inverse`, `dimmed`, colors via chalk/colors for state |
| **State Routing** | Conditional JSX based on `activeTab`/`activeModal` state |
| **Keyboard** | `key.ctrl`, `key.shift`, `key.meta`, arrow keys, return/escape |
| **Layout** | `Box` with flexDirection, justifyContent, alignItems for positioning |

---

## Core Hooks Reference

- **`useInput(handler)`** – Capture keystrokes; check visibility early
- **`useFocusManager()`** – Get manager to control focus programmatically
- **`useFocus({id})`** – Mark component as focusable
- **`useApp()`** – Access exit/unmount lifecycle

---

## Unresolved Questions

- Tab order when mixing `useFocus()` manual registration with implicit focus flow?
- Performance impact of multiple modals with `useInput` chains?
- Best pattern for animations/transitions in terminal (delays, state sequences)?
