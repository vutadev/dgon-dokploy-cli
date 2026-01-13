# Phase 6: Domain Commands

## Overview
Implement domain management: list, add, remove for applications.

## Requirements
- List domains for an app
- Add custom domains with SSL options
- Remove domains
- Support certificate configuration

## API Endpoints
- `GET /api/domain.byApplicationId` - List domains for app
- `POST /api/domain.create` - Add domain
- `DELETE /api/domain.delete` - Remove domain
- `POST /api/domain.generateCertificate` - Generate SSL cert

## Implementation Steps

### 1. Domain Types (src/types/domain.ts)
```typescript
export interface Domain {
  domainId: string;
  host: string;
  path?: string;
  port?: number;
  https: boolean;
  certificateType: 'none' | 'letsencrypt' | 'custom';
  applicationId: string;
  createdAt: string;
}
```

### 2. Domain Commands (src/commands/domain.ts)
```typescript
import { Command } from 'commander';

export const domainCommand = new Command('domain')
  .description('Manage domains');

domainCommand
  .command('list')
  .description('List domains for application')
  .requiredOption('-a, --app <id>', 'Application ID')
  .action(async function(opts) {
    const api = createApiClient();
    const { data } = await api.get('/domain.byApplicationId', {
      params: { applicationId: opts.app }
    });

    if (this.optsWithGlobals().json) {
      outputJson(data);
    } else {
      outputTable(data, ['domainId', 'host', 'https', 'certificateType']);
    }
  });

domainCommand
  .command('add')
  .description('Add domain to application')
  .requiredOption('-a, --app <id>', 'Application ID')
  .requiredOption('-h, --host <host>', 'Domain hostname')
  .option('--path <path>', 'URL path', '/')
  .option('--port <port>', 'Target port')
  .option('--https', 'Enable HTTPS', false)
  .option('--cert <type>', 'Certificate type (none|letsencrypt)', 'none')
  .action(async (opts) => {
    const api = createApiClient();
    await api.post('/domain.create', {
      applicationId: opts.app,
      host: opts.host,
      path: opts.path,
      port: opts.port ? parseInt(opts.port) : undefined,
      https: opts.https,
      certificateType: opts.cert
    });
    success(`Domain ${opts.host} added`);
  });

domainCommand
  .command('remove')
  .description('Remove domain')
  .argument('<domainId>', 'Domain ID')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (domainId, opts) => {
    if (!opts.yes) {
      const confirmed = await confirm('Delete domain?');
      if (!confirmed) return;
    }
    const api = createApiClient();
    await api.post('/domain.delete', { domainId });
    success('Domain removed');
  });

domainCommand
  .command('ssl')
  .description('Generate SSL certificate')
  .argument('<domainId>', 'Domain ID')
  .action(async (domainId) => {
    const api = createApiClient();
    await api.post('/domain.generateCertificate', { domainId });
    success('SSL certificate generated');
  });
```

## Commands Reference

| Command | Arguments | Options | Description |
|---------|-----------|---------|-------------|
| `domain list` | - | `-a, --app` | List app domains |
| `domain add` | - | `-a, --app`, `-h, --host`, `--path`, `--port`, `--https`, `--cert` | Add domain |
| `domain remove` | `<domainId>` | `-y, --yes` | Remove domain |
| `domain ssl` | `<domainId>` | - | Generate SSL cert |

## Usage Examples
```bash
dokploy domain list -a app123
dokploy domain add -a app123 -h myapp.example.com --https --cert letsencrypt
dokploy domain remove dom456 -y
dokploy domain ssl dom456
```

## Success Criteria
- [ ] `dokploy domain list -a <id>` shows app domains
- [ ] `dokploy domain add` creates domain with options
- [ ] HTTPS and certificate options work
- [ ] Remove command has confirmation prompt
- [ ] SSL generation triggers correctly
