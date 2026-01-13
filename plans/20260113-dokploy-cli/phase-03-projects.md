# Phase 3: Project Commands

## Overview
Implement project management: list, create, delete, info. Projects are containers for apps and databases.

## Requirements
- List all projects with summary
- Create new projects
- Delete projects (with confirmation)
- Show project details with apps/databases

## API Endpoints
- `GET /api/project.all` - List all projects
- `POST /api/project.create` - Create project
- `DELETE /api/project.remove` - Delete project
- `GET /api/project.one` - Get project by ID

## Implementation Steps

### 1. Project Types (src/types/project.ts)
```typescript
export interface Project {
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  applications: Application[];
  databases: Database[];
}
```

### 2. Project Commands (src/commands/project.ts)
```typescript
import { Command } from 'commander';
import { createApiClient } from '../lib/api.js';
import { outputTable, outputJson } from '../lib/output.js';

export const projectCommand = new Command('project')
  .description('Manage projects');

projectCommand
  .command('list')
  .description('List all projects')
  .action(async function() {
    const api = createApiClient();
    const { data } = await api.get('/project.all');

    if (this.optsWithGlobals().json) {
      outputJson(data);
    } else {
      outputTable(data, ['projectId', 'name', 'createdAt']);
    }
  });

projectCommand
  .command('create')
  .description('Create a new project')
  .requiredOption('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Description')
  .action(async (opts) => {
    const api = createApiClient();
    await api.post('/project.create', {
      name: opts.name,
      description: opts.description
    });
  });

projectCommand
  .command('delete')
  .description('Delete a project')
  .argument('<projectId>', 'Project ID')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (projectId, opts) => {
    // Confirm then delete
  });

projectCommand
  .command('info')
  .description('Show project details')
  .argument('<projectId>', 'Project ID')
  .action(async (projectId) => {
    const api = createApiClient();
    const { data } = await api.get('/project.one', { params: { projectId } });
    // Display project with apps/databases
  });
```

### 3. Table Output Helper
```typescript
import Table from 'cli-table3';

export const outputTable = (data: any[], columns: string[]) => {
  const table = new Table({ head: columns });
  data.forEach(row => {
    table.push(columns.map(col => row[col] ?? '-'));
  });
  console.log(table.toString());
};
```

## Commands Reference

| Command | Arguments | Options | Description |
|---------|-----------|---------|-------------|
| `project list` | - | `--json` | List all projects |
| `project create` | - | `-n, --name`, `-d, --description` | Create project |
| `project delete` | `<projectId>` | `-y, --yes` | Delete project |
| `project info` | `<projectId>` | `--json` | Show details |

## Success Criteria
- [ ] `dokploy project list` shows table of projects
- [ ] `dokploy project list --json` outputs JSON
- [ ] `dokploy project create -n "test"` creates project
- [ ] `dokploy project info <id>` shows apps/databases
- [ ] `dokploy project delete <id>` prompts confirmation
