# Code Standards & Style Guide

## TypeScript Conventions

### Type Definitions
- Define all types in `src/types/index.ts`
- Use interfaces for object shapes (not type aliases)
- Mark optional properties explicitly with `?`
- Use const assertions for literal types

```typescript
export interface Project {
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
}
```

### Naming Conventions
- **Files**: kebab-case (`api.ts`, `auth.ts`)
- **Classes**: PascalCase (`ApiError`, `DokployConfig`)
- **Functions**: camelCase (`apiRequest`, `isConfigured`)
- **Constants**: UPPER_SNAKE_CASE for compile-time constants
- **Imports**: Absolute paths from root (`./src/lib/api.js`)

### Generic Types
- Use consistent type parameter names (`T` for generic data, `E` for error)
- Always specify generic bounds when narrowing

```typescript
export async function apiRequest<T>(endpoint: string): Promise<T>
```

## File Structure

```
src/
├── index.ts              # CLI bootstrap only
├── commands/             # Command modules (one per resource type)
│   └── *.ts             # Each exports Command instance
├── lib/                  # Shared utilities and helpers
│   ├── api.ts           # API communication
│   ├── config.ts        # State management
│   └── output.ts        # Terminal UI
├── types/
│   └── index.ts         # All type definitions
└── __tests__/           # Tests mirroring src/
```

### Command Module Pattern
Each command module exports a named `Command` instance:

```typescript
export const projectCommand = new Command('project')
  .description('...');

projectCommand.command('list').action(async () => {
  // Implementation
});
```

## Error Handling

### ApiError Class
Custom error for API failures:

```typescript
export class ApiError extends Error {
  constructor(message: string, statusCode?: number, response?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### Error Patterns
- Always catch and handle promise rejections
- Provide user-friendly error messages
- Log technical details only in debug mode
- Use process.exit(1) for fatal errors

```typescript
try {
  const data = await api.get<Project[]>('/project.all');
  // Process
} catch (err) {
  if (err instanceof ApiError) {
    error(err.message);  // User-friendly
  }
  process.exit(1);
}
```

## Testing Requirements

### Unit Tests
- Test API client methods (`api.ts`)
- Test config get/set operations
- Test output formatting functions
- Minimum 80% coverage

### Integration Tests
- Test command execution with mock API
- Test error handling paths
- Verify spinner and output behavior

### Test Organization
```
src/__tests__/
├── api.test.ts
├── config.test.ts
└── output.test.ts
```

### Running Tests
```bash
bun test                    # Run all tests
bun test --coverage        # With coverage report
```

## Code Review Checklist

- [ ] TypeScript strict mode passes
- [ ] No `any` types without justification
- [ ] Error messages are user-friendly
- [ ] Tests added for new functionality
- [ ] Command follows existing patterns
- [ ] No sensitive data logged
- [ ] API methods properly typed
- [ ] Configuration changes documented

## Performance Guidelines

- Keep CLI startup time <200ms
- Batch API calls where possible
- Don't block on network without spinner feedback
- Cache config reads (use getConfig() pattern)

## Security

- Never log or echo API tokens in full
- Mask tokens in output: `token.slice(0, 8) + '...'`
- Validate URLs before making requests
- Use HTTPS for production server URLs
- Config file permissions: 0600 (handled by conf library)
