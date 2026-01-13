# dokploy-cli Documentation

CLI for Dokploy, a self-hosted deployment platform. Manage projects, applications, databases, domains, and servers from the command line.

## Installation

Install globally with Bun:

```bash
bun add -g dokploy-cli
```

Or run directly:

```bash
bun install
bun run src/index.ts
```

## Quick Start

1. **Login to your Dokploy server**

   ```bash
   dokploy auth login
   ```

2. **Add multiple servers with aliases**

   ```bash
   dokploy auth login --alias prod --server https://prod.example.com
   dokploy auth login --alias staging --server https://staging.example.com
   ```

3. **Switch between servers**

   ```bash
   dokploy auth use prod
   dokploy auth list  # Show all configured servers
   ```

4. **List projects**

   ```bash
   dokploy project list
   ```

## Command Reference

| Command | Subcommand | Description |
|---------|-----------|-------------|
| `auth` | `login` | Authenticate with Dokploy server |
| `auth` | `logout` | Clear stored credentials |
| `auth` | `whoami` | Show current auth status |
| `auth` | `verify` | Verify connection to server |
| `auth` | `list` | List all configured servers |
| `auth` | `use` | Switch to a different server |
| `auth` | `remove` | Remove a server configuration |
| `config` | `export` | Export server configurations |
| `config` | `import` | Import server configurations |
| `config` | `show` | Show current configuration |
| `config` | `path` | Show config file path |
| `project` | `list` | List all projects |
| `project` | `create` | Create new project |
| `project` | `delete` | Delete project |
| `project` | `info` | Show project details |
| `app` | `list` | List applications |
| `app` | `create` | Create new application |
| `app` | `deploy` | Deploy application |
| `app` | `logs` | View application logs |
| `app` | `stop` | Stop application |
| `app` | `start` | Start application |
| `app` | `delete` | Delete application |
| `db` | `list` | List databases |
| `db` | `create` | Create new database |
| `db` | `delete` | Delete database |
| `domain` | `list` | List domains |
| `domain` | `add` | Add domain to application |
| `domain` | `remove` | Remove domain |
| `domain` | `ssl` | Generate SSL certificate |
| `env` | `pull` | Pull env vars to file |
| `env` | `push` | Push env vars from file |
| `env` | `show` | Show env vars |
| `server` | `list` | List servers |
| `server` | `stats` | Show server statistics |
| `server` | `info` | Show server information |

## Global Options

- `--json` - Output as JSON (for scripting)
- `-q, --quiet` - Suppress spinners and progress
- `-a, --alias <name>` - Use specific server alias
- `--config <path>` - Path to config file
- `--server <url>` - Override server URL
- `-h, --help` - Show help text

**Example:**

```bash
dokploy project list --json
dokploy -a staging app list       # Use staging server
dokploy --alias prod app deploy   # Use prod server
```

## Multi-Server Configuration

Configure multiple Dokploy servers with aliases:

```bash
# Add servers
dokploy auth login --alias default
dokploy auth login --alias prod --server https://prod.example.com
dokploy auth login --alias staging --server https://staging.example.com

# List configured servers
dokploy auth list

# Switch default server
dokploy auth use prod

# Run commands on specific server
dokploy -a staging project list
dokploy --alias prod app deploy myapp

# Remove a server
dokploy auth remove staging
```

## Export/Import Configuration

Backup and share server configurations:

```bash
# Export all servers
dokploy config export backup.json

# Export specific servers
dokploy config export --alias prod --alias staging teams.json

# Import from file
dokploy config import backup.json

# Import with overwrite
dokploy config import backup.json --overwrite

# View current config
dokploy config show
```

## Configuration Storage

Config stored in `~/.config/dokploy/config.json`:

```json
{
  "currentAlias": "default",
  "servers": {
    "default": {
      "serverUrl": "http://localhost:3000",
      "apiToken": "your-api-token"
    },
    "prod": {
      "serverUrl": "https://prod.example.com",
      "apiToken": "prod-token"
    }
  }
}
```

## Development Setup

```bash
bun install          # Install dependencies
bun run dev          # Run in dev mode
bun run typecheck    # Type checking
bun test             # Run tests
bun run build        # Build for distribution
```

## Project Structure

```
src/
├── index.ts              # CLI entry point
├── commands/             # Command implementations
│   ├── auth.ts
│   ├── config.ts
│   ├── project.ts
│   ├── app.ts
│   ├── db.ts
│   ├── domain.ts
│   ├── env.ts
│   └── server.ts
├── lib/                  # Shared utilities
│   ├── api.ts           # Dokploy API client
│   ├── config.ts        # Configuration management
│   └── output.ts        # Terminal UI helpers
├── types/
│   └── index.ts         # TypeScript type definitions
└── __tests__/           # Test files
```

## Troubleshooting

- **"Not authenticated"**: Run `dokploy auth login` first
- **"Connection failed"**: Verify with `dokploy auth verify`
- **"Server not found"**: Check alias with `dokploy auth list`
