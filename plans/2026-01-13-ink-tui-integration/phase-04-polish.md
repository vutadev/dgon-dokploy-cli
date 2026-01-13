# Phase 4: Polish

**Priority:** Low
**Status:** Complete
**Completed:** 2026-01-13
**Dependencies:** Phase 3 complete

## Overview

Add caching, search/filter, and multi-server support for improved UX.

## Features

### Local Cache
- Cache projects/apps on disk
- Show cached data on TUI launch (instant startup)
- Background refresh with cache
- Cache invalidation on actions

### Search/Filter
- `/` to enter search mode
- Filter projects by name
- Filter apps by name/status
- Fuzzy matching support

### Multi-server Support
- Server selector in header
- Switch servers with `S` key
- Per-server state preservation
- Server connection indicator

### Environment Viewer
- View env vars for selected app
- Edit env vars inline
- Mask sensitive values
- Deploy after env change

## Files to Create

| File | Purpose |
|------|---------|
| `src/tui/hooks/use-cache.ts` | Local cache read/write |
| `src/tui/hooks/use-search.ts` | Search/filter logic |
| `src/tui/components/search-input.tsx` | Search input component |
| `src/tui/components/server-selector.tsx` | Server picker |
| `src/tui/components/env-viewer.tsx` | Environment panel |
| `src/lib/cache.ts` | Disk cache utilities |

## Technical Considerations

- Use `conf` package for cache (already a dependency)
- Cache TTL: 5 minutes default
- Search debounce: 150ms

## Success Criteria

- [x] TUI shows cached data instantly
- [x] Search filters lists in real-time
- [x] Server switch works seamlessly
- [ ] Env viewer displays/edits correctly (deferred to future phase)
