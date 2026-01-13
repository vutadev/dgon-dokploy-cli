# Phase 3: TUI Enhancements

**Date:** 2026-01-13
**Priority:** P3
**Status:** Pending (Depends on Phase 1 types)
**Estimated Lines:** ~280

---

## Context Links

- [Main Plan](./plan.md)
- [Phase 1](./phase-01-core-cli.md) - ApplicationFull type
- [Brainstorm](../reports/brainstorm-2026-01-13-complete-project-app-management.md)
- Related: `src/tui/components/`, `src/tui/hooks/`, `src/tui/context/`

---

## Overview

Enhance TUI with confirmation dialogs, detailed app info panel, and extended keyboard shortcuts:
- **Confirm dialog** - Simple y/n prompt in status bar for destructive actions
- **App detail panel** - Read-only tabbed view (General|Env|Domains|Deployments)
- **Keyboard updates** - D=Delete, i=Info panel, x=Export

---

## Requirements

1. **Confirm Dialog Component** - Status bar y/n prompt for delete
2. **App Detail Panel** - Tabbed read-only info view
3. **Keyboard Shortcuts** - D (delete), i (info), x (export)
4. **Context Updates** - Support confirm and detail states

---

## Related Code Files

| File | Current Lines | Changes |
|------|---------------|---------|
| `src/tui/context/app-context.tsx` | 135 | Add confirm/detail state (~20) |
| `src/tui/components/confirm-dialog.tsx` | NEW | Create (~60) |
| `src/tui/components/app-detail-panel.tsx` | NEW | Create (~150) |
| `src/tui/hooks/use-confirm.ts` | NEW | Create (~40) |
| `src/tui/hooks/use-keyboard.ts` | 204 | Add D, i, x handlers (~30) |
| `src/tui/components/status-bar.tsx` | 65 | Integrate confirm prompt (~10) |
| `src/tui/components/layout.tsx` | - | Add detail panel |
| `src/tui/app.tsx` | 72 | Wire up new hooks |

---

## Implementation Steps

### 1. Update App Context (src/tui/context/app-context.tsx)

Add to AppState interface (after line 37):

```typescript
// Confirm dialog state
showConfirm: boolean;
confirmMessage: string;
confirmCallback: (() => void) | null;
// Detail panel state
showDetailPanel: boolean;
detailApp: ApplicationFull | null;
```

Add to initial state (after line 84):

```typescript
showConfirm: false,
confirmMessage: '',
confirmCallback: null,
showDetailPanel: false,
detailApp: null,
```

Add setters (after line 101):

```typescript
const setShowConfirm = useCallback((showConfirm: boolean) => setState((s) => ({ ...s, showConfirm })), []);
const setConfirmMessage = useCallback((confirmMessage: string) => setState((s) => ({ ...s, confirmMessage })), []);
const setConfirmCallback = useCallback((confirmCallback: (() => void) | null) => setState((s) => ({ ...s, confirmCallback })), []);
const setShowDetailPanel = useCallback((showDetailPanel: boolean) => setState((s) => ({ ...s, showDetailPanel })), []);
const setDetailApp = useCallback((detailApp: ApplicationFull | null) => setState((s) => ({ ...s, detailApp })), []);
```

Add to interface and value object accordingly.

### 2. Create Confirm Hook (src/tui/hooks/use-confirm.ts)

New file:

```typescript
import { useCallback } from 'react';
import { useAppContext } from '../context/app-context.js';

/**
 * Hook to manage confirmation dialogs
 * Shows y/n prompt in status bar
 */
export function useConfirm() {
  const {
    showConfirm,
    confirmMessage,
    confirmCallback,
    setShowConfirm,
    setConfirmMessage,
    setConfirmCallback,
  } = useAppContext();

  const requestConfirm = useCallback(
    (message: string, onConfirm: () => void) => {
      setConfirmMessage(message);
      setConfirmCallback(() => onConfirm);
      setShowConfirm(true);
    },
    [setConfirmMessage, setConfirmCallback, setShowConfirm]
  );

  const handleConfirmResponse = useCallback(
    (confirmed: boolean) => {
      if (confirmed && confirmCallback) {
        confirmCallback();
      }
      setShowConfirm(false);
      setConfirmMessage('');
      setConfirmCallback(null);
    },
    [confirmCallback, setShowConfirm, setConfirmMessage, setConfirmCallback]
  );

  return {
    showConfirm,
    confirmMessage,
    requestConfirm,
    confirm: () => handleConfirmResponse(true),
    cancel: () => handleConfirmResponse(false),
  };
}
```

### 3. Create Confirm Dialog Component (src/tui/components/confirm-dialog.tsx)

New file:

```typescript
import { Box, Text, useInput } from 'ink';
import { useConfirm } from '../hooks/use-confirm.js';

/**
 * Simple confirmation prompt displayed in status bar area
 * Responds to y/n/Escape keys
 */
export function ConfirmDialog() {
  const { showConfirm, confirmMessage, confirm, cancel } = useConfirm();

  useInput(
    (input, key) => {
      if (!showConfirm) return;

      if (input.toLowerCase() === 'y') {
        confirm();
      } else if (input.toLowerCase() === 'n' || key.escape) {
        cancel();
      }
    },
    { isActive: showConfirm }
  );

  if (!showConfirm) return null;

  return (
    <Box paddingX={1}>
      <Text color="yellow">{confirmMessage}</Text>
      <Text> </Text>
      <Text dimColor>[y/N]</Text>
    </Box>
  );
}
```

### 4. Create App Detail Panel (src/tui/components/app-detail-panel.tsx)

New file:

```typescript
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppContext } from '../context/app-context.js';

type Tab = 'general' | 'env' | 'domains' | 'deployments';
const tabs: Tab[] = ['general', 'env', 'domains', 'deployments'];

/**
 * Read-only detail panel showing app information
 * Tab navigation with arrow keys, Escape to close
 */
export function AppDetailPanel() {
  const { showDetailPanel, detailApp, setShowDetailPanel } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('general');

  useInput(
    (input, key) => {
      if (!showDetailPanel) return;

      if (key.escape) {
        setShowDetailPanel(false);
        return;
      }

      // Tab navigation
      if (key.leftArrow || input === 'h') {
        const idx = tabs.indexOf(activeTab);
        setActiveTab(tabs[Math.max(0, idx - 1)]);
      }
      if (key.rightArrow || input === 'l') {
        const idx = tabs.indexOf(activeTab);
        setActiveTab(tabs[Math.min(tabs.length - 1, idx + 1)]);
      }
    },
    { isActive: showDetailPanel }
  );

  if (!showDetailPanel || !detailApp) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      width="100%"
      height={16}
    >
      {/* Header */}
      <Box paddingX={1} justifyContent="space-between">
        <Text bold color="cyan">{detailApp.name}</Text>
        <Text dimColor>Esc to close</Text>
      </Box>

      {/* Tabs */}
      <Box paddingX={1} gap={2}>
        {tabs.map((tab) => (
          <Text
            key={tab}
            bold={tab === activeTab}
            color={tab === activeTab ? 'cyan' : undefined}
            inverse={tab === activeTab}
          >
            {' '}{tab.toUpperCase()}{' '}
          </Text>
        ))}
      </Box>

      {/* Content */}
      <Box flexDirection="column" paddingX={1} paddingY={1} flexGrow={1}>
        {activeTab === 'general' && <GeneralTab app={detailApp} />}
        {activeTab === 'env' && <EnvTab app={detailApp} />}
        {activeTab === 'domains' && <DomainsTab app={detailApp} />}
        {activeTab === 'deployments' && <DeploymentsTab app={detailApp} />}
      </Box>
    </Box>
  );
}

function GeneralTab({ app }: { app: any }) {
  return (
    <Box flexDirection="column">
      <Text>ID: <Text dimColor>{app.applicationId}</Text></Text>
      <Text>Status: <Text color={app.applicationStatus === 'running' ? 'green' : 'yellow'}>{app.applicationStatus}</Text></Text>
      <Text>Build: <Text dimColor>{app.buildType}</Text></Text>
      <Text>Source: <Text dimColor>{app.sourceType}</Text></Text>
      <Text>Replicas: <Text dimColor>{app.replicas}</Text></Text>
    </Box>
  );
}

function EnvTab({ app }: { app: any }) {
  const lines = (app.env || '').split('\n').filter(Boolean);
  return (
    <Box flexDirection="column">
      <Text dimColor>{lines.length} variable(s)</Text>
      {lines.slice(0, 8).map((line: string, i: number) => {
        const [key] = line.split('=');
        return <Text key={i}>{key}=***</Text>;
      })}
      {lines.length > 8 && <Text dimColor>... and {lines.length - 8} more</Text>}
    </Box>
  );
}

function DomainsTab({ app }: { app: any }) {
  const domains = app.domains || [];
  return (
    <Box flexDirection="column">
      {domains.length === 0 ? (
        <Text dimColor>(no domains)</Text>
      ) : (
        domains.slice(0, 6).map((d: any, i: number) => (
          <Text key={i}>
            {d.https ? 'https' : 'http'}://{d.host}{d.path || ''}
          </Text>
        ))
      )}
    </Box>
  );
}

function DeploymentsTab({ app }: { app: any }) {
  const deployments = app.deployments || [];
  return (
    <Box flexDirection="column">
      {deployments.length === 0 ? (
        <Text dimColor>(no deployments)</Text>
      ) : (
        deployments.slice(0, 6).map((d: any, i: number) => (
          <Text key={i}>
            <Text color={d.status === 'done' ? 'green' : d.status === 'error' ? 'red' : 'yellow'}>
              {d.status.padEnd(8)}
            </Text>
            <Text dimColor>{d.createdAt}</Text>
          </Text>
        ))
      )}
    </Box>
  );
}
```

### 5. Create Detail Hook (src/tui/hooks/use-detail.ts)

New file:

```typescript
import { useCallback } from 'react';
import { useAppContext } from '../context/app-context.js';
import { api } from '../../lib/api.js';
import type { ApplicationFull } from '../../types/index.js';

/**
 * Hook to manage app detail panel
 * Fetches full app data when opening panel
 */
export function useDetail() {
  const {
    activeApp,
    showDetailPanel,
    setShowDetailPanel,
    setDetailApp,
    setActionRunning,
    setActionMessage,
  } = useAppContext();

  const openDetail = useCallback(async () => {
    if (!activeApp || showDetailPanel) return;

    setActionRunning('Loading details...');

    try {
      const fullApp = await api.post<ApplicationFull>('/application.one', {
        applicationId: activeApp.applicationId,
      });
      setDetailApp(fullApp);
      setShowDetailPanel(true);
      setActionRunning(null);
    } catch (err) {
      setActionRunning(null);
      setActionMessage({
        text: 'Failed to load app details',
        type: 'error',
      });
    }
  }, [activeApp, showDetailPanel, setShowDetailPanel, setDetailApp, setActionRunning, setActionMessage]);

  const closeDetail = useCallback(() => {
    setShowDetailPanel(false);
    setDetailApp(null);
  }, [setShowDetailPanel, setDetailApp]);

  return {
    showDetailPanel,
    openDetail,
    closeDetail,
  };
}
```

### 6. Update Keyboard Hook (src/tui/hooks/use-keyboard.ts)

Add to KeyboardOptions interface:

```typescript
onDelete?: () => void;
onOpenDetail?: () => void;
onExport?: () => void;
```

Add handlers in useInput (after restart, around line 193):

```typescript
// Delete with confirm (D key)
if (input === 'D' && onDelete) {
  onDelete();
  return;
}

// Info panel (i key)
if (input === 'i' && onOpenDetail) {
  onOpenDetail();
  return;
}

// Export (x key)
if (input === 'x' && onExport) {
  onExport();
  return;
}
```

### 7. Update Status Bar (src/tui/components/status-bar.tsx)

Import and render ConfirmDialog:

```typescript
import { ConfirmDialog } from './confirm-dialog.js';
import { useConfirm } from '../hooks/use-confirm.js';

export function StatusBar() {
  const { showConfirm } = useConfirm();
  // ... existing code ...

  return (
    <Box borderStyle="single" borderTop={false} paddingX={1} justifyContent="space-between">
      {showConfirm ? (
        <ConfirmDialog />
      ) : (
        <>
          {/* Existing shortcuts and action state */}
        </>
      )}
    </Box>
  );
}
```

Update shortcuts array to include new keys:

```typescript
const shortcuts: Shortcut[] = [
  { key: 'd', label: 'deploy' },
  { key: 's', label: 'stop' },
  { key: 'S', label: 'start' },
  { key: 'r', label: 'restart' },
  { key: 'D', label: 'delete' },
  { key: 'i', label: 'info' },
  { key: 'x', label: 'export' },
  { key: 'l', label: 'logs' },
  { key: '/', label: 'search' },
  { key: 'q', label: 'quit' },
];
```

### 8. Wire Up in App (src/tui/app.tsx)

Import and use new hooks:

```typescript
import { useConfirm } from './hooks/use-confirm.js';
import { useDetail } from './hooks/use-detail.js';
import { writeFile } from 'fs/promises';

function TUIApp() {
  // ... existing hooks ...
  const { requestConfirm, showConfirm } = useConfirm();
  const { openDetail, showDetailPanel } = useDetail();
  const { activeApp } = useAppContext();

  // Delete with confirmation
  const handleDelete = useCallback(() => {
    if (!activeApp) return;
    requestConfirm(
      `Delete "${activeApp.name}"? This cannot be undone.`,
      async () => {
        try {
          await api.delete('/application.delete', { applicationId: activeApp.applicationId });
          await refreshApps();
        } catch (err) {
          // Error handled by context
        }
      }
    );
  }, [activeApp, requestConfirm, refreshApps]);

  // Export current app
  const handleExport = useCallback(async () => {
    if (!activeApp) return;
    // Quick export to cwd
    const filename = `${activeApp.name}-export.json`;
    try {
      const fullApp = await api.post('/application.one', { applicationId: activeApp.applicationId });
      const exportData = {
        version: '1.0',
        type: 'application',
        exportedAt: new Date().toISOString(),
        data: { /* simplified */ name: fullApp.name, env: fullApp.env },
      };
      await writeFile(filename, JSON.stringify(exportData, null, 2));
      setActionMessage({ text: `Exported to ${filename}`, type: 'success' });
    } catch {
      setActionMessage({ text: 'Export failed', type: 'error' });
    }
  }, [activeApp]);

  // Update useKeyboard call
  useKeyboard({
    // ... existing ...
    onDelete: handleDelete,
    onOpenDetail: openDetail,
    onExport: handleExport,
    disabled: isRunning || isSearching || showServerSelector || showLoginForm || showConfirm || showDetailPanel,
  });

  // ... rest
}
```

### 9. Update Layout (src/tui/components/layout.tsx)

Add detail panel conditionally:

```typescript
import { AppDetailPanel } from './app-detail-panel.js';
import { useAppContext } from '../context/app-context.js';

export function Layout() {
  const { showDetailPanel } = useAppContext();

  return (
    <Box flexDirection="column" height="100%">
      <Header />
      {showDetailPanel ? (
        <AppDetailPanel />
      ) : (
        <Box flexGrow={1}>
          <Sidebar />
          <MainContent />
          <LogViewer />
        </Box>
      )}
      <StatusBar />
    </Box>
  );
}
```

---

## Todo List

- [ ] Update `app-context.tsx` with confirm/detail state
- [ ] Create `use-confirm.ts` hook
- [ ] Create `confirm-dialog.tsx` component
- [ ] Create `use-detail.ts` hook
- [ ] Create `app-detail-panel.tsx` component
- [ ] Update `use-keyboard.ts` with D, i, x handlers
- [ ] Update `status-bar.tsx` with confirm integration
- [ ] Update `layout.tsx` with detail panel
- [ ] Wire up handlers in `app.tsx`
- [ ] Test keyboard shortcuts work as expected
- [ ] Verify confirm dialog blocks other input

---

## Success Criteria

1. Press `D` on selected app shows "Delete 'name'? [y/N]" in status bar
2. Press `y` deletes app, `n` or `Esc` cancels
3. Press `i` opens detail panel with tabs
4. Arrow keys navigate tabs in detail panel
5. `Esc` closes detail panel
6. Press `x` exports selected app to file
7. Status bar shows updated shortcuts

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Input conflicts | Medium | Medium | Disable main keyboard when confirm/detail active |
| Detail panel height issues | Low | Low | Fixed height, scrollable content |
| Export in TUI slow | Low | Low | Show "Exporting..." feedback |
| Tab state reset | Low | Low | Reset to 'general' on open |

---

## Design Decisions

1. **Simple y/n in status bar** - Not modal overlay (simpler, less intrusive)
2. **Detail panel replaces main content** - Cleaner than side panel
3. **Read-only panel** - Edits via CLI to avoid complexity
4. **Fixed tab order** - General|Env|Domains|Deployments (most common info first)
5. **Env values masked** - Security (show key=*** format)
