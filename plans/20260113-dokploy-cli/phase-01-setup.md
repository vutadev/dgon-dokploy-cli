# Phase 1: Project Setup

## Overview
Initialize TypeScript Node.js CLI project with essential dependencies and folder structure.

## Requirements
- Node.js 18+ support
- TypeScript 5.x with strict mode
- ESM modules
- npm package configuration for global install

## Dependencies

**Production:**
- `commander` - CLI framework
- `axios` - HTTP client
- `chalk` - Terminal colors
- `ora` - Spinners
- `cli-table3` - Table output
- `conf` - Config storage

**Development:**
- `typescript`, `@types/node`
- `tsup` - Build tool
- `vitest` - Testing
- `eslint`, `prettier`

## Implementation Steps

### 1. Initialize Project
```bash
mkdir dokploy-cli && cd dokploy-cli
npm init -y
```

### 2. Configure package.json
```json
{
  "name": "dokploy-cli",
  "version": "0.1.0",
  "type": "module",
  "bin": { "dokploy": "./dist/index.js" },
  "files": ["dist"],
  "engines": { "node": ">=18" }
}
```

### 3. TypeScript Config (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

### 4. Create Folder Structure
```
src/
├── index.ts
├── commands/
│   ├── auth.ts
│   ├── project.ts
│   ├── app.ts
│   ├── db.ts
│   ├── domain.ts
│   ├── env.ts
│   └── server.ts
├── lib/
│   ├── api.ts
│   ├── config.ts
│   ├── output.ts
│   └── errors.ts
└── types/
    └── index.ts
```

### 5. Entry Point (src/index.ts)
```typescript
#!/usr/bin/env node
import { program } from 'commander';
import { authCommand } from './commands/auth.js';

program
  .name('dokploy')
  .version('0.1.0')
  .option('--json', 'Output as JSON')
  .option('-q, --quiet', 'Suppress output')
  .option('--config <path>', 'Config file path')
  .option('--server <url>', 'Server URL override');

program.addCommand(authCommand);
program.parse();
```

### 6. Build Config (tsup.config.ts)
```typescript
export default {
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  shims: true
};
```

## Success Criteria
- [ ] `npm run build` compiles without errors
- [ ] `dokploy --version` outputs version
- [ ] `dokploy --help` shows global options
- [ ] Folder structure matches spec
- [ ] TypeScript strict mode passing
