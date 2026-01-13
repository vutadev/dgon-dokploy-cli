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
- Update application settings (name, description, build type, replicas, resource limits)
- Start/stop applications
- View application details (basic and full)
- View deployment status and logs
- View environment variables, domains, mounts, and port mappings

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

### 8. Configuration Management (config)
- Manage multiple server configurations
- Add, remove, and switch between server aliases
- Export and import configuration
- Export application and project configurations

### 9. Backup Destination Management (destination)
- List S3-compatible backup destinations
- Add new backup destinations with credentials
- Test destination connectivity
- Remove backup destinations

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

## Phase 1 Core CLI Completion

### Newly Added (Phase 1)
- **Application Update Command**: Update application name, description, build type, replicas, resource limits
- **Application Info Enhancement**: Full details including environment variables, domains, deployments, mounts, and ports
- **Destination Command**: Full CRUD operations for S3-compatible backup storage
- **Extended Type System**: ApplicationFull, Mount, Port, Redirect, Security types for complete application configuration

### Extended Type System
All new types support advanced application configuration:
- **Mount**: Volume/bind mount and file configuration
- **Port**: Published port to container port mapping with protocol selection
- **Redirect**: HTTP redirect rules with regex pattern matching
- **Security**: Basic authentication credential management
- **Destination**: S3-compatible backup destination with credentials and region settings

## Version & Release

- **Current Version**: 0.2.0
- **Phase**: Phase 1 Core CLI completion
- **License**: MIT
- **Min Bun Version**: 1.1.0

## Future Roadmap

1. **Phase 2**: Export/Import functionality (project and application configuration)
2. **Phase 3**: TUI enhancements (rich interface for app management)
3. Watch mode for deployment logs
4. Automatic shell completion scripts
5. Deployment history and rollback capabilities
6. Resource monitoring and performance alerts
7. Log streaming and real-time monitoring
