# Dokploy CLI Architecture Plan

## Overview
TypeScript CLI for Dokploy API (40+ routers) with Node.js. Extends existing `@dokploy/cli` patterns.

## Command Structure

```
dokploy
├── auth (login|logout|whoami|verify|list|use|remove)
├── config (export|import|show)
├── project (list|create|delete|info)
├── app (list|create|deploy|logs|stop|start|delete|info)
├── db <type> (list|create|deploy|stop|delete)
│   └── types: postgres|mysql|mongo|redis|mariadb
├── domain (list|add|remove)
├── env (pull|push)
└── server (list|stats|info)
```

## Global Options
- `--json` - JSON output format
- `--quiet` / `-q` - Suppress spinners/progress
- `--config <path>` - Custom config file path
- `--server <url>` - Override server URL
- `--alias <name>` / `-a` - Use specific server alias (default: 'default')
- `--help` / `-h` - Show help

## Multi-Server Support (v0.2.0)
- Store multiple server configs with aliases
- Default alias: 'default'
- Switch between servers: `dokploy auth use <alias>`
- List servers: `dokploy auth list`
- Export/import configs: `dokploy config export/import`
- See [phase-02-auth.md](./phase-02-auth.md) for detailed config & usage

## Tech Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **CLI Framework**: Commander.js
- **HTTP Client**: Axios/Fetch
- **Output**: chalk, ora (spinners), cli-table3
- **Config**: ~/.dokploy/config.json

## Project Structure
```
src/
├── index.ts           # Entry point
├── commands/          # Command modules
├── lib/               # Core utilities
│   ├── api.ts         # API client
│   ├── config.ts      # Config management
│   └── output.ts      # Output formatting
└── types/             # TypeScript types
```

## Phases

| Phase | File | Description |
|-------|------|-------------|
| 1 | [phase-01-setup.md](./phase-01-setup.md) | Project setup, deps, structure |
| 2 | [phase-02-auth.md](./phase-02-auth.md) | Authentication module |
| 3 | [phase-03-projects.md](./phase-03-projects.md) | Project commands |
| 4 | [phase-04-apps.md](./phase-04-apps.md) | Application commands |
| 5 | [phase-05-databases.md](./phase-05-databases.md) | Database commands |
| 6 | [phase-06-domains.md](./phase-06-domains.md) | Domain commands |
| 7 | [phase-07-env.md](./phase-07-env.md) | Environment variables |
| 8 | [phase-08-server.md](./phase-08-server.md) | Server commands |

## API Integration
- Base URL: `{server}/api`
- Auth Header: `x-api-key: {token}`
- Routers: admin, application, project, domain, mariadb, mongodb, mysql, postgresql, redis, server, deployment, compose, docker

## Estimated Timeline
- Phase 1-2: 2 days (foundation)
- Phase 3-5: 3 days (core features)
- Phase 6-8: 2 days (extended features)
- **Total**: ~7 days

## Success Criteria
- All commands functional with --help
- JSON output mode working
- Config persistence across sessions
- Error handling with clear messages
