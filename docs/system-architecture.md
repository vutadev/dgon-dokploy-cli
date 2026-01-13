# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 CLI User (Terminal)                      │
│  (Interactive TTY with --no-tui forces CLI mode)       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ├─ TUI Mode (Ink/React) ─┐
                         │                         │
        ┌────────────────▼─────────┐     ┌────────▼────┐
        │  Commander.js CLI        │     │ TUI App     │
        │  (CLI Framework)         │     │ (Interactive)
        └────────┬─────────────────┘     └────────┬────┘
                 │                               │
        ┌────────┴───────────────────────────────┘
        │
   ┌────▼──────────────┐
   │ 9 Command Modules │
   │ + TUI Integration │
   └────┬──────────────┘
        │
        ├─► auth, config, project, app, db
        ├─► domain, env, server, destination
        │
        ├─────────────────────────────────────┐
        │                                     │
   ┌────▼────┐  ┌───────────────┐  ┌────────▼──────┐
   │ Output  │  │ Config Manager│  │ API Client    │
   │ Layer   │  │ (multi-server)│  │ (Type-safe)   │
   └────┬────┘  └───────┬───────┘  └────────┬──────┘
        │                │                  │
        └────────────────┼──────────────────┘
                         │
              ┌──────────▼──────────┐
              │  Dokploy REST API   │
              │  Authentication:    │
              │  x-api-key header   │
              └─────────────────────┘
```

## Component Descriptions

### CLI Framework (Commander.js)
- Parses command-line arguments
- Routes to appropriate command handler
- Manages global options (`--json`, `--quiet`, etc.)
- Provides help documentation

**Entry Point**: `src/index.ts`
- Initializes program with version and description
- Registers all command modules
- Sets up global hooks for option processing

### Commands (9 Modules)
Each module handles a resource domain:

| Module | Endpoints | Operations |
|--------|-----------|-----------|
| **auth** | N/A | Login, logout, whoami, verify |
| **config** | N/A | Manage multi-server aliases, export/import |
| **project** | /project.* | List, create, delete, info |
| **app** | /application.* | List, create, update, delete, deploy, start, stop, logs, info |
| **db** | /database.* | List, create, delete |
| **domain** | /domain.* | List, create, delete |
| **env** | /env.* | List, set, delete |
| **server** | /server.* | Stats, info |
| **destination** | /destination.* | List, add, test, remove (S3 backup storage) |

### Output Layer (lib/output.ts)
Terminal UI utilities:
- **Spinners**: Async operation feedback (ora)
- **Tables**: Structured data display (console-table-printer)
- **Colors**: Terminal colors (picocolors)
- **Prompts**: Interactive input (inquirer)
- **JSON Export**: Programmatic output format

Output modes:
- **Human**: Pretty tables, colors, spinners (default)
- **JSON**: Structured data for scripting
- **Quiet**: Minimal feedback

### Config Manager (lib/config.ts)
Local credential storage:
- Store: Server URL, API token, default project ID
- Location: `~/.config/dokploy/config.json`
- Provider: conf library (atomic writes, auto-migration)
- Validation: Schema-based with defaults

### API Client (lib/api.ts)
HTTP communication layer:
- **Method**: fetch (Bun native)
- **Headers**: Content-Type, x-api-key authentication
- **Error Handling**: Custom ApiError with status codes
- **Type Safety**: Generic response typing
- **Helpers**: Convenience methods (api.get, api.post, etc.)

### Type Definitions (types/index.ts)
Global TypeScript interfaces:
- Domain models (Project, Application, Database, etc.)
- Config shapes (DokployConfig)
- API response wrappers
- Deployment and domain types

## Data Flow

### Authentication Flow
```
User input (server URL, token)
    ↓
Validate URL format
    ↓
Verify connection (GET /project.all)
    ↓
On success: Save to config.json
On failure: Show error, exit
```

### Command Execution Flow
```
User types command (e.g., dokploy project list)
    ↓
Commander parses arguments
    ↓
Global hooks process --json, --quiet flags
    ↓
Command handler executes
    ↓
Handler calls API client
    ↓
API client fetches from Dokploy
    ↓
Response parsed and typed
    ↓
Output formatter displays results
    ↓
Process exits (0 on success, 1 on error)
```

### Error Handling Flow
```
API request fails
    ↓
Check HTTP status code
    ↓
Parse error response (JSON)
    ↓
Throw ApiError with message
    ↓
Command catch block handles
    ↓
User-friendly error message displayed
    ↓
Process exits with code 1
```

## Dependencies

### External Packages
- **commander** (12.1+): CLI argument parsing
- **picocolors** (1.1+): Terminal colors
- **ora** (8.1+): Loading spinners
- **@inquirer/prompts** (7.2+): Interactive input
- **conf** (13.0+): Config file management
- **console-table-printer** (2.12+): Table formatting

### Built-in Bun APIs
- `fetch`: HTTP requests
- `process`: Exit codes, environment
- `fs`: Config file I/O (via conf)

## Security Model

- **Authentication**: API token in `x-api-key` header
- **Storage**: Config saved in user home directory (0600 permissions)
- **Token Masking**: Display only first/last 4 chars in UI
- **HTTPS**: Required for production servers (enforced by validation)
- **Error Messages**: No sensitive data in logs

## Scalability Considerations

- Commands are stateless (share no memory between runs)
- Config is cached per process (single read at startup)
- API calls are sequential (no concurrent request batching)
- Output buffering handled by terminal libraries
