# Scout Report: Import/Export with Project-Level Support

## Current State Analysis

### Import/Export Functionality

**CLI Layer:**
- App-level: `dokploy app export/import` - exports single app to JSON
- Project-level: `dokploy project export/import` - exports entire project with all apps
- File naming: `{appName}-export.json` or `project-{projectId}.json`
- Location: Current working directory (hardcoded)

**TUI Layer:**
- Only app-level import implemented
- Import dialog scans CWD for `.json` files with "export" in name
- Export writes to CWD with fixed naming pattern
- No service selection - imports entire file contents
- No JSON file path display/edit capability

### Key Files

**Commands:**
- `/src/commands/app.ts` - App export/import (lines 389-568)
- `/src/commands/project.ts` - Project export/import (lines 225-413)

**Types:**
- `/src/types/index.ts` - AppExport (281-304), ProjectExport (307-316)

**TUI:**
- `/src/tui/hooks/use-import.ts` - Import dialog logic
- `/src/tui/components/import-dialog.tsx` - Import UI
- `/src/tui/app.tsx` - Export logic (lines 210-261)
- `/src/tui/context/app-context.tsx` - Global state

**Dialogs:**
- Import dialog: File list with j/k navigation
- Confirm dialog: Simple y/n prompt
- No file path input dialog exists

### Data Models

**Resource Types:**
- Application
- Compose
- Database (postgres/mysql/mongo/redis/mariadb)

**Hierarchy:**
- Project → Environment → [Applications, Compose, Databases]

**Export Formats:**
```typescript
AppExport {
  version, type: 'application', exportedAt,
  source: { applicationId, projectId, projectName },
  data: { name, description, buildType, sourceType, env, dockerfile,
          dockerImage, replicas, domains, mounts, ports }
}

ProjectExport {
  version, type: 'project', exportedAt,
  data: { name, description, applications: AppExport['data'][] }
}
```

### Gaps for Requirements

1. **Project-level in TUI:** CLI has it, TUI doesn't
2. **Service selection:** No multi-select capability in either CLI or TUI
3. **File path display/edit:** Hardcoded to CWD, no input field
4. **Compose/Database export:** Project export only includes applications, missing compose and databases

## Requirements to Clarify

1. Should project-level export include compose and databases, or only apps?
2. For service selection, should it be:
   - Multi-select checkboxes during export?
   - Or filter after reading import file?
3. File path input:
   - Full path editor with validation?
   - Or file picker dialog?
4. Should this apply to:
   - TUI only?
   - Both CLI and TUI?
