# Complete Project/Application Management

**Date:** 2026-01-13
**Status:** Ready for Implementation
**Approach:** Hybrid (CLI for complex ops, TUI for quick actions + read-only panels)

---

## Overview

Implement comprehensive project and application management across CLI and TUI interfaces:
- CLI: Update, export/import, destination commands
- TUI: Confirm dialogs, detail panels, extended keyboard shortcuts

## Phase Summary

| Phase | Focus | Priority | Status |
|-------|-------|----------|--------|
| [Phase 1](./phase-01-core-cli.md) | Core CLI (app update, app info --full, destinations) | P1 | Complete |
| [Phase 2](./phase-02-export-import.md) | Export/Import (project clone, export/import) | P2 | Pending |
| [Phase 3](./phase-03-tui-enhancements.md) | TUI (confirm dialog, detail panel, keys) | P3 | Pending |

## Key Decisions

1. **No backup commands in this iteration** - Deferred (requires destination setup first)
2. **TUI remains read-only** - Complex edits via CLI only
3. **Simple y/n confirm** - Not full modal dialogs
4. **Export format v1.0** - JSON with version field for future compat

## Estimated Effort

| Component | Lines | Complexity |
|-----------|-------|------------|
| CLI additions (app.ts, project.ts) | ~250 | Medium |
| destination.ts (new) | ~120 | Low |
| Export types (types/index.ts) | ~50 | Low |
| TUI components | ~200 | Medium |
| TUI hooks | ~80 | Low |
| **Total** | **~700** | |

## Dependencies

- Dokploy API v1.x (verified endpoints)
- Existing CLI patterns in `src/commands/*.ts`
- Ink/React TUI framework

## Risk Summary

| Risk | Mitigation |
|------|------------|
| API response mismatch | Use `--json` for verification |
| Export format changes | Version field + migration |
| TUI complexity creep | Strict read-only policy |

## References

- Brainstorm: `plans/reports/brainstorm-2026-01-13-complete-project-app-management.md`
- API Docs: https://docs.dokploy.com/docs/api
