# Export/Import Data Structure Research - dokploy-cli

## Current State Analysis

**Existing Interfaces:**
- `AppExport`: Single application export with base data (name, description, build config, env, domains, mounts, ports)
- `ProjectExport`: Project wrapper containing only applications array
- No support for Compose or Database exports
- No version migration strategy
- No metadata tracking for partial imports/exports

**Data Hierarchy:**
```
Project → Environment → [Applications | Compose | Databases]
```

**Gap:** ProjectExport only includes applications; missing Compose and Database resources entirely.

---

## Recommended Schema Extensions

### 1. Enhanced Version & Metadata Structure

```typescript
interface ExportMetadata {
  version: string;           // Semantic versioning: "2.0.0"
  minCliVersion?: string;    // Compatibility range
  exportedAt: string;        // ISO timestamp
  exporterId: string;        // Source server identifier
  includesServices: {
    applications: boolean;
    compose: boolean;
    databases: boolean;
    domains: boolean;
    mounts: boolean;
  };
  checksum?: string;         // SHA256 of data for integrity
}

interface BaseExport {
  metadata: ExportMetadata;
  errors?: ExportError[];    // Track partial failures
}
```

### 2. Compose Export Extension

```typescript
interface ComposeExport {
  composeId?: string;
  name: string;
  description?: string;
  composeType: 'docker-compose' | 'stack';
  sourceType: 'github' | 'gitlab' | 'bitbucket' | 'git' | 'raw';
  env?: string;
  composeFile?: string;
  repository?: string;
  branch?: string;
  domains: Omit<Domain, 'domainId' | 'createdAt'>[];
  mounts: Omit<Mount, 'mountId'>[];
}
```

### 3. Database Export Extension

```typescript
type DbType = 'postgres' | 'mysql' | 'mongo' | 'redis' | 'mariadb';

interface DatabaseExport {
  name: string;
  type: DbType;
  description?: string;
  env?: string;
  dockerImage?: string;
  databaseName?: string;
  databaseUser?: string;
  databasePassword?: string;  // Warn: sensitive data
  externalPort?: number;
  replicas: number;
  mounts: Omit<Mount, 'mountId'>[];
  // Exclude internal IDs
}
```

### 4. Extended ProjectExport

```typescript
interface ProjectExport {
  metadata: ExportMetadata;
  type: 'project';
  data: {
    name: string;
    description?: string;
    applications?: AppExport['data'][];
    compose?: ComposeExport[];
    databases?: DatabaseExport[];  // Grouped by type
  };
  // Track import results
  importResults?: {
    [resourceId: string]: ImportResult;
  };
}

interface ImportResult {
  resourceId: string;
  status: 'success' | 'partial' | 'failed';
  message?: string;
  newId?: string;  // Map old→new IDs
}
```

---

## Version Compatibility & Migration

### Strategy: Version Negotiation + Adapter Pattern

```typescript
interface VersionAdapter {
  fromVersion: string;
  toVersion: string;
  migrate(data: any): any;
}

// Migrations registry
const migrations: VersionAdapter[] = [
  {
    fromVersion: "1.0.0",
    toVersion: "2.0.0",
    migrate: (data) => ({
      ...data,
      metadata: {
        version: "2.0.0",
        includesServices: {
          applications: !!data.applications,
          compose: false,
          databases: false,
          domains: false,
          mounts: false,
        }
      }
    })
  }
];
```

**Approach:**
1. Parse export → check version
2. Find migration path (allow multi-step)
3. Apply transformations sequentially
4. Validate against target schema
5. Log all transformations

---

## Error Handling for Partial Imports

```typescript
interface ExportError {
  type: 'validation' | 'fetch' | 'serialize';
  resource: string;
  message: string;
  severity: 'warning' | 'error';
}

// Import strategy
class PartialImporter {
  async importProject(export: ProjectExport) {
    const results = {
      succeeded: [],
      failed: [],
      skipped: [],
    };

    // Continue on resource failure; track all errors
    for (const app of export.data.applications || []) {
      try {
        const created = await createApp(app);
        results.succeeded.push(created);
      } catch (err) {
        results.failed.push({
          resource: app.name,
          error: err.message,
        });
        // Continue to next resource
      }
    }

    return {
      partialSuccess: results.failed.length > 0,
      results,
      recoveryActions: suggestRetries(results.failed),
    };
  }
}
```

---

## Sensitive Data Handling

**Issue:** Database passwords in exports.

**Solutions:**
- Option A: Exclude sensitive fields by default; flag with `--include-secrets` warning
- Option B: Encrypt sensitive fields with user-provided passphrase
- Option C: Store refs instead of values; user provides at import time

**Recommendation:** Option C with fallback prompt during import.

---

## Suggested Implementation Order

1. **Phase 1:** Extend ProjectExport with metadata + Compose support
2. **Phase 2:** Add Database export types + resource grouping
3. **Phase 3:** Implement version adapter system + migration tests
4. **Phase 4:** Partial import error handling + recovery guidance
5. **Phase 5:** Sensitive data masking + import-time credential prompts

---

## Unresolved Questions

- Should exports include deployment history/logs?
- Compression strategy for large projects (gzip default)?
- Cloud storage integration for automated backups?
- Real-time sync mode vs. snapshot export?
