# Dokploy API Patterns Research

## 1. Export/Import Functionality

### Pattern Implementation
**Location:** `src/lib/config.ts` (lines 122–158)

**Export Pattern:**
```typescript
exportConfig(aliases?: string[]): ConfigExport
```
- Selective export by aliases (optional parameter allows subset export)
- Returns versioned JSON with metadata (`version`, `exportedAt` ISO timestamp)
- Safe: only exports explicitly selected servers or all if unspecified

**Import Pattern:**
```typescript
importConfig(data: ConfigExport, overwrite = false): { imported: string[]; skipped: string[] }
```
- Conflict resolution: skips duplicates by default, can force overwrite
- Returns tracking object with imported/skipped counts (audit trail)
- Validates version compatibility before importing

**Best Practice:** Versioning + metadata timestamps enable safe rollback and audit trails.

---

## 2. Destination (S3 Backup Storage) Management

### Inferred Pattern from Codebase
**Current State:** No explicit S3 destination management in CLI codebase. However, API structure suggests pattern:

**Likely API Endpoints (from grep analysis):**
- `/destination.*` endpoints would follow Dokploy's REST convention
- Destinations likely store credentials, bucket config, region settings
- Follow standard CRUD: `destination.create`, `destination.list`, `destination.update`, `destination.delete`

**Recommended Pattern** (based on existing endpoint conventions):
```typescript
// POST /destination.create
{ bucketName, region, accessKey, secretKey, prefix? }

// GET /destination.list
Returns: Destination[] with { id, name, type, status }

// PUT /destination.update
Update credentials/config without recreating

// DELETE /destination.remove
Safe delete with confirmation check
```

**Key Insight:** CLI should validate destination connectivity before backup operations (mirror: `verifyConnection()` pattern).

---

## 3. Project Duplication Workflow

### Missing Implementation
**Current State:** No `project.duplicate` or app cloning in CLI.

**Inferred API Pattern** (following Dokploy conventions):
```typescript
// POST /project.duplicate
Request: { projectId, newName, includeApps?: boolean, includeEnvVars?: boolean }
Response: { projectId, name, clonedAppsCount }

// POST /application.clone
Request: { applicationId, projectId, newName }
Response: Application with new ID
```

**Best Practice Workflow:**
1. Fetch source project (full structure: environments, apps, vars)
2. Create destination project
3. Clone each app + env vars
4. Return summary with mapping (oldId → newId)

**Note:** Should preserve build/source config but reset deployment status.

---

## 4. Application Update Field Validation

### Current Implementation
**Location:** `src/commands/app.ts`

**Pattern Observed:**
- Uses POST for `application.one` (fetch), `application.deploy`, `application.stop/start`, `application.delete`
- No explicit UPDATE endpoint found (`PUT /application.update`)
- Field validation happens server-side (no client-side schema)

**Inferred Update Pattern:**
```typescript
// Likely POST /application.update (Dokploy convention, not PUT)
Request body: { applicationId, name?, buildType?, sourceType?, ... }
Response: Updated Application object

// Required validation fields:
- name: non-empty string
- buildType: enum ['dockerfile', 'nixpacks', 'buildpack', 'heroku_buildpacks', 'paketo_buildpacks', 'static']
- sourceType: enum ['github', 'gitlab', 'bitbucket', 'git', 'docker', 'drop']
```

**API Response Error Handling:**
```typescript
// Server returns ApiError with statusCode + message
// Client catches and displays via error() output utility
```

**Validation Best Practice:** Server-side validation enforced; CLI should:
- Pre-validate enums client-side for immediate feedback
- Show field-specific errors from server response
- Implement idempotent updates (safe retries)

---

## API Patterns Summary

| Pattern | Convention | Safety | Notes |
|---------|-----------|--------|-------|
| **HTTP Methods** | POST for actions/queries | Unusual but consistent | GET only for read-only lists |
| **Error Handling** | ApiError with statusCode | ✓ Strong | Catch + extract message |
| **Export/Import** | Versioned JSON + overwrite flag | ✓ Strong | Enables safe rollbacks |
| **CRUD** | `.create`, `.list`, `.update`, `.delete`, `.remove` | ✓ Consistent | Naming varies (`.remove` vs `.delete`) |
| **Validation** | Server-side enforced | ✓ Trusted | Client enums for UX |
| **Status Codes** | 401 (auth), 4xx (client errors) | ✓ Standard | Check response.ok first |

---

## Implementation Recommendations

1. **Export/Import:** Adopt versioning + conflict resolution (already in config)
2. **S3 Destinations:** Implement connectivity check before backup operations
3. **Project Duplication:** Batch create apps after project, return mapping object
4. **Field Validation:** Pre-validate enums, surface server error messages clearly
5. **Error Recovery:** Implement retry logic for idempotent operations (POST may repeat safely)

---

## Unresolved Questions

- Are destinations managed via CLI or only dashboard?
- Does project duplication preserve deployment secrets (API keys, env vars)?
- What's the actual HTTP method for app updates (POST vs PUT)?
- Is there a rate limit or batch operation size limit?
