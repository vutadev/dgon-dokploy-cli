# Brainstorm: Complete Project/Application Management

**Date:** 2026-01-13
**Status:** Agreed - Approach C (Hybrid)

---

## Problem Statement

Implement complete project/application management with:
- List all projects
- List all applications of selected project
- Full app management: create/start/stop/update/delete (with confirm)
- Show: general, environment, domains, backups, advanced
- Import/export/move projects/applications

---

## Current State

### Already Implemented

| Feature | CLI | TUI |
|---------|-----|-----|
| List projects | ✅ `project list` | ✅ Sidebar |
| List apps by project | ✅ `app list -p` | ✅ MainContent |
| Create app | ✅ `app create` | ❌ |
| Start/Stop app | ✅ `app start/stop` | ✅ Keys S/s |
| Deploy app | ✅ `app deploy` | ✅ Key d |
| Delete app | ✅ `app delete` (with confirm) | ❌ |
| Basic app info | ✅ `app info` | Partial |
| Env management | ✅ `env pull/push/show` | ❌ |
| Domain management | ✅ `domain add/remove/ssl` | ❌ |
| Config export/import | ✅ `config export/import` | ❌ |

### Missing Features

| Feature | CLI | TUI | Priority |
|---------|-----|-----|----------|
| App update (settings) | ❌ | ❌ | P1 |
| Full app info (all sections) | ❌ | ❌ | P1 |
| Delete with TUI confirm | - | ❌ | P1 |
| App export/import | ❌ | ❌ | P2 |
| Project export/import | ❌ | ❌ | P2 |
| Backup commands | ❌ | ❌ | P2 |
| Project duplicate | ❌ | ❌ | P3 |
| Move app between projects | ❌ | ❌ | P3 (nice-to-have) |

---

## API Endpoints Available

From [Dokploy API Docs](https://docs.dokploy.com/docs/api):

### Project
- `POST /project.all` - List all
- `POST /project.one` - Get by ID
- `POST /project.create` - Create
- `POST /project.update` - Update
- `POST /project.remove` - Delete
- `POST /project.duplicate` - Clone project (useful for export/import!)

### Application
- `POST /application.one` - Get full details
- `POST /application.create` - Create
- `POST /application.update` - Update any setting
- `POST /application.delete` - Delete
- `POST /application.deploy` - Deploy
- `POST /application.start` - Start
- `POST /application.stop` - Stop
- `POST /application.redeploy` - Redeploy
- `POST /application.saveEnvironment` - Save env vars
- `POST /application.saveBuildType` - Save build config

### Domain
- `GET /domain.byApplicationId` - Get domains for app
- `POST /domain.create` - Add domain
- `POST /domain.update` - Update domain
- `POST /domain.delete` - Remove domain

### Backup
- `POST /backup.create` - Create backup config
- `GET /backup.one` - Get backup
- `POST /backup.update` - Update backup
- `POST /backup.remove` - Delete backup
- `POST /backup.manualBackup{Type}` - Trigger manual backup
- `GET /backup.listBackupFiles` - List backup files

### Destination (backup storage)
- `GET /destination.all` - List destinations
- `POST /destination.create` - Create destination
- `POST /destination.testConnection` - Test connectivity

---

## Agreed Approach: Hybrid (C)

### Philosophy
- CLI for complex operations (update, export/import, backup mgmt)
- TUI for quick actions + read-only detail panel
- Simple y/n confirmations (not full modals)

### Implementation Plan

#### Phase 1: CLI Enhancements (Core)

**1.1 App Update Command** (~100 lines)
```bash
dokploy app update <appId> [options]
  --name <name>
  --build-type <dockerfile|nixpacks|...>
  --replicas <n>
  --env-file <path>     # Batch update env
  --registry <id>
```

**1.2 Enhanced App Info** (~80 lines)
```bash
dokploy app info <appId> --full
# Shows: General, Environment, Domains, Deployments, Backups
```

**1.3 Backup Commands** (~150 lines)
```bash
dokploy backup list [--app <id>] [--db <id>]
dokploy backup create <appId|dbId> --type <postgres|mysql|...>
dokploy backup restore <backupId>
dokploy backup config <appId> --schedule "0 0 * * *" --keep 7
```

#### Phase 2: Export/Import

**2.1 App Export/Import** (~120 lines)
```bash
dokploy app export <appId> [file.json]
dokploy app import <file.json> --project <projectId>
```

Export format:
```json
{
  "version": "1.0",
  "type": "application",
  "data": {
    "name": "...",
    "buildType": "...",
    "env": [...],
    "domains": [...],
    "settings": {...}
  }
}
```

**2.2 Project Export/Import** (~100 lines)
```bash
dokploy project export <projectId> [file.json]
dokploy project import <file.json>
```

Uses `/project.duplicate` internally or manual recreation.

#### Phase 3: TUI Enhancements

**3.1 Confirm Dialog Component** (~60 lines)
- Simple y/n prompt in status bar
- For delete operations

**3.2 App Detail Panel** (~200 lines)
- Press `Enter` on app → Show detail view
- Tabs: General | Env | Domains | Deployments
- Read-only display
- `e` key → Opens CLI for editing

**3.3 Quick Actions Update**
```
Existing:
  d=Deploy  s=Stop  S=Start  r=Restart

New:
  D=Delete (with confirm)
  i=Info panel
  x=Export to file
```

---

## File Structure

```
src/commands/
├── app.ts           # Add: update, export, import
├── project.ts       # Add: export, import
└── backup.ts        # NEW: list, create, restore, config

src/tui/components/
├── confirm-dialog.tsx    # NEW: Simple y/n
├── app-detail-panel.tsx  # NEW: Tabbed detail view
└── ...existing...

src/tui/hooks/
├── use-backup.ts         # NEW: Backup data fetching
└── use-confirm.ts        # NEW: Confirm state

src/types/
└── index.ts              # Add: Backup, Destination types
```

---

## Estimated Code Changes

| Component | Lines | Effort |
|-----------|-------|--------|
| `app.ts` additions | ~200 | Medium |
| `project.ts` additions | ~100 | Low |
| `backup.ts` (new) | ~150 | Medium |
| `confirm-dialog.tsx` | ~60 | Low |
| `app-detail-panel.tsx` | ~200 | Medium |
| `use-backup.ts` | ~50 | Low |
| Types additions | ~40 | Low |
| **Total** | **~800** | |

---

## Export/Import Strategy

### Single App Export
1. Fetch `/application.one` for full config
2. Fetch `/domain.byApplicationId` for domains
3. Fetch `/env` vars via existing implementation
4. Package as JSON

### Single App Import
1. Parse JSON
2. Call `/application.create` with settings
3. Call `/application.saveEnvironment` for env
4. Call `/domain.create` for each domain
5. Optionally trigger deploy

### Project Export
Option A: Use `/project.duplicate` if same server
Option B: Export all apps individually + project metadata

### Project Import
1. Create project via `/project.create`
2. Import each app to new project

---

## TUI Confirm Dialog Design

```
┌─ Projects ──────┐ ┌─ Applications ─────────────────────┐
│ ► my-project    │ │ ► my-app          running         │
│   other-proj    │ │   another-app     idle            │
└─────────────────┘ └────────────────────────────────────┘

Delete "my-app"? This cannot be undone. [y/N] _

[d]eploy [s]top [S]tart [r]estart [D]elete [i]nfo [q]uit
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| API inconsistency | Use `--json` output to verify responses |
| Export format changes | Version field for future compat |
| TUI complexity creep | Keep TUI read-only, edits via CLI |
| Backup dest required | Check destination exists before backup |

---

## Success Metrics

- [ ] All CRUD operations work in CLI
- [ ] Export/import round-trip preserves config
- [ ] TUI delete shows confirm prompt
- [ ] TUI detail panel shows all sections
- [ ] Backup commands functional

---

## Implementation Order

1. **P1 - Core CLI** (start first)
   - `app update` command
   - `app info --full` enhancement
   - `backup` command module

2. **P2 - Export/Import**
   - `app export/import`
   - `project export/import`

3. **P3 - TUI Polish**
   - Confirm dialog component
   - App detail panel
   - Delete action with confirm

4. **P4 - Nice-to-have**
   - Move app between projects (if API supports)
   - Project duplicate command

---

## API Verification Results (Tested)

| Question | Answer |
|----------|--------|
| Does `/application.one` include env? | **Yes** - `env` field + `domains[]`, `deployments[]`, `mounts[]`, `security[]`, `ports[]` |
| Move apps between projects? | **Use `/project.duplicate`** with `selectedServices[]` |
| Backup destination flow? | Must create destination first via `/destination.create` |

**`/application.one` returns:**
- Full config: `applicationId`, `name`, `env`, `buildType`, `sourceType`, `dockerImage`, `replicas`, etc
- Related: `domains[]`, `deployments[]`, `mounts[]`, `redirects[]`, `security[]`, `ports[]`
- Nested: `environment.project`

**`/project.duplicate` params:**
- `sourceEnvironmentId` (required)
- `name` (required)
- `selectedServices[]` = `[{id, type}]` where type = application|postgres|mysql|mongo|redis|mariadb|compose
- `duplicateInSameProject` = clone within same project

**`/application.update`** - returns `true` on success

---

## Revised Recommendations

### Export/Import Strategy

| Use Case | Approach |
|----------|----------|
| Clone within same server | `/project.duplicate` (native) |
| Cross-server migration | Manual export JSON + import |
| Single app backup | `/application.one` → JSON |

**CLI Commands:**
```bash
dokploy project clone <id> --name "New"     # Uses duplicate API
dokploy project export <id> [file.json]     # Manual for portability
dokploy project import <file.json>          # Cross-server import
dokploy app export <id> [file.json]
dokploy app import <file.json> --project <id>
```

### Backup Dependencies

Must add destination management:
```bash
dokploy destination list
dokploy destination add --name "s3" --bucket ... --access-key ...
dokploy destination test <id>
dokploy backup create <appId> --destination <id> --schedule "0 0 * * *"
```

---

## Next Steps

1. Create implementation plan with file-by-file changes
2. Start with CLI commands (testable without TUI)
3. Add TUI components after CLI is solid

---

## Sources

- [Dokploy API Docs](https://docs.dokploy.com/docs/api)
- [Project API](https://docs.dokploy.com/docs/api/project)
- [Application API](https://docs.dokploy.com/docs/api/reference-application)
- [Backup API](https://docs.dokploy.com/docs/api/backup)
- [Domain API](https://docs.dokploy.com/docs/api/domain)
