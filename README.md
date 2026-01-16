# Dokploy CLI - User Guide

CLI for Dokploy, a self-hosted deployment platform. Manage projects, applications, databases, domains, environments, and servers from the command line with full support for multi-server deployments.

**Version:** 0.2.3 | **License:** MIT | **Minimum Bun:** 1.1.0

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Global Options](#global-options)
4. [Command Reference](#command-reference)
   - [Auth Commands](#auth-commands)
   - [Config Commands](#config-commands)
   - [Project Commands](#project-commands)
   - [App Commands](#app-commands)
   - [Database Commands](#database-commands)
   - [Domain Commands](#domain-commands)
   - [Environment Commands](#environment-commands)
   - [Server Commands](#server-commands)
5. [Multi-Server Alias Usage](#multi-server-alias-usage)
6. [Configuration](#configuration)
7. [Development](#development)
8. [Troubleshooting](#troubleshooting)

---

## Installation

### Global Installation with Bun

```bash
bun add -g dokploy-cli
```

### Local Development

```bash
git clone <repository>
cd dokploy-cli
bun install
bun run dev              # Run in development mode
bun run build            # Build for distribution
```

---

## Quick Start

### 1. Login to Your Dokploy Server

```bash
dokploy auth login
```

You'll be prompted for:
- Dokploy server URL (default: `http://localhost:3000`)
- API token

The login is saved as the "default" alias.

### 2. Verify Connection

```bash
dokploy auth verify
```

### 3. List Your Projects

```bash
dokploy project list
```

### 4. Create a Project

```bash
dokploy project create --name "My App"
```

### 5. Create an Application

```bash
dokploy app create --project <projectId> --name "My Node App"
```

### 6. Deploy Your Application

```bash
dokploy app deploy <appId>
```

---

## Global Options

These options work with any command:

| Option | Description |
|--------|-------------|
| `-h, --help` | Display help for command |
| `--version` | Display CLI version |
| `--json` | Output results as JSON (useful for scripting) |
| `-q, --quiet` | Suppress spinners and progress indicators |
| `-a, --alias <name>` | Use a specific server alias |
| `--config <path>` | Use custom config file path |
| `--server <url>` | Override server URL for this command |

### Example Usage

```bash
# Output as JSON for parsing
dokploy project list --json

# Quiet mode (no spinners)
dokploy -q project list

# Use specific server
dokploy -a production app list

# Override server for single command
dokploy --server https://custom.example.com project list
```

---

## Command Reference

### Auth Commands

Manage authentication and server connections.

**Command:** `dokploy auth <subcommand>`

#### `auth login`

Authenticate with a Dokploy server. Saves credentials to local config.

```bash
dokploy auth login
dokploy auth login --alias prod --server https://prod.example.com --token "api-token-here"
```

| Option | Description |
|--------|-------------|
| `-s, --server <url>` | Server URL (prompts if not provided) |
| `-t, --token <token>` | API token (prompts if not provided) |
| `-a, --alias <name>` | Server alias (default: "default") |

#### `auth logout`

Logout from a server alias or all servers.

```bash
dokploy auth logout
dokploy auth logout --alias staging
dokploy auth logout --all
```

| Option | Description |
|--------|-------------|
| `-a, --alias <name>` | Server alias to logout from |
| `--all` | Logout from all servers |

#### `auth whoami`

Show current authentication status and server info.

```bash
dokploy auth whoami
dokploy auth whoami --alias production
```

| Option | Description |
|--------|-------------|
| `-a, --alias <name>` | Check specific alias |

#### `auth verify`

Verify connection to current or specified server.

```bash
dokploy auth verify
dokploy auth verify --alias staging
```

| Option | Description |
|--------|-------------|
| `-a, --alias <name>` | Verify specific alias |

#### `auth list` (alias: `ls`)

List all configured server aliases.

```bash
dokploy auth list
dokploy auth ls
```

#### `auth use <alias>`

Switch to a different server alias.

```bash
dokploy auth use production
dokploy auth use staging
```

#### `auth remove <alias>`

Remove a server configuration.

```bash
dokploy auth remove staging
dokploy auth remove staging --force   # Skip confirmation
```

| Option | Description |
|--------|-------------|
| `-f, --force` | Skip confirmation prompt |

---

### Config Commands

Manage and export/import configurations.

**Command:** `dokploy config <subcommand>`

#### `config export [file]`

Export server configurations to a file (for backup or sharing).

```bash
dokploy config export backup.json
dokploy config export --alias prod --alias staging team-config.json
dokploy config export --stdout          # Print to stdout
```

| Option | Description |
|--------|-------------|
| `-a, --alias <aliases...>` | Export only specific aliases |
| `--stdout` | Output to stdout instead of file |

#### `config import <file>`

Import server configurations from a file.

```bash
dokploy config import backup.json
dokploy config import backup.json --overwrite    # Overwrite existing aliases
```

| Option | Description |
|--------|-------------|
| `--overwrite` | Overwrite conflicting aliases |

#### `config show`

Display current configuration and all servers.

```bash
dokploy config show
```

#### `config path`

Show the path to the config file.

```bash
dokploy config path
```

---

### Project Commands

Manage Dokploy projects.

**Command:** `dokploy project <subcommand>`

#### `project list` (alias: `ls`)

List all projects on the current server.

```bash
dokploy project list
dokploy project ls --json
dokploy -a production project list
```

#### `project create`

Create a new project.

```bash
dokploy project create
dokploy project create --name "My Project" --description "Project description"
```

| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Project name (prompts if not provided) |
| `-d, --description <description>` | Project description (optional) |

#### `project delete <projectId>`

Delete a project.

```bash
dokploy project delete abc123def456
dokploy project delete abc123def456 --force   # Skip confirmation
```

| Option | Description |
|--------|-------------|
| `-f, --force` | Skip confirmation prompt |

#### `project info <projectId>`

Show detailed project information.

```bash
dokploy project info abc123def456
dokploy project info abc123def456 --json
```

---

### App Commands

Manage applications within projects.

**Command:** `dokploy app <subcommand>`

#### `app list` (alias: `ls`)

List all applications or filter by project.

```bash
dokploy app list
dokploy app list --project abc123def456
dokploy app ls --json
```

| Option | Description |
|--------|-------------|
| `-p, --project <projectId>` | Filter by specific project |

#### `app create`

Create a new application.

```bash
dokploy app create
dokploy app create --project abc123def456 --name "Node API"
```

| Option | Description |
|--------|-------------|
| `-p, --project <projectId>` | Project ID (prompts if not provided) |
| `-n, --name <name>` | Application name (prompts if not provided) |

#### `app deploy <appId>`

Deploy an application.

```bash
dokploy app deploy abc123def456
dokploy app deploy abc123def456 --json
```

#### `app logs <appId>`

View application deployment logs.

```bash
dokploy app logs abc123def456
dokploy app logs abc123def456 --follow
dokploy app logs abc123def456 --lines 50
```

| Option | Description |
|--------|-------------|
| `-f, --follow` | Follow log output (stream logs) |
| `-n, --lines <number>` | Number of log lines (default: 100) |

**Note:** Full log streaming requires SSE/WebSocket. Current implementation shows latest deployment info.

#### `app start <appId>`

Start a stopped application.

```bash
dokploy app start abc123def456
```

#### `app stop <appId>`

Stop a running application.

```bash
dokploy app stop abc123def456
```

#### `app delete <appId>`

Delete an application.

```bash
dokploy app delete abc123def456
dokploy app delete abc123def456 --force
```

| Option | Description |
|--------|-------------|
| `-f, --force` | Skip confirmation prompt |

#### `app info <appId>`

Show detailed application information.

```bash
dokploy app info abc123def456
dokploy app info abc123def456 --json
```

---

### Database Commands

Manage databases (PostgreSQL, MySQL, MongoDB, Redis, MariaDB).

**Command:** `dokploy db <subcommand>`

#### `db list` (alias: `ls`)

List all databases or filter by type.

```bash
dokploy db list
dokploy db list --type postgres
dokploy db ls --type mysql --json
```

| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Filter by type: postgres, mysql, mongo, redis, mariadb |

#### `db create`

Create a new database.

```bash
dokploy db create
dokploy db create --type postgres --project abc123def456 --name "mydb"
```

| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Database type (prompts if not provided) |
| `-p, --project <projectId>` | Project ID (prompts if not provided) |
| `-n, --name <name>` | Database name (prompts if not provided) |

**Supported Types:**
- `postgres` - PostgreSQL
- `mysql` - MySQL
- `mongo` - MongoDB
- `redis` - Redis
- `mariadb` - MariaDB

#### `db delete <dbId>`

Delete a database.

```bash
dokploy db delete abc123def456 --type postgres
dokploy db delete abc123def456 --type mysql --force
```

| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Database type (required) |
| `-f, --force` | Skip confirmation prompt |

#### `db start <dbId>`

Start a stopped database.

```bash
dokploy db start abc123def456 --type postgres
```

| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Database type (required) |

#### `db stop <dbId>`

Stop a running database.

```bash
dokploy db stop abc123def456 --type postgres
```

| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Database type (required) |

---

### Domain Commands

Manage domains and SSL certificates.

**Command:** `dokploy domain <subcommand>`

#### `domain list` (alias: `ls`)

List all domains or filter by application.

```bash
dokploy domain list
dokploy domain list --app abc123def456
dokploy domain ls --json
```

| Option | Description |
|--------|-------------|
| `-a, --app <appId>` | Filter by application ID |

#### `domain add`

Add a domain to an application.

```bash
dokploy domain add
dokploy domain add --app abc123def456 --host "app.example.com" --https
```

| Option | Description |
|--------|-------------|
| `-a, --app <appId>` | Application ID (prompts if not provided) |
| `-h, --host <host>` | Domain hostname (prompts if not provided) |
| `--https` | Enable HTTPS (prompts if not provided) |

#### `domain remove <domainId>`

Remove a domain from an application.

```bash
dokploy domain remove abc123def456
dokploy domain remove abc123def456 --force
```

| Option | Description |
|--------|-------------|
| `-f, --force` | Skip confirmation prompt |

#### `domain ssl <domainId>`

Generate or renew SSL certificate for a domain (Let's Encrypt).

```bash
dokploy domain ssl abc123def456
```

---

### Environment Commands

Manage application environment variables.

**Command:** `dokploy env <subcommand>`

#### `env pull [file]`

Download environment variables to a local file.

```bash
dokploy env pull
dokploy env pull .env.local --app abc123def456
dokploy env pull config/.env.production
```

| Option | Description |
|--------|-------------|
| `-a, --app <appId>` | Application ID (prompts if not provided) |

#### `env push [file]`

Upload environment variables from a local file.

```bash
dokploy env push
dokploy env push .env --app abc123def456
dokploy env push config/.env.staging
```

| Option | Description |
|--------|-------------|
| `-a, --app <appId>` | Application ID (prompts if not provided) |

**File Format:**

```env
DATABASE_URL=postgresql://user:pass@host/db
API_KEY=secret-key-here
DEBUG=false
```

#### `env show`

Display environment variables for an application in the terminal.

```bash
dokploy env show
dokploy env show --app abc123def456
dokploy env show --app abc123def456 --json
```

| Option | Description |
|--------|-------------|
| `-a, --app <appId>` | Application ID (prompts if not provided) |

---

### Server Commands

Manage and monitor deployment servers.

**Command:** `dokploy server <subcommand>`

#### `server list` (alias: `ls`)

List all available servers.

```bash
dokploy server list
dokploy server ls --json
```

#### `server stats [serverId]`

Show real-time server statistics (CPU, memory, disk usage).

```bash
dokploy server stats
dokploy server stats abc123def456
dokploy server stats --json
```

**Output includes:**
- CPU usage percentage
- Memory usage (percent and GB)
- Disk usage (percent and GB)

#### `server info <serverId>`

Show detailed server information.

```bash
dokploy server info abc123def456
dokploy server info abc123def456 --json
```

---

## Multi-Server Alias Usage

Dokploy CLI supports managing multiple Dokploy servers with named aliases. Useful for development, staging, and production environments.

### Setup Multiple Servers

```bash
# Add production server
dokploy auth login --alias prod --server https://prod.example.com --token "prod-api-token"

# Add staging server
dokploy auth login --alias staging --server https://staging.example.com --token "staging-api-token"

# Add development server (local)
dokploy auth login --alias dev --server http://localhost:3000 --token "dev-token"

# List all configured servers
dokploy auth list
```

Output:
```
┌─────────┬────────────────────────────┐
│ Alias   │ Server                     │
├─────────┼────────────────────────────┤
│ prod    │ https://prod.example.com   │
│ staging │ https://staging.example.com│
│ dev     │ http://localhost:3000      │
└─────────┴────────────────────────────┘
```

### Switch Default Server

```bash
# Set production as default
dokploy auth use prod

# Verify current server
dokploy auth whoami
```

### Run Commands on Specific Server

Use the `-a` or `--alias` flag with any command:

```bash
# List projects on staging
dokploy -a staging project list

# Deploy on production
dokploy --alias prod app deploy abc123def456

# Create database on dev server
dokploy -a dev db create --type postgres --name mydb

# Check production server stats
dokploy -a prod server stats
```

### Advanced Multi-Server Workflows

#### Deploy Same App Across Environments

```bash
#!/bin/bash

APP_ID="abc123def456"
ENVIRONMENTS=("dev" "staging" "prod")

for env in "${ENVIRONMENTS[@]}"; do
    echo "Deploying to $env..."
    dokploy -a "$env" app deploy "$APP_ID"
    dokploy -a "$env" app logs "$APP_ID"
done
```

#### Backup All Server Configurations

```bash
# Export prod configuration
dokploy -a prod config export prod-backup.json

# Export staging configuration
dokploy -a staging config export staging-backup.json

# Export all at once
dokploy config export --alias prod --alias staging --alias dev all-servers.json
```

#### Copy Configuration Between Servers

```bash
# Export prod config
dokploy -a prod config export prod-config.json

# Switch to staging and import
dokploy auth use staging
dokploy config import prod-config.json --overwrite
```

#### Monitor Multiple Servers

```bash
# Check server status across all environments
dokploy -a dev server stats
dokploy -a staging server stats
dokploy -a prod server stats
```

#### List Apps on All Servers

```bash
#!/bin/bash

for alias in $(dokploy auth list --json | jq -r '.servers[].alias'); do
    echo "=== Applications on $alias ==="
    dokploy -a "$alias" app list --json | jq '.[] | {name, status: .applicationStatus}'
done
```

#### Sync Environment Variables

```bash
# Pull vars from production
dokploy -a prod env pull .env.prod

# Push to staging
dokploy -a staging env push .env.prod

# Verify on staging
dokploy -a staging env show
```

---

## Configuration

### Config File Location

Configurations are stored in:

**Linux/Mac:** `~/.config/dokploy/config.json`
**Windows:** `%APPDATA%\dokploy\config.json`

### Config File Structure

```json
{
  "currentAlias": "prod",
  "servers": {
    "default": {
      "serverUrl": "http://localhost:3000",
      "apiToken": "default-token"
    },
    "prod": {
      "serverUrl": "https://prod.example.com",
      "apiToken": "prod-api-token-here"
    },
    "staging": {
      "serverUrl": "https://staging.example.com",
      "apiToken": "staging-api-token-here"
    }
  }
}
```

### Environment Variables

You can override settings via environment variables:

```bash
# Override server URL for current command
DOKPLOY_SERVER=https://custom.example.com dokploy project list

# Override API token
DOKPLOY_TOKEN=new-token dokploy auth verify
```

### Config Export/Import

Share configurations with team members securely:

```bash
# Export specific servers
dokploy config export --alias prod --alias staging team-config.json

# Team member imports
dokploy config import team-config.json

# View imported config
dokploy config show
```

---

## Development

### Build Project

```bash
bun run build
```

Outputs compiled CLI to `dist/` directory.

### Run Tests

```bash
bun test
```

### Type Check

```bash
bun run typecheck
```

### Lint Code

```bash
bun run lint
```

### Development Watch Mode

```bash
bun run dev
```

### Project Structure

```
src/
├── index.ts                    # CLI entry point & global options
├── commands/
│   ├── auth.ts                # Authentication & server management
│   ├── config.ts              # Configuration export/import
│   ├── project.ts             # Project management
│   ├── app.ts                 # Application management
│   ├── db.ts                  # Database management
│   ├── domain.ts              # Domain & SSL management
│   ├── env.ts                 # Environment variable management
│   └── server.ts              # Server monitoring & info
├── lib/
│   ├── api.ts                 # Dokploy API client (HTTP requests)
│   ├── config.ts              # Local config management (file storage)
│   └── output.ts              # Terminal UI & formatting helpers
├── types/
│   └── index.ts               # TypeScript type definitions
└── __tests__/                 # Test files
```

---

## Troubleshooting

### Common Issues

#### "Not logged in" / "Not authenticated"

```bash
# Verify authentication status
dokploy auth whoami

# Login to server
dokploy auth login

# Check config file
dokploy config show
```

#### "Connection failed"

```bash
# Verify connection
dokploy auth verify

# Check server URL
dokploy auth list

# Test with specific server
dokploy --server https://your-server.com auth verify
```

#### "Server not found"

```bash
# List configured servers
dokploy auth list

# Use correct alias
dokploy -a production project list
```

#### "API Error" / "Invalid token"

```bash
# Re-authenticate
dokploy auth login --alias <current-alias>

# Or remove and re-add server
dokploy auth remove <alias>
dokploy auth login --alias <alias>
```

#### Config File Issues

```bash
# Find config location
dokploy config path

# Backup and reset
dokploy config export backup.json
dokploy auth logout --all
dokploy auth login  # Start fresh
```

### Getting Help

- Run `dokploy --help` for general help
- Run `dokploy <command> --help` for command-specific help
- Run `dokploy <command> <subcommand> --help` for subcommand help

```bash
dokploy --help
dokploy auth --help
dokploy auth login --help
dokploy project create --help
```

### Debug Mode

Enable detailed output:

```bash
# Verbose output (all operations)
dokploy project list

# JSON output for parsing
dokploy project list --json

# Quiet mode (suppress spinners)
dokploy -q project list
```

---

## Additional Resources

- [Dokploy Official Website](https://dokploy.com)
- [Dokploy API Documentation](https://docs.dokploy.com)
- [GitHub Repository](https://github.com/vutadev/dgon-dokploy-cli)
- [Issue Tracker](https://github.com/vutadev/dgon-dokploy-cli/issues)

---

**Last Updated:** January 2026 | **CLI Version:** 0.2.3
