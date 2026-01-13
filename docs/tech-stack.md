# Tech Stack

dokploy-cli technology choices and rationale.

## Core Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Bun | 1.1+ | Runtime, package manager, test runner |
| TypeScript | 5.x | Type-safe development |
| Commander.js | 12+ | CLI framework |

## UI/UX Libraries

| Library | Purpose | Rationale |
|---------|---------|-----------|
| picocolors | Terminal colors | Smallest, fastest color lib (3x faster than chalk) |
| ora | Spinners | Battle-tested async operation feedback |
| inquirer | Interactive prompts | Rich prompt types, wide adoption |
| console-table-printer | Table output | Simple API for structured data display |

## Data & Config

| Library | Purpose | Rationale |
|---------|---------|-----------|
| conf | User config storage | Auto-handles ~/.config paths, atomic writes |
| Native fetch | HTTP client | Bun built-in, no external dependency needed |

## Testing

| Tool | Purpose | Rationale |
|------|---------|-----------|
| Bun test | Unit/integration tests | Built-in, fast, Jest-compatible API |

## Why Bun?

1. **All-in-one**: Runtime + package manager + bundler + test runner
2. **Speed**: Faster startup and execution than Node.js
3. **Native TypeScript**: No transpilation step needed
4. **Built-in fetch**: No axios/node-fetch dependency
5. **Jest-compatible**: Familiar testing patterns

## Bun Considerations

### What Works Well
- Direct TS execution (`bun run src/index.ts`)
- Fast dependency installation
- Native ESM support
- Built-in SQLite (if needed later)

### Watch Out For
- Some Node.js APIs not fully implemented (check compatibility)
- Fewer production deployments (newer ecosystem)
- Binary distribution requires `bun build --compile`

## Version Constraints

```json
{
  "engines": {
    "bun": ">=1.1.0"
  }
}
```

## Dependency Philosophy

- Prefer Bun built-ins over external packages
- Choose small, focused libraries over feature-heavy ones
- Avoid dependencies with native bindings (portability)
- Pin major versions, allow minor/patch updates
