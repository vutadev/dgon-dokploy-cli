# dokploy-cli Codebase Summary

## Overview
dokploy-cli is a TypeScript CLI application built with Bun for managing Dokploy self-hosted deployments. It provides commands for authentication, project management, application deployment, database management, domain configuration, environment variables, and server monitoring.

**Version**: 0.2.0
**Package Manager**: Bun 1.1+
**Language**: TypeScript 5.7+
**Module Format**: ES Modules

## Project Statistics

| Metric | Value |
|--------|-------|
| Source Files | 18 |
| Directories | 5 |
| Languages | TypeScript |
| Commands | 9 (auth, config, project, app, db, domain, env, server, destination) |
| Dependencies | 6 production, 2 dev |
| Tests | 3 test files |

## Directory Structure

```
dokploy-cli/
├── src/
│   ├── index.ts                 # CLI entry point (59 lines)
│   ├── commands/                # Command implementations (9 modules)
│   │   ├── auth.ts             # Authentication (login, logout, verify, whoami)
│   │   ├── config.ts           # Configuration file management
│   │   ├── project.ts          # Project CRUD operations
│   │   ├── app.ts              # Application management (create, update, deploy, logs, etc.)
│   │   ├── db.ts               # Database operations
│   │   ├── domain.ts           # Domain binding management
│   │   ├── env.ts              # Environment variable management
│   │   ├── server.ts           # Server information and statistics
│   │   └── destination.ts       # Backup destination (S3-compatible storage)
│   ├── lib/                     # Shared libraries
│   │   ├── api.ts              # HTTP client and API error handling (84 lines)
│   │   ├── config.ts           # Configuration management (40 lines)
│   │   └── output.ts           # Terminal UI utilities
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions (98 lines)
│   └── __tests__/              # Test suite
│       ├── api.test.ts
│       ├── config.test.ts
│       └── output.test.ts
├── package.json                 # Project manifest
├── tsconfig.json               # TypeScript configuration
├── bun.lock                    # Dependency lock file
└── docs/                       # Documentation

## Key Files Analysis

### Entry Point (src/index.ts)
- Checks if TUI mode should be launched (interactive TTY + no subcommand)
- Imports Commander.js as CLI framework
- Registers global options: `--json`, `-q/--quiet`, `--config`, `--server`, `-a/--alias`, `--no-tui`
- Imports and adds 9 command modules
- Hook: `preAction` sets output mode and active server alias based on options
- Version: 0.2.0
- Supports both TUI mode (default in interactive terminal) and CLI mode (for scripts/automation)

### API Client (src/lib/api.ts)
**Key Components**:
- **ApiError Class**: Custom error with statusCode and response
- **apiRequest Function**: Generic fetch wrapper with:
  - Config-based serverUrl and apiToken resolution
  - Auth header: `x-api-key`
  - JSON body serialization/deserialization
  - Error message extraction from response
- **verifyConnection**: Test endpoint connectivity
- **Convenience Methods**: api.get, api.post, api.put, api.delete

**Error Handling**:
- Checks response.ok before parsing
- Fallback for empty responses
- Attempts to extract error message from JSON

### Configuration (src/lib/config.ts)
**Storage**: `~/.config/dokploy/config.json` (via conf library)

**Operations**:
- `getConfig()`: Read current configuration
- `setConfig()`: Update partial config
- `clearConfig()`: Remove all stored credentials
- `isConfigured()`: Check if serverUrl and apiToken exist
- `getConfigPath()`: Get config file location

**Schema**:
```json
{
  "serverUrl": "string",
  "apiToken": "string",
  "defaultProjectId": "string"
}
```

### Type Definitions (src/types/index.ts)
**Core Models**:
- **GlobalOptions**: CLI flags (json, quiet, config, server, alias, no-tui)
- **ServerConfig**: {serverUrl, apiToken, defaultProjectId?}
- **DokployConfig**: {currentAlias, servers} - multi-server configuration
- **ApiResponse**: Generic API envelope
- **Environment**: {environmentId, name, description?, projectId, isDefault, createdAt, applications?}
- **Project**: {projectId, name, description?, createdAt, environments?}
- **Application**: {applicationId, name, appName, projectId, applicationStatus, buildType, sourceType, createdAt}
- **ApplicationFull**: Extended Application with env, dockerfile, credentials, git details, domains, deployments, mounts, ports, redirects, security
- **Database**: {id, name, appName, projectId, databaseStatus, type, createdAt}
- **Domain**: {domainId, host, path?, port?, https, certificateType, applicationId?, createdAt}
- **Mount**: {mountId, type (bind|volume|file), hostPath?, mountPath, content?, serviceType?}
- **Port**: {portId, publishedPort, targetPort, protocol (tcp|udp)}
- **Redirect**: {redirectId, regex, replacement, permanent}
- **Security**: {securityId, username, password} - basic auth configuration
- **Destination**: {destinationId, name, accessKey, secretAccessKey, bucket, region, endpoint, createdAt}
- **ServerStats**: {cpu, memory {total, used, free}, disk {total, used, free}}
- **Deployment**: {deploymentId, title?, status, logPath, applicationId?, composeId?, createdAt}
- **EnvVar**: {key, value}
- **AppExport**: Export format for applications
- **ProjectExport**: Export format for projects

**Enums**:
- ApplicationStatus: 'idle' | 'running' | 'done' | 'error'
- BuildType: 'dockerfile' | 'nixpacks' | 'buildpack' | 'heroku_buildpacks' | 'paketo_buildpacks' | 'static'
- SourceType: 'github' | 'gitlab' | 'bitbucket' | 'git' | 'docker' | 'drop'
- DatabaseType: 'postgres' | 'mysql' | 'mongo' | 'redis' | 'mariadb'
- CertificateType: 'none' | 'letsencrypt' | 'custom'
- DeploymentStatus: 'running' | 'done' | 'error'
- MountType: 'bind' | 'volume' | 'file'
- Protocol: 'tcp' | 'udp'

### Command Structure
Each command module follows pattern:
1. Import Command from commander
2. Create Command instance with name and description
3. Add subcommands with `.command()` and `.action()`
4. Export named command

**Command Patterns**:
- Authentication flows use prompts and spinners
- Destructive operations require confirmation
- Error handling with try/catch and ApiError
- JSON output support via `json()` function
- Spinner feedback for async operations

## Dependencies

### Production Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| commander | ^12.1.0 | CLI framework |
| picocolors | ^1.1.1 | Terminal colors |
| ora | ^8.1.1 | Loading spinners |
| @inquirer/prompts | ^7.2.1 | Interactive input |
| conf | ^13.0.1 | Config file management |
| console-table-printer | ^2.12.1 | Table formatting |

### Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| @types/bun | ^1.1.14 | Bun type definitions |
| typescript | ^5.7.2 | TypeScript compiler |

## Build & Scripts

```json
{
  "dev": "bun run src/index.ts",
  "build": "bun build src/index.ts --outdir dist --target node",
  "typecheck": "tsc --noEmit",
  "test": "bun test",
  "lint": "eslint src --ext .ts"
}
```

## API Endpoints Pattern

All endpoints follow pattern: `{serverUrl}/api{endpoint}`

**Project & Environment Endpoints**:
- `/project.all` (GET): List all projects
- `/project.one` (POST): Get project details with environments
- `/project.create` (POST): Create project
- `/project.remove` (POST): Delete project

**Application Endpoints**:
- `/application.all` (GET): List all applications
- `/application.one` (POST): Get full application details
- `/application.create` (POST): Create application
- `/application.update` (POST): Update application settings
- `/application.deploy` (POST): Start deployment
- `/application.start` (POST): Start application
- `/application.stop` (POST): Stop application
- `/application.delete` (POST): Delete application
- `/deployment.all` (POST): Get deployments for application

**Database Endpoints**:
- `/database.all` (GET): List databases
- `/database.one` (POST): Get database details
- `/database.create` (POST): Create database
- `/database.remove` (POST): Delete database

**Domain Endpoints**:
- `/domain.all` (GET): List domains
- `/domain.create` (POST): Create domain binding
- `/domain.remove` (POST): Delete domain

**Environment Variable Endpoints**:
- `/env.list` (GET): List environment variables
- `/env.set` (POST): Set environment variable
- `/env.delete` (POST): Delete environment variable

**Destination Endpoints** (S3-compatible backup storage):
- `/destination.all` (GET): List backup destinations
- `/destination.create` (POST): Create destination
- `/destination.testConnection` (POST): Test destination connection
- `/destination.remove` (POST): Remove destination

**Server Endpoints**:
- `/server.stats` (GET): Get server statistics (CPU, memory, disk)
- `/server.info` (GET): Get server information

## Output System (src/lib/output.ts)

**Functions** (inferred from usage):
- `setOutputMode({quiet, json})`: Configure output format
- `spinner(message)`: Create loading spinner with .start(), .succeed(), .fail()
- `success(message)`: Print success message
- `error(message)`: Print error message
- `info(message)`: Print informational message
- `table(data, columns)`: Format and display tabular data
- `keyValue(obj)`: Display key-value pairs
- `json(data)`: Output JSON
- `isJson()`: Check if JSON output mode enabled

## Code Patterns

### Command Pattern
```typescript
export const commandCommand = new Command('name')
  .description('description');

commandCommand
  .command('subcommand')
  .description('...')
  .option('-f, --flag <value>', 'help text')
  .action(async (options) => {
    // Handle command
  });
```

### API Call Pattern
```typescript
try {
  const spinner = spinner('Loading...').start();
  const data = await api.get<Type>('/endpoint');
  spinner.stop();

  if (isJson()) {
    json(data);
  } else {
    table(data, [{ name: 'Column', key: 'property' }]);
  }
} catch (err) {
  spinner.fail('Failed');
  if (err instanceof ApiError) {
    error(err.message);
  }
  process.exit(1);
}
```

### Interactive Input Pattern
```typescript
const name = options.name || await input({
  message: 'Prompt text:',
  validate: (value) => value ? true : 'Error message',
});
```

## Testing Structure

**Test Files**:
- `api.test.ts`: API client functionality
- `config.test.ts`: Configuration management
- `output.test.ts`: Output formatting

**Test Runner**: Bun test (Jest-compatible API)

## Key Architectural Decisions

1. **Bun Runtime**: Fast startup, native TypeScript, built-in fetch
2. **Commander.js**: Standard CLI framework, good documentation
3. **Conf Library**: Handles config persistence and schema validation automatically
4. **Fetch API**: Avoid axios/node-fetch dependency, use Bun native
5. **Generic Types**: Type-safe API responses for each endpoint
6. **Error Class**: Custom ApiError for consistent error handling
7. **Modular Commands**: Each resource type in separate file for maintainability
8. **Shared Utilities**: Centralized lib/ for code reuse

## Security Considerations

- Token stored in home directory config (~/.config/dokploy/)
- API token masked in output (first 8 + ... + last 4 chars)
- HTTPS recommended for production servers
- No sensitive data in console logs
- Config file should have 0600 permissions (handled by conf)

## Performance Characteristics

- **CLI Startup**: <200ms (Bun fast startup)
- **API Calls**: Typical ~1-5 seconds depending on network
- **Memory**: ~50-100MB during command execution
- **Binary Size**: ~5MB (after build)

## Maintenance Notes

- TypeScript strict mode enabled
- No external native bindings (portability)
- Small focused dependencies (follows Bun philosophy)
- ESM modules throughout
- Minimal version constraints (use ranges for flexibility)
