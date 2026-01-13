# Phase 1: Foundation

**Priority:** High
**Status:** Complete
**Completed:** 2026-01-13

## Context

- [Brainstorm Report](../reports/brainstorm-2026-01-13-tui-integration.md)
- [Ink GitHub](https://github.com/vadimdemedes/ink)
- [Ink UI](https://github.com/vadimdemedes/ink-ui)

## Overview

Setup Ink dependencies, create dual-mode entry point, build basic TUI layout skeleton.

## Key Insights

- Ink v5 uses React 18, needs JSX compilation
- Bun supports JSX natively with `--jsx-runtime=automatic`
- Keep CLI commands untouched, add TUI as separate mode
- Focus on layout structure, data fetching in Phase 2

## Requirements

### Functional
- `dokploy` (no args) → TUI dashboard
- `dokploy <cmd>` → CLI mode (unchanged)
- `dokploy --no-tui` → Force CLI
- Basic 3-panel layout rendered

### Non-Functional
- TUI startup <1s
- No breaking changes to CLI
- TypeScript strict mode

## Architecture

### Entry Point Logic

```typescript
// src/index.ts
const isTTY = process.stdout.isTTY;
const hasSubcommand = process.argv.length > 2;
const forceNoTUI = process.argv.includes('--no-tui');

if (isTTY && !hasSubcommand && !forceNoTUI) {
  // Dynamic import to avoid loading React for CLI
  const { launchTUI } = await import('./tui/app.js');
  await launchTUI();
} else {
  // Existing CLI logic
  program.parse();
}
```

### TUI Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Header: Dokploy CLI v0.2.0         [server] [?] help    │
├────────────┬────────────────────────────────────────────┤
│ Sidebar    │  Main Content                              │
│ (Projects) │  (Apps list / Details / Logs)              │
│            │                                            │
├────────────┴────────────────────────────────────────────┤
│ StatusBar: [d]eploy [s]top [l]ogs [q]uit                │
└─────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── index.ts                      # MODIFY: Add TUI detection
├── tui/
│   ├── app.tsx                   # CREATE: Root TUI component
│   ├── components/
│   │   ├── layout.tsx            # CREATE: Main layout
│   │   ├── header.tsx            # CREATE: Top bar
│   │   ├── sidebar.tsx           # CREATE: Left panel
│   │   ├── main-content.tsx      # CREATE: Right panel
│   │   └── status-bar.tsx        # CREATE: Bottom bar
│   ├── context/
│   │   └── app-context.tsx       # CREATE: Global state
│   └── hooks/
│       └── use-terminal-size.ts  # CREATE: Terminal dimensions
├── commands/                     # UNCHANGED
├── lib/                          # UNCHANGED
└── types/
    └── index.ts                  # MODIFY: Add TUI types
```

## Related Code Files

### Files to Modify

| File | Change |
|------|--------|
| `src/index.ts` | Add TUI mode detection, dynamic import |
| `src/types/index.ts` | Add TUI-specific types |
| `package.json` | Add Ink, React dependencies |
| `tsconfig.json` | Add JSX config |

### Files to Create

| File | Purpose |
|------|---------|
| `src/tui/app.tsx` | Root TUI component, render entry |
| `src/tui/components/layout.tsx` | Main 3-panel layout |
| `src/tui/components/header.tsx` | Server info, help hint |
| `src/tui/components/sidebar.tsx` | Project list placeholder |
| `src/tui/components/main-content.tsx` | App list placeholder |
| `src/tui/components/status-bar.tsx` | Keyboard shortcuts |
| `src/tui/context/app-context.tsx` | Active project/app state |
| `src/tui/hooks/use-terminal-size.ts` | Track terminal size |

## Implementation Steps

### 1. Verify Bun + Ink Compatibility

```bash
# Create test file
cat > /tmp/ink-test.tsx << 'EOF'
import React from 'react';
import { render, Text } from 'ink';
render(<Text>Hello Ink!</Text>);
EOF

# Test with Bun
bun run /tmp/ink-test.tsx
```

**Success:** Text renders without error
**Fallback:** Add build step with esbuild

### 2. Install Dependencies

```bash
bun add ink@^5.0.1 react@^18.3.1 @inkjs/ui@^2.0.0
bun add -d @types/react@^18.3.0
```

### 3. Configure TypeScript JSX

```json
// tsconfig.json additions
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

### 4. Update Entry Point

Modify `src/index.ts`:
- Check TTY and args before Commander
- Dynamic import TUI to avoid CLI penalty
- Preserve all existing CLI behavior

### 5. Create App Context

`src/tui/context/app-context.tsx`:
- `activeProject: Project | null`
- `activeApp: Application | null`
- `activePanel: 'sidebar' | 'main' | 'logs'`
- `setActiveProject()`, `setActiveApp()`, `setActivePanel()`

### 6. Create Layout Components

Order of creation:
1. `use-terminal-size.ts` - Get terminal dimensions
2. `app-context.tsx` - State provider
3. `header.tsx` - Simple text display
4. `status-bar.tsx` - Shortcut hints
5. `sidebar.tsx` - Empty panel placeholder
6. `main-content.tsx` - Empty panel placeholder
7. `layout.tsx` - Compose all panels
8. `app.tsx` - Root render

### 7. Implement Basic Layout

`src/tui/components/layout.tsx`:
```tsx
import { Box } from 'ink';
import { Header } from './header.js';
import { Sidebar } from './sidebar.js';
import { MainContent } from './main-content.js';
import { StatusBar } from './status-bar.js';

export function Layout() {
  return (
    <Box flexDirection="column" height="100%">
      <Header />
      <Box flexGrow={1}>
        <Sidebar />
        <MainContent />
      </Box>
      <StatusBar />
    </Box>
  );
}
```

### 8. Create TUI Entry

`src/tui/app.tsx`:
```tsx
import { render } from 'ink';
import { Layout } from './components/layout.js';
import { AppProvider } from './context/app-context.js';

export async function launchTUI() {
  const { waitUntilExit } = render(
    <AppProvider>
      <Layout />
    </AppProvider>
  );
  await waitUntilExit();
}
```

### 9. Test TUI Launch

```bash
# Should launch TUI
bun run src/index.ts

# Should run CLI
bun run src/index.ts app list
bun run src/index.ts --no-tui
```

### 10. Verify CLI Unchanged

Run existing tests:
```bash
bun test
```

## Todo List

- [ ] Verify Bun + Ink compatibility (spike)
- [ ] Install Ink, React, @inkjs/ui dependencies
- [ ] Configure tsconfig.json for JSX
- [ ] Create `src/tui/` directory structure
- [ ] Implement `use-terminal-size.ts` hook
- [ ] Implement `app-context.tsx` state provider
- [ ] Implement `header.tsx` component
- [ ] Implement `status-bar.tsx` component
- [ ] Implement `sidebar.tsx` placeholder
- [ ] Implement `main-content.tsx` placeholder
- [ ] Implement `layout.tsx` composition
- [ ] Implement `app.tsx` entry point
- [ ] Modify `src/index.ts` for dual mode
- [ ] Add TUI types to `src/types/index.ts`
- [ ] Test TUI launch
- [ ] Verify CLI commands still work
- [ ] Update package.json version

## Success Criteria

- [ ] `dokploy` launches TUI with 3-panel layout
- [ ] `dokploy app list` runs CLI mode
- [ ] `dokploy --no-tui` forces CLI
- [ ] All existing tests pass
- [ ] No TypeScript errors
- [ ] Layout adapts to terminal size

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Bun JSX issues | High | Medium | Test spike first, esbuild fallback |
| Import path issues | Medium | Medium | Use `.js` extensions for ESM |
| Terminal size edge cases | Low | Medium | Min size check, graceful fallback |

## Security Considerations

- No new auth/network code
- TUI reuses existing API client
- No new attack surface

## Next Phase

Phase 2 will add:
- Project/app list data fetching
- Keyboard navigation
- App action handlers (deploy, stop, start)
