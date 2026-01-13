# dokploy-cli: Product Overview & Requirements

## Product Vision

A fast, intuitive command-line interface for Dokploy that enables developers to manage self-hosted deployments without leaving the terminal. Seamlessly integrate deployment workflows into CI/CD pipelines and shell scripts.

## Target Users

- DevOps engineers managing Dokploy deployments
- Full-stack developers using Dokploy for project hosting
- CI/CD pipeline integrators needing programmatic access
- Teams preferring CLI-first deployment workflows

## Core Features

### 1. Authentication (auth)
- Interactive login with server URL and API token
- Session persistence in `~/.config/dokploy/config.json`
- Logout with credential clearing
- Connection verification
- Authentication status display

### 2. Project Management (project)
- List all projects
- Create projects with name and description
- Delete projects with confirmation
- View detailed project information

### 3. Application Management (app)
- List applications within a project
- Create applications (name, build type, source type)
- Deploy applications
- Delete applications
- View deployment status

### 4. Database Management (db)
- List databases in a project
- Create databases (postgres, mysql, mongo, redis, mariadb)
- Delete databases
- View database configuration

### 5. Domain Management (domain)
- List configured domains
- Create domain bindings (HTTPS, SSL certificates)
- Delete domains
- View domain settings

### 6. Environment Variables (env)
- List environment variables per application
- Set environment variables
- Delete environment variables

### 7. Server Management (server)
- View server statistics (CPU, memory, disk)
- Display server information
- Monitor resource usage

## Technical Requirements

### Architecture
- **CLI Framework**: Commander.js for argument parsing and command structure
- **API Client**: Dokploy REST API via native fetch
- **State Management**: conf library for local config storage
- **UI**: picocolors (colors), ora (spinners), inquirer (prompts)

### Code Quality
- TypeScript for type safety
- Comprehensive error handling with ApiError class
- Bun test framework for unit/integration tests
- ESM module format
- Strict tsconfig.json settings

### API Integration
- REST endpoints via `{serverUrl}/api/{endpoint}`
- Header-based authentication (`x-api-key`)
- JSON request/response bodies
- Proper HTTP status code handling

### Output Modes
- Human-readable terminal output (default)
- JSON output for scripting (`--json` flag)
- Quiet mode suppressing progress (`--quiet` flag)
- Spinner feedback for async operations

## Success Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| Command execution | <500ms avg | Fast feedback loop |
| Package size | <5MB | Quick installation |
| Test coverage | >80% | Reliability |
| Bun 1.1+ support | 100% | Compatibility |
| Error handling | 100% endpoint coverage | Stability |

## Non-Functional Requirements

- **Performance**: CLI startup <200ms, API calls <5s timeout
- **Security**: API token never logged, config file permissions 600
- **Compatibility**: Bun >=1.1.0, TypeScript >=5.0
- **Usability**: Clear error messages, consistent command patterns
- **Maintainability**: Modular command structure, shared utilities

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/project.all` | List projects |
| POST | `/project.one` | Get project details |
| POST | `/project.create` | Create project |
| POST | `/project.remove` | Delete project |
| GET | `/application.all` | List apps |
| POST | `/application.one` | Get app details |
| POST | `/application.create` | Create app |
| POST | `/application.remove` | Delete app |
| POST | `/application.deploy` | Deploy app |

## Version & Release

- **Current Version**: 0.1.0
- **License**: MIT
- **Min Bun Version**: 1.1.0

## Future Roadmap

1. Watch mode for deployment logs
2. Configuration file support (`.dokployrc`)
3. Shell completion scripts
4. Deployment history and rollback
5. Resource monitoring and alerts
