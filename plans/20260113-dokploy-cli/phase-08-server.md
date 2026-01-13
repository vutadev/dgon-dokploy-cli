# Phase 8: Server Commands

## Overview
Implement server management: list, stats, info for monitoring Dokploy servers.

## Requirements
- List available servers
- Show server statistics (CPU, memory, disk)
- Display server info and configuration
- Support multi-server setups

## API Endpoints
- `GET /api/server.all` - List all servers
- `GET /api/server.one` - Get server details
- `GET /api/server.stats` - Get server statistics
- `GET /api/server.info` - Get server system info

## Implementation Steps

### 1. Server Types (src/types/server.ts)
```typescript
export interface Server {
  serverId: string;
  name: string;
  ipAddress: string;
  port: number;
  sshKeyId?: string;
  createdAt: string;
}

export interface ServerStats {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
}
```

### 2. Server Commands (src/commands/server.ts)
```typescript
import { Command } from 'commander';

export const serverCommand = new Command('server')
  .description('Manage servers');

serverCommand
  .command('list')
  .description('List all servers')
  .action(async function() {
    const api = createApiClient();
    const { data } = await api.get('/server.all');

    if (this.optsWithGlobals().json) {
      outputJson(data);
    } else {
      outputTable(data, ['serverId', 'name', 'ipAddress', 'port']);
    }
  });

serverCommand
  .command('stats')
  .description('Show server statistics')
  .argument('[serverId]', 'Server ID (default: main server)')
  .action(async function(serverId) {
    const api = createApiClient();
    const params = serverId ? { serverId } : {};
    const { data } = await api.get('/server.stats', { params });

    if (this.optsWithGlobals().json) {
      outputJson(data);
    } else {
      displayStats(data);
    }
  });

serverCommand
  .command('info')
  .description('Show server system info')
  .argument('[serverId]', 'Server ID')
  .action(async function(serverId) {
    const api = createApiClient();
    const { data } = await api.get('/server.info', {
      params: serverId ? { serverId } : {}
    });
    outputJson(data);
  });

// Helper for stats display
const displayStats = (stats: ServerStats) => {
  console.log('\nCPU Usage:');
  console.log(progressBar(stats.cpu.usage) + ` ${stats.cpu.usage.toFixed(1)}%`);

  console.log('\nMemory:');
  const memPercent = (stats.memory.used / stats.memory.total) * 100;
  console.log(progressBar(memPercent) + ` ${formatBytes(stats.memory.used)}/${formatBytes(stats.memory.total)}`);

  console.log('\nDisk:');
  const diskPercent = (stats.disk.used / stats.disk.total) * 100;
  console.log(progressBar(diskPercent) + ` ${formatBytes(stats.disk.used)}/${formatBytes(stats.disk.total)}`);
};

const progressBar = (percent: number, width = 20): string => {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `[${'='.repeat(filled)}${' '.repeat(empty)}]`;
};

const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)}${units[i]}`;
};
```

## Commands Reference

| Command | Arguments | Options | Description |
|---------|-----------|---------|-------------|
| `server list` | - | `--json` | List all servers |
| `server stats` | `[serverId]` | `--json` | Show CPU/memory/disk |
| `server info` | `[serverId]` | `--json` | Show system info |

## Usage Examples
```bash
# List all servers
dokploy server list

# Show main server stats with visual bars
dokploy server stats

# Show specific server stats as JSON
dokploy server stats srv123 --json

# Get detailed server info
dokploy server info srv123
```

## Output Example (stats)
```
CPU Usage:
[========            ] 42.3%

Memory:
[===============     ] 76.2% 12.2GB/16.0GB

Disk:
[==========          ] 51.8% 103.6GB/200.0GB
```

## Success Criteria
- [ ] `dokploy server list` shows all servers
- [ ] `dokploy server stats` shows visual progress bars
- [ ] `dokploy server stats --json` outputs raw JSON
- [ ] Optional serverId works for multi-server
- [ ] Byte formatting correct (KB/MB/GB)
