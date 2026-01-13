# Phase 2: Core Features

**Priority:** High
**Status:** Complete
**Completed:** 2026-01-13

## Overview

Add data fetching, keyboard navigation, and app actions to TUI.

## Features

### Project/App Lists
- Fetch projects on TUI launch
- Fetch apps when project selected
- Display in scrollable lists
- Show status indicators (running/stopped/error)

### Keyboard Navigation
- `j/k` or `↑/↓` - Move selection
- `h/l` or `←/→` - Switch panels
- `Enter` - Select/expand
- `Tab` - Cycle panels
- `q` - Quit TUI
- `?` - Show help

### App Actions
- `d` - Deploy selected app
- `s` - Stop app
- `r` - Restart app
- `l` - View logs (switch to log panel)
- `e` - View/edit environment

## Files to Create

| File | Purpose |
|------|---------|
| `src/tui/hooks/use-projects.ts` | Fetch and cache projects |
| `src/tui/hooks/use-apps.ts` | Fetch apps for project |
| `src/tui/hooks/use-keyboard.ts` | Keyboard input handler |
| `src/tui/components/project-list.tsx` | Replace sidebar placeholder |
| `src/tui/components/app-list.tsx` | Replace main placeholder |
| `src/tui/components/app-actions.tsx` | Action confirmation dialogs |

## Implementation Approach

1. Create data fetching hooks using existing `api.ts`
2. Implement `useInput` from Ink for keyboard
3. Update sidebar with project list
4. Update main content with app list
5. Add action handlers with spinner feedback

## Success Criteria

- [ ] Projects load and display on launch
- [ ] Apps display when project selected
- [ ] Keyboard navigation fluid
- [ ] Deploy/stop/start actions work
- [ ] Status updates after actions
