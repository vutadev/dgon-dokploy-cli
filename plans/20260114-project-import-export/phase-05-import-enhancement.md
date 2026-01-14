# Phase 5: Import Enhancement

## Context

Current import in TUI (`use-import.ts`) only handles single-app exports. Need project-level imports with service selection.

## Overview

Enhance import dialog to support project exports with multi-select service selection.

## Requirements

1. **File detection**: Auto-detect export type (single app vs project)
2. **Service selection**: For project exports, show multi-select of included services
3. **Import execution**: Create selected resources in active project

## Architecture

Modify existing files:
- `/src/tui/hooks/use-import.ts`
- `/src/tui/components/import-dialog.tsx`

## Implementation Steps

### Step 1: Update `use-import.ts` hook

Add state for detected export type and services:

```typescript
interface ImportableService {
  id: string;       // Generated unique ID for selection
  name: string;
  type: 'application' | 'compose' | 'database';
  dbType?: string;  // For databases
}

// Add to hook state
const [importStep, setImportStep] = useState<'file' | 'select'>('file');
const [detectedExportType, setDetectedExportType] = useState<'application' | 'project' | null>(null);
const [importableServices, setImportableServices] = useState<ImportableService[]>([]);
const [parsedExport, setParsedExport] = useState<AppExport | ProjectExport | null>(null);
```

Modify `executeImport()`:
1. Parse selected file
2. Detect type (`exportData.type`)
3. If 'application' -> direct import (existing behavior)
4. If 'project' -> populate services list, switch to 'select' step

### Step 2: Add service parsing logic

```typescript
function parseProjectServices(exportData: ProjectExport): ImportableService[] {
  const services: ImportableService[] = [];

  // Applications
  exportData.data.applications.forEach((app, i) => {
    services.push({ id: `app-${i}`, name: app.name, type: 'application' });
  });

  // Compose (if present in v2 exports)
  (exportData.data.compose || []).forEach((comp, i) => {
    services.push({ id: `compose-${i}`, name: comp.name, type: 'compose' });
  });

  // Databases (if present)
  (exportData.data.databases || []).forEach((db, i) => {
    services.push({ id: `db-${i}`, name: db.name, type: 'database', dbType: db.dbType });
  });

  return services;
}
```

### Step 3: Add import execution for each type

```typescript
async function importApplication(appData: AppExport['data'], projectId: string) {
  // Existing logic from use-import.ts lines 79-110
}

async function importCompose(composeData: ComposeExportData, projectId: string) {
  const compose = await api.post('/compose.create', {
    projectId,
    name: composeData.name,
    description: composeData.description,
    composeType: composeData.composeType,
  });

  if (composeData.env) {
    await api.post('/compose.saveEnvironment', {
      composeId: compose.composeId,
      env: composeData.env,
    });
  }
  // Note: composeFile requires separate handling (raw source)
}

async function importDatabase(dbData: DatabaseExportData, projectId: string) {
  const endpoint = `/${dbData.dbType}.create`;
  await api.post(endpoint, {
    projectId,
    name: dbData.name,
    description: dbData.description,
    dockerImage: dbData.dockerImage,
    databaseName: dbData.databaseName,
    databaseUser: dbData.databaseUser,
    // Password not imported - user must set manually
  });
}
```

### Step 4: Update context state

Add to `app-context.tsx`:
```typescript
// In AppState
importStep: 'file' | 'select';

// In AppContextValue
setImportStep: (step: 'file' | 'select') => void;
```

### Step 5: Update `import-dialog.tsx`

Two-step flow:
1. **Step 'file'**: File selection (existing UI)
2. **Step 'select'**: Service multi-select (for project exports)

```tsx
// Step 1: File selection
if (importStep === 'file') {
  return (
    <Box flexDirection="column" ...>
      <Text bold color="cyan">Import - Select File</Text>
      {/* existing file list */}
    </Box>
  );
}

// Step 2: Service selection (project exports only)
if (importStep === 'select') {
  return (
    <Box flexDirection="column" ...>
      <Text bold color="cyan">Import - Select Services</Text>
      <MultiSelectList
        items={importableServices.map(s => ({
          id: s.id,
          label: `${s.name} (${s.type})`,
          data: s,
          selected: true, // Default all selected
        }))}
        ...
      />
    </Box>
  );
}
```

### Step 6: Handle keyboard in dialog

Update `useInput` handler:
- Step 'file' + Enter on project export -> transition to 'select'
- Step 'file' + Enter on app export -> direct import
- Step 'select' + Enter -> execute import with selected services
- Step 'select' + Escape -> back to 'file'

## Success Criteria

- [ ] Single-app exports work as before
- [ ] Project exports show service selection
- [ ] Multi-select allows choosing subset of services
- [ ] All resource types import correctly
- [ ] Back navigation from service selection to file selection
- [ ] Progress/result feedback after import
- [ ] Hook file under 180 lines (increased from 128)
- [ ] Component file under 120 lines (increased from 72)

## Testing Notes

1. Import single app export -> direct import (no service selection)
2. Import project export (apps only) -> service selection shown
3. Import project export (apps + compose + dbs) -> all types shown
4. Deselect some services -> only selected imported
5. Escape from service selection -> return to file list
