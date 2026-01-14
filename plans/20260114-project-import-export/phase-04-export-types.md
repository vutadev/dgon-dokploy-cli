# Phase 4: Extended Export Types

## Context

Current `ProjectExport` type only supports applications. Need to extend for compose and databases.

## Overview

Extend export schema to support all resource types while maintaining backward compatibility.

## Requirements

1. **Backward compatibility**: Existing `AppExport` and `ProjectExport` remain valid
2. **New types**: `ComposeExport`, `DatabaseExport` data structures
3. **Extended `ProjectExport`**: Include compose and databases arrays
4. **Metadata**: Export includes schema version for future migrations

## Architecture

All types in `/src/types/index.ts`

## Implementation Steps

### Step 1: Add Compose export data type

```typescript
// After line 304 in /src/types/index.ts

// Export format for single compose service
export interface ComposeExportData {
  name: string;
  description?: string;
  composeType: 'docker-compose' | 'stack';
  sourceType: string;
  env: string;
  composeFile?: string;
  composePath?: string;
  domains: Omit<Domain, 'domainId' | 'applicationId' | 'createdAt'>[];
  mounts: Omit<Mount, 'mountId'>[];
}
```

### Step 2: Add Database export data type

```typescript
// Export format for single database
export interface DatabaseExportData {
  name: string;
  description?: string;
  dbType: DatabaseType;
  env: string;
  dockerImage?: string;
  databaseName?: string;
  databaseUser?: string;
  // Note: passwords should NOT be exported for security
  externalPort?: number | null;
  replicas: number;
  memoryReservation?: number;
  memoryLimit?: number;
  mounts: Omit<Mount, 'mountId'>[];
}
```

### Step 3: Extend ProjectExport

```typescript
// Modify existing ProjectExport (around line 307-316)
export interface ProjectExport {
  version: string;
  type: 'project';
  exportedAt: string;
  // Schema version for future migrations
  schemaVersion?: '1.0' | '2.0';
  data: {
    name: string;
    description?: string;
    applications: AppExport['data'][];
    // New in schemaVersion 2.0
    compose?: ComposeExportData[];
    databases?: DatabaseExportData[];
  };
}
```

### Step 4: Add type guards

```typescript
// Type guard for checking export schema version
export function isProjectExportV2(
  exp: ProjectExport
): exp is ProjectExport & { data: { compose: ComposeExportData[]; databases: DatabaseExportData[] } } {
  return exp.schemaVersion === '2.0' ||
    (Array.isArray(exp.data.compose) || Array.isArray(exp.data.databases));
}
```

### Step 5: Add union type for individual exports

```typescript
// Individual resource export (for single-item exports)
export type ResourceExport =
  | AppExport
  | { version: string; type: 'compose'; exportedAt: string; data: ComposeExportData }
  | { version: string; type: 'database'; exportedAt: string; data: DatabaseExportData };
```

## Success Criteria

- [ ] Existing `AppExport` type unchanged
- [ ] Existing `ProjectExport` backward compatible (applications-only imports still work)
- [ ] New types for compose and database exports
- [ ] Type guards for version checking
- [ ] No runtime changes to CLI commands
- [ ] Total additions under 50 lines

## Migration Notes

- Old exports (schemaVersion undefined or '1.0') -> import as applications-only
- New exports (schemaVersion '2.0') -> import all resource types
- CLI import command will auto-detect based on presence of compose/databases arrays
