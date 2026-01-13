# Phase 4: Application Commands

## Overview
Implement app lifecycle: list, create, deploy, logs, stop, start, delete, info.

## Requirements
- CRUD operations for applications
- Deployment triggering
- Real-time log streaming
- Start/stop controls
- App info with deployment status

## API Endpoints
- `GET /api/application.all` - List apps (by project)
- `POST /api/application.create` - Create app
- `DELETE /api/application.remove` - Delete app
- `GET /api/application.one` - Get app details
- `POST /api/application.deploy` - Trigger deployment
- `POST /api/application.start` - Start app
- `POST /api/application.stop` - Stop app
- `GET /api/application.logs` - Get logs (SSE stream)

## Implementation Steps

### 1. App Types (src/types/app.ts)
```typescript
export interface Application {
  applicationId: string;
  name: string;
  appName: string;
  projectId: string;
  applicationStatus: 'idle' | 'running' | 'done' | 'error';
  sourceType: 'git' | 'github' | 'docker' | 'drop';
  createdAt: string;
}
```

### 2. App Commands (src/commands/app.ts)
```typescript
import { Command } from 'commander';

export const appCommand = new Command('app')
  .description('Manage applications');

appCommand
  .command('list')
  .description('List applications')
  .option('-p, --project <id>', 'Filter by project')
  .action(async function(opts) {
    // GET /api/application.all or filter by project
  });

appCommand
  .command('create')
  .description('Create application')
  .requiredOption('-p, --project <id>', 'Project ID')
  .requiredOption('-n, --name <name>', 'App name')
  .option('-t, --type <type>', 'Source type', 'docker')
  .action(async (opts) => {
    // POST /api/application.create
  });

appCommand
  .command('deploy')
  .description('Deploy application')
  .argument('<appId>', 'Application ID')
  .action(async (appId) => {
    // POST /api/application.deploy
  });

appCommand
  .command('logs')
  .description('Stream application logs')
  .argument('<appId>', 'Application ID')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <n>', 'Number of lines', '100')
  .action(async (appId, opts) => {
    // SSE stream or GET logs
  });

appCommand
  .command('start')
  .argument('<appId>', 'Application ID')
  .action(async (appId) => { /* POST /api/application.start */ });

appCommand
  .command('stop')
  .argument('<appId>', 'Application ID')
  .action(async (appId) => { /* POST /api/application.stop */ });

appCommand
  .command('delete')
  .argument('<appId>', 'Application ID')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (appId, opts) => { /* DELETE /api/application.remove */ });

appCommand
  .command('info')
  .argument('<appId>', 'Application ID')
  .action(async (appId) => { /* GET /api/application.one */ });
```

### 3. Log Streaming Helper
```typescript
import EventSource from 'eventsource';

export const streamLogs = (url: string, token: string) => {
  const es = new EventSource(url, {
    headers: { 'x-api-key': token }
  });
  es.onmessage = (e) => console.log(e.data);
  es.onerror = () => es.close();
};
```

## Commands Reference

| Command | Arguments | Options | Description |
|---------|-----------|---------|-------------|
| `app list` | - | `-p, --project` | List apps |
| `app create` | - | `-p, --project`, `-n, --name`, `-t, --type` | Create app |
| `app deploy` | `<appId>` | - | Deploy app |
| `app logs` | `<appId>` | `-f, --follow`, `-n, --lines` | View logs |
| `app start` | `<appId>` | - | Start app |
| `app stop` | `<appId>` | - | Stop app |
| `app delete` | `<appId>` | `-y, --yes` | Delete app |
| `app info` | `<appId>` | `--json` | Show details |

## Success Criteria
- [ ] `dokploy app list` shows all apps
- [ ] `dokploy app create` creates with required options
- [ ] `dokploy app deploy <id>` triggers deployment
- [ ] `dokploy app logs <id> -f` streams logs
- [ ] Start/stop commands work correctly
