# Phase 2: Authentication Module

## Overview
Implement authentication commands: login, logout, whoami, verify. Store credentials in config file.

## Requirements
- Token-based auth via `x-api-key` header
- Persistent config storage (~/.dokploy/config.json)
- Token validation endpoint
- Secure token handling

## API Endpoints
- `POST /api/auth.login` - Login (if available)
- `GET /api/user.byAuth` - Get current user info
- Token generated from dashboard: `/settings/profile`

## Implementation Steps

### 1. Config Manager (src/lib/config.ts)
```typescript
import Conf from 'conf';

interface Config {
  serverUrl: string;
  token: string;
}

const config = new Conf<Config>({
  projectName: 'dokploy-cli',
  schema: {
    serverUrl: { type: 'string', default: '' },
    token: { type: 'string', default: '' }
  }
});

export const getConfig = () => config.store;
export const setConfig = (key: keyof Config, value: string) => config.set(key, value);
export const clearConfig = () => config.clear();
export const isAuthenticated = () => !!config.get('token');
```

### 2. API Client (src/lib/api.ts)
```typescript
import axios from 'axios';
import { getConfig } from './config.js';

export const createApiClient = (serverOverride?: string) => {
  const { serverUrl, token } = getConfig();
  return axios.create({
    baseURL: `${serverOverride || serverUrl}/api`,
    headers: { 'x-api-key': token }
  });
};
```

### 3. Auth Commands (src/commands/auth.ts)
```typescript
import { Command } from 'commander';

export const authCommand = new Command('auth')
  .description('Authentication commands');

authCommand
  .command('login')
  .description('Authenticate with Dokploy')
  .requiredOption('-s, --server <url>', 'Server URL')
  .requiredOption('-t, --token <token>', 'API token')
  .action(async (opts) => { /* save to config, verify */ });

authCommand
  .command('logout')
  .description('Clear authentication')
  .action(() => { /* clear config */ });

authCommand
  .command('whoami')
  .description('Show current user')
  .action(async () => { /* GET /api/user.byAuth */ });

authCommand
  .command('verify')
  .description('Verify token validity')
  .action(async () => { /* validate token */ });
```

### 4. Output Helper (src/lib/output.ts)
```typescript
import chalk from 'chalk';
import ora from 'ora';

export const success = (msg: string) => console.log(chalk.green('✓'), msg);
export const error = (msg: string) => console.log(chalk.red('✗'), msg);
export const spinner = (msg: string) => ora(msg);
export const json = (data: unknown) => console.log(JSON.stringify(data, null, 2));
```

## Commands Reference

| Command | Options | Description |
|---------|---------|-------------|
| `auth login` | `-s, --server`, `-t, --token` | Store credentials |
| `auth logout` | - | Clear stored credentials |
| `auth whoami` | - | Display current user |
| `auth verify` | - | Validate token |

## Success Criteria
- [ ] `dokploy auth login -s URL -t TOKEN` stores config
- [ ] `dokploy auth whoami` shows user info
- [ ] `dokploy auth verify` validates token
- [ ] `dokploy auth logout` clears config
- [ ] Invalid token shows clear error message

---

## Multi-Server Alias (v0.2.0)

### Storage
- **Config File**: `~/.config/dokploy/config.json`
- **Library**: Conf (handles storage, schema, migrations)

### Config Structure
```json
{
  "currentAlias": "default",
  "servers": {
    "default": {
      "serverUrl": "http://localhost:3000",
      "apiToken": "dk_xxx...",
      "defaultProjectId": "proj_123"
    },
    "production": {
      "serverUrl": "https://dokploy.example.com",
      "apiToken": "dk_yyy..."
    }
  }
}
```

### Key Functions (src/lib/config.ts)
| Function | Purpose |
|----------|---------|
| `setActiveAlias(alias)` | Set runtime alias (per-command `-a` flag) |
| `getActiveAlias()` | Get active alias (runtime > stored > 'default') |
| `getCurrentAlias()` | Get stored current alias |
| `setCurrentAlias(alias)` | Persist alias switch |
| `getServerConfig(alias?)` | Get server config by alias |
| `setServerConfig(alias, data)` | Store/update server config |
| `removeServerConfig(alias)` | Delete server config |
| `listServerAliases()` | List all aliases with isCurrent flag |

### Auth Commands Usage
```bash
# Login with alias
dokploy auth login -a production -s https://dokploy.example.com -t TOKEN

# List all servers
dokploy auth list        # or: dokploy auth ls

# Switch active server
dokploy auth use production

# Check current auth
dokploy auth whoami
dokploy auth whoami -a staging   # check specific alias

# Verify connection
dokploy auth verify

# Remove server
dokploy auth remove staging      # prompts confirmation
dokploy auth remove staging -f   # force, no prompt

# Logout
dokploy auth logout              # current alias
dokploy auth logout -a staging   # specific alias
dokploy auth logout --all        # all servers
```

### Global Alias Option
```bash
# Use -a/--alias with any command to target specific server
dokploy -a production project list
dokploy -a staging app deploy myapp
dokploy --alias dev db postgres list
```

### Config Export/Import (src/commands/config.ts)
```bash
# Export all servers
dokploy config export                    # → dokploy-config.json
dokploy config export backup.json        # custom filename
dokploy config export --stdout           # print to stdout

# Export specific aliases
dokploy config export -a production staging

# Import servers
dokploy config import backup.json
dokploy config import backup.json --overwrite  # overwrite existing

# Show config
dokploy config show    # displays all servers, current alias
dokploy config path    # prints config file path
```

### Migration (Legacy → Multi-Server)
Auto-migrates v0.1.x single-server config to v0.2.0 multi-server format:
```js
// OLD: { serverUrl, apiToken, defaultProjectId }
// NEW: { currentAlias: 'default', servers: { default: {...} } }
```

### Implementation Files
- `src/lib/config.ts` - Config management with Conf library
- `src/commands/auth.ts` - Auth subcommands
- `src/commands/config.ts` - Config export/import
- `src/types/index.ts` - Type definitions
