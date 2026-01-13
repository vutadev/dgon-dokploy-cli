# Ink TUI Integration Plan

**Created:** 2026-01-13
**Status:** Ready for Implementation
**Branch:** `feat/ink-tui`

## Overview

Add persistent TUI dashboard (lazydocker/k9s style) using Ink (React-based) while preserving CLI commands for CI/scripts.

## Architecture

```
dokploy           → Launch TUI (if TTY, no subcommand)
dokploy <cmd>     → Traditional CLI (auto-detect)
dokploy --no-tui  → Force CLI mode
```

## Phases

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | [Foundation](phase-01-foundation.md) | **Complete** | Setup Ink, entry point, basic layout |
| 2 | [Core Features](phase-02-core-features.md) | **Complete** | Lists, navigation, app actions |
| 3 | [Real-time](phase-03-realtime-features.md) | **Complete** | Log streaming, auto-refresh |
| 4 | [Polish](phase-04-polish.md) | **Complete** | Cache, search, multi-server |

## Key Dependencies

- `ink` ^5.0.1 - React for CLI
- `react` ^18.3.1 - React runtime
- `@inkjs/ui` ^2.0.0 - UI components

## Success Criteria

- [ ] TUI launches <500ms
- [ ] CLI commands unchanged for CI
- [ ] Keyboard navigation responsive (<50ms)
- [ ] Log streaming <100ms latency
- [ ] Bundle <2MB

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Bun + React compat | Test spike first, fallback to Node |
| State complexity | Keep simple, avoid Redux |
| Bundle size | Tree-shake, lazy load TUI |

## Related

- Brainstorm: `plans/reports/brainstorm-2026-01-13-tui-integration.md`
