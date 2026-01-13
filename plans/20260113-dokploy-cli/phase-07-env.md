# Phase 7: Environment Variables

## Overview
Implement env var management: pull (download) and push (upload) for apps and databases.

## Requirements
- Pull env vars to local .env file
- Push local .env to remote app/database
- Support both apps and databases
- Handle .env file format

## API Endpoints
- `GET /api/application.one` - Get app with env (includes `env` field)
- `POST /api/application.saveEnvironment` - Save app env
- `GET /api/{dbType}.one` - Get database with env
- `POST /api/{dbType}.saveEnvironment` - Save database env

## Implementation Steps

### 1. Env File Parser (src/lib/env.ts)
```typescript
import { readFileSync, writeFileSync } from 'fs';

export const parseEnvFile = (path: string): string => {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    throw new Error(`Cannot read file: ${path}`);
  }
};

export const writeEnvFile = (path: string, content: string): void => {
  writeFileSync(path, content, 'utf-8');
};

// Convert KEY=VALUE format to/from API format
export const formatEnvForDisplay = (env: string): string => {
  return env.trim();
};
```

### 2. Env Commands (src/commands/env.ts)
```typescript
import { Command } from 'commander';
import { parseEnvFile, writeEnvFile } from '../lib/env.js';

export const envCommand = new Command('env')
  .description('Manage environment variables');

envCommand
  .command('pull')
  .description('Download env vars to local file')
  .requiredOption('-a, --app <id>', 'Application ID')
  .option('-o, --output <path>', 'Output file', '.env')
  .action(async (opts) => {
    const api = createApiClient();
    const { data } = await api.get('/application.one', {
      params: { applicationId: opts.app }
    });

    if (!data.env) {
      warn('No environment variables found');
      return;
    }

    writeEnvFile(opts.output, data.env);
    success(`Saved to ${opts.output}`);
  });

envCommand
  .command('push')
  .description('Upload local env vars to remote')
  .requiredOption('-a, --app <id>', 'Application ID')
  .option('-i, --input <path>', 'Input file', '.env')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (opts) => {
    const env = parseEnvFile(opts.input);

    if (!opts.yes) {
      console.log('Environment variables to push:');
      console.log(env.split('\n').slice(0, 5).join('\n'));
      if (env.split('\n').length > 5) console.log('...');

      const confirmed = await confirm('Push these variables?');
      if (!confirmed) return;
    }

    const api = createApiClient();
    await api.post('/application.saveEnvironment', {
      applicationId: opts.app,
      env
    });
    success('Environment variables pushed');
  });

// Database env support
envCommand
  .command('pull-db')
  .description('Download database env vars')
  .requiredOption('-d, --db <id>', 'Database ID')
  .requiredOption('-t, --type <type>', 'Database type')
  .option('-o, --output <path>', 'Output file', '.env')
  .action(async (opts) => {
    const apiType = DB_API_MAP[opts.type as DbType];
    const api = createApiClient();
    const { data } = await api.get(`/${apiType}.one`, {
      params: { [`${apiType}Id`]: opts.db }
    });
    writeEnvFile(opts.output, data.env || '');
  });
```

## Commands Reference

| Command | Arguments | Options | Description |
|---------|-----------|---------|-------------|
| `env pull` | - | `-a, --app`, `-o, --output` | Download app env |
| `env push` | - | `-a, --app`, `-i, --input`, `-y, --yes` | Upload app env |
| `env pull-db` | - | `-d, --db`, `-t, --type`, `-o, --output` | Download DB env |

## Usage Examples
```bash
# Pull app environment to local file
dokploy env pull -a app123 -o .env.production

# Push local .env to app
dokploy env push -a app123 -i .env.local

# Pull database environment
dokploy env pull-db -d pg123 -t postgres -o .env.db
```

## Security Considerations
- Warn if pushing .env containing common secret patterns
- Show preview before push (unless --yes)
- Support .gitignore check warning

## Success Criteria
- [ ] `dokploy env pull` downloads to .env file
- [ ] `dokploy env push` uploads from .env file
- [ ] Custom input/output paths work
- [ ] Confirmation prompt shows before push
- [ ] Database env pull works for all types
