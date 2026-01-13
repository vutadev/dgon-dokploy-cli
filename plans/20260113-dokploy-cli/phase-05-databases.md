# Phase 5: Database Commands

## Overview
Implement database management for 5 types: postgres, mysql, mongo, redis, mariadb.

## Requirements
- Unified command structure: `db <type> <action>`
- Support all 5 database types
- Actions: list, create, deploy, stop, delete
- Database-specific options (ports, versions)

## API Endpoints (per type)
- `POST /api/{type}.create` - Create database
- `DELETE /api/{type}.remove` - Delete database
- `POST /api/{type}.deploy` - Deploy database
- `POST /api/{type}.stop` - Stop database
- `GET /api/{type}.one` - Get database info

Types: `postgresql`, `mysql`, `mongodb`, `redis`, `mariadb`

## Implementation Steps

### 1. Database Types (src/types/db.ts)
```typescript
export type DbType = 'postgres' | 'mysql' | 'mongo' | 'redis' | 'mariadb';

export const DB_API_MAP: Record<DbType, string> = {
  postgres: 'postgresql',
  mysql: 'mysql',
  mongo: 'mongodb',
  redis: 'redis',
  mariadb: 'mariadb'
};

export interface Database {
  databaseId: string;
  name: string;
  type: DbType;
  projectId: string;
  databaseStatus: string;
  createdAt: string;
}
```

### 2. DB Command Factory (src/commands/db.ts)
```typescript
import { Command } from 'commander';
import { DB_API_MAP, DbType } from '../types/db.js';

const createDbSubcommand = (type: DbType) => {
  const apiType = DB_API_MAP[type];
  const cmd = new Command(type).description(`Manage ${type} databases`);

  cmd.command('list')
    .option('-p, --project <id>', 'Filter by project')
    .action(async () => { /* list databases of type */ });

  cmd.command('create')
    .requiredOption('-p, --project <id>', 'Project ID')
    .requiredOption('-n, --name <name>', 'Database name')
    .option('--version <ver>', 'Database version')
    .action(async (opts) => {
      const api = createApiClient();
      await api.post(`/${apiType}.create`, {
        projectId: opts.project,
        name: opts.name,
        databaseVersion: opts.version
      });
    });

  cmd.command('deploy')
    .argument('<dbId>', 'Database ID')
    .action(async (dbId) => {
      await api.post(`/${apiType}.deploy`, { [`${apiType}Id`]: dbId });
    });

  cmd.command('stop')
    .argument('<dbId>', 'Database ID')
    .action(async (dbId) => {
      await api.post(`/${apiType}.stop`, { [`${apiType}Id`]: dbId });
    });

  cmd.command('delete')
    .argument('<dbId>', 'Database ID')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (dbId) => {
      await api.post(`/${apiType}.remove`, { [`${apiType}Id`]: dbId });
    });

  return cmd;
};

export const dbCommand = new Command('db')
  .description('Manage databases');

// Register all database types
(['postgres', 'mysql', 'mongo', 'redis', 'mariadb'] as DbType[])
  .forEach(type => dbCommand.addCommand(createDbSubcommand(type)));
```

## Commands Reference

| Command | Arguments | Options | Description |
|---------|-----------|---------|-------------|
| `db <type> list` | - | `-p, --project` | List databases |
| `db <type> create` | - | `-p, --project`, `-n, --name`, `--version` | Create DB |
| `db <type> deploy` | `<dbId>` | - | Deploy DB |
| `db <type> stop` | `<dbId>` | - | Stop DB |
| `db <type> delete` | `<dbId>` | `-y, --yes` | Delete DB |

Types: `postgres`, `mysql`, `mongo`, `redis`, `mariadb`

## Usage Examples
```bash
dokploy db postgres create -p proj123 -n mydb --version 15
dokploy db mongo deploy mongo123
dokploy db redis stop redis456
dokploy db mysql delete mysql789 -y
```

## Success Criteria
- [ ] All 5 database types have create/deploy/stop/delete
- [ ] `dokploy db postgres list` shows postgres databases
- [ ] Version option works for applicable types
- [ ] Consistent error handling across all types
