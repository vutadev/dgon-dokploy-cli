# Dokploy CLI Command Reference

Complete documentation of all CLI commands, options, and subcommands available in dokploy-cli v0.2.0.

## Global Options

All commands accept these global flags:

```
--json              Output results as JSON (useful for scripting)
-q, --quiet         Suppress spinners and progress output
--config <path>     Path to custom config file
--server <url>      Override configured server URL
-a, --alias <name>  Use specific server configuration alias
--no-tui            Force CLI mode, disable TUI
```

## Authentication (auth)

Manage Dokploy server credentials and authentication.

### login
Interactive login to Dokploy server.

```bash
dokploy auth login
```

Prompts for:
- Server URL (e.g., https://dokploy.example.com)
- API Token (from Dokploy dashboard)

Saves credentials to `~/.config/dokploy/config.json`

### logout
Clear stored credentials.

```bash
dokploy auth logout
```

### whoami
Show currently authenticated user/server.

```bash
dokploy auth whoami
```

Output:
```
Server: https://dokploy.example.com
Token: 8char...4char
```

### verify
Test connection to Dokploy server.

```bash
dokploy auth verify
```

---

## Configuration (config)

Manage multiple server configurations and exports.

### list
List all configured server aliases.

```bash
dokploy config list
```

Output table with server URLs and default project IDs.

### add
Add new server configuration with alias.

```bash
dokploy config add [alias]
```

Interactive prompts for server URL and API token.

### remove
Remove server configuration.

```bash
dokploy config remove <alias>
dokploy config remove <alias> --force
```

### switch
Switch active server alias.

```bash
dokploy config switch <alias>
```

### export
Export configuration to file.

```bash
dokploy config export [file]
```

Options:
- `--servers`: Include all server aliases
- `--format <json|yaml>`: Output format

### import
Import configuration from file.

```bash
dokploy config import <file>
```

---

## Projects (project)

Manage deployment projects.

### list
List all projects.

```bash
dokploy project list
dokploy project ls
```

Output table with project IDs, names, and creation dates.

### create
Create new project.

```bash
dokploy project create
dokploy project create --name "My Project" --description "Project description"
```

Options:
- `-n, --name <name>`: Project name (interactive prompt if omitted)
- `-d, --description <text>`: Project description

### info
View project details.

```bash
dokploy project info <projectId>
dokploy project info <projectId> --full
```

Options:
- `--full`: Include environments and applications

### delete
Delete project.

```bash
dokploy project delete <projectId>
dokploy project delete <projectId> --force
```

Options:
- `-f, --force`: Skip confirmation prompt

---

## Applications (app)

Manage applications and deployments.

### list
List applications.

```bash
dokploy app list
dokploy app ls
dokploy app list --project <projectId>
```

Options:
- `-p, --project <projectId>`: Filter by specific project

### create
Create new application.

```bash
dokploy app create
dokploy app create --project <projectId> --name "My App"
```

Options:
- `-p, --project <projectId>`: Project ID (interactive selection if omitted)
- `-n, --name <name>`: Application name (interactive prompt if omitted)

### update
Update application settings.

```bash
dokploy app update <appId>
dokploy app update <appId> --name "New Name" --replicas 3
```

Options:
- `-n, --name <name>`: Application name
- `-d, --description <text>`: Description
- `--build-type <type>`: Build type (dockerfile|nixpacks|buildpack|static)
- `--replicas <n>`: Number of replicas
- `--docker-image <image>`: Docker image for docker source type
- `--memory-limit <mb>`: Memory limit in MB
- `--cpu-limit <cores>`: CPU limit (decimal cores)

### info
Show application details.

```bash
dokploy app info <appId>
dokploy app info <appId> --full
```

Options:
- `--full`: Include environment variables, domains, deployments, mounts, ports

### deploy
Start deployment.

```bash
dokploy app deploy <appId>
```

### start
Start application.

```bash
dokploy app start <appId>
```

### stop
Stop application.

```bash
dokploy app stop <appId>
```

### logs
View application logs.

```bash
dokploy app logs <appId>
dokploy app logs <appId> --follow --lines 200
```

Options:
- `-f, --follow`: Follow log output (not yet fully implemented)
- `-n, --lines <number>`: Number of lines to show (default: 100)

### delete
Delete application.

```bash
dokploy app delete <appId>
dokploy app delete <appId> --force
```

Options:
- `-f, --force`: Skip confirmation prompt

---

## Databases (db)

Manage databases.

### list
List databases.

```bash
dokploy db list
dokploy db ls
dokploy db list --project <projectId>
```

Options:
- `-p, --project <projectId>`: Filter by project

### create
Create new database.

```bash
dokploy db create
dokploy db create --name "mydb" --type postgres
```

Options:
- `-p, --project <projectId>`: Project ID
- `-n, --name <name>`: Database name
- `-t, --type <type>`: Database type (postgres|mysql|mongo|redis|mariadb)

### info
View database details.

```bash
dokploy db info <dbId>
```

### delete
Delete database.

```bash
dokploy db delete <dbId>
dokploy db delete <dbId> --force
```

Options:
- `-f, --force`: Skip confirmation

---

## Domains (domain)

Manage custom domains and SSL certificates.

### list
List domains.

```bash
dokploy domain list
dokploy domain ls
```

Output table with domain hosts, paths, HTTPS status, certificate types.

### create
Create domain binding.

```bash
dokploy domain create
dokploy domain create --app <appId> --host "example.com"
```

Options:
- `-a, --app <appId>`: Application ID
- `-h, --host <host>`: Domain host
- `-p, --path <path>`: URL path
- `--port <n>`: Custom port
- `--https`: Enable HTTPS
- `--cert <type>`: Certificate type (none|letsencrypt|custom)

### delete
Delete domain.

```bash
dokploy domain delete <domainId>
dokploy domain delete <domainId> --force
```

Options:
- `-f, --force`: Skip confirmation

---

## Environment Variables (env)

Manage application environment variables.

### list
List environment variables.

```bash
dokploy env list <appId>
dokploy env ls <appId>
```

### set
Set environment variable.

```bash
dokploy env set <appId>
dokploy env set <appId> --key "DEBUG" --value "true"
```

Options:
- `-k, --key <name>`: Variable name
- `-v, --value <value>`: Variable value

### delete
Delete environment variable.

```bash
dokploy env delete <appId> <varName>
dokploy env delete <appId> <varName> --force
```

Options:
- `-f, --force`: Skip confirmation

---

## Server (server)

Monitor server status and resources.

### stats
Show server statistics.

```bash
dokploy server stats
```

Output:
```
CPU Usage:     45.2%
Memory:        8.4GB / 16GB (52.5%)
Disk:          120GB / 250GB (48%)
```

### info
Show server information.

```bash
dokploy server info
```

Output hostname, OS, uptime, and kernel info.

---

## Backup Destinations (destination)

Configure S3-compatible backup storage.

### list
List backup destinations.

```bash
dokploy destination list
dokploy destination ls
```

Output table with destination IDs, names, buckets, regions, creation dates.

### add
Add S3-compatible backup destination.

```bash
dokploy destination add
dokploy destination add --name "AWS S3" --bucket "my-bucket" --region "us-east-1"
```

Interactive prompts for missing values. Options:
- `-n, --name <name>`: Destination name
- `--bucket <name>`: S3 bucket name
- `--region <region>`: S3 region (default: us-east-1)
- `--endpoint <url>`: Custom S3 endpoint (optional, for MinIO, etc.)
- `--access-key <key>`: AWS access key ID
- `--secret-key <key>`: AWS secret access key

### test
Test destination connectivity.

```bash
dokploy destination test <destinationId>
```

### remove
Remove backup destination.

```bash
dokploy destination remove <destinationId>
dokploy destination remove <destinationId> --force
```

Options:
- `-f, --force`: Skip confirmation

---

## Output Modes

### JSON Output
Use `--json` flag to output results as JSON for scripting:

```bash
dokploy project list --json | jq '.[] | .name'
dokploy app info <appId> --json | jq '.env'
```

### Quiet Mode
Use `-q` or `--quiet` to suppress progress spinners:

```bash
dokploy app deploy <appId> --quiet
```

### Table Format
Default human-readable output with formatted tables:

```
┌────────────────────┬──────────────┬──────────┐
│ ID                 │ Name         │ Status   │
├────────────────────┼──────────────┼──────────┤
│ app_abc123         │ My App       │ running  │
│ app_def456         │ API Service  │ idle     │
└────────────────────┴──────────────┴──────────┘
```

---

## Exit Codes

- `0`: Command succeeded
- `1`: Command failed (API error, invalid input, etc.)

---

## Configuration File

Stored at: `~/.config/dokploy/config.json`

Schema:
```json
{
  "currentAlias": "production",
  "servers": {
    "production": {
      "serverUrl": "https://dokploy.example.com",
      "apiToken": "your-api-token",
      "defaultProjectId": "proj_abc123"
    },
    "staging": {
      "serverUrl": "https://staging.dokploy.com",
      "apiToken": "staging-token"
    }
  }
}
```

---

## Examples

### Deploy an application
```bash
# Create project
dokploy project create --name "My Project"

# Create application
dokploy app create --project proj_123 --name "Web App"

# Set environment variables
dokploy env set app_456 --key DATABASE_URL --value "postgres://..."

# Add domain
dokploy domain create --app app_456 --host "app.example.com" --https

# Deploy
dokploy app deploy app_456
```

### Multi-server setup
```bash
# Add production server
dokploy config add production

# Add staging server
dokploy config add staging

# Switch between servers
dokploy config switch production
dokploy app list

dokploy config switch staging
dokploy app list
```

### Backup destination setup
```bash
# Add AWS S3 destination
dokploy destination add --name "AWS" --bucket "backups" --region "us-west-2" --access-key "..." --secret-key "..."

# Test connection
dokploy destination test dest_123

# List all destinations
dokploy destination list --json | jq '.[] | .name'
```

### Export configuration
```bash
# Export all server configs
dokploy config export myconfig.json --servers

# Import on another machine
dokploy config import myconfig.json
```

---

## Tips & Tricks

### Scripting with JSON
```bash
#!/bin/bash
# Get all application IDs in a project
dokploy app list --project proj_123 --json | jq -r '.[] | .applicationId'

# Deploy multiple apps
for app_id in $(dokploy app list --project proj_123 --json | jq -r '.[] | .applicationId'); do
  echo "Deploying $app_id..."
  dokploy app deploy $app_id
done
```

### Piping with jq
```bash
# Find app by name and get its ID
dokploy app list --json | jq '.[] | select(.name == "My App") | .applicationId'

# Get all running applications
dokploy app list --json | jq '.[] | select(.applicationStatus == "running")'
```

### Using with shell aliases
```bash
# Add to ~/.bashrc or ~/.zshrc
alias dok="dokploy --no-tui"
alias dok-prod="dokploy --alias production"
alias dok-stage="dokploy --alias staging"
```
