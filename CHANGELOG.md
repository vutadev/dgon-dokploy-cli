# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2026-01-16

### Fixed
- Changed shebang from `bun` to `node` for npx compatibility
- Fixed hardcoded version in CLI

### Changed
- Moved README.md to project root

## [0.2.1] - 2026-01-16

### Added
- Centralized path management for import/export operations (`~/.dokploy/`)
- TUI path input validation component with file system checks
- Multi-select list component for bulk operations
- Export functionality for apps and databases
- App detail panel with import/confirm dialogs
- Compose command integration

### Changed
- Refactored TUI export/import components layout integration

### Documentation
- Added TUI design guidelines for consistent component styling
- Added project import/export implementation plan

## [0.2.0] - 2026-01-13

### Added
- Complete TUI application with auth, app management, and keyboard controls
- App update command with enhanced info display
- Destination management commands
- Auth test command for headless API verification
- TUI dependencies (ink, chalk, ansi utilities)

### Fixed
- Data structure corrections for app/project commands in nested environments

## [0.1.0] - 2026-01-10

### Added
- Initial release with core CLI functionality
- Authentication: login, logout, whoami, verify
- Project management: list, create, delete, info
- Application management: list, create, deploy, logs, stop, start, delete, info
- Database management: Postgres, MySQL, MongoDB, Redis, MariaDB operations
- Domain management: list, add, remove, ssl
- Environment variables: pull, push, show
- Server management: list, stats, info

[Unreleased]: https://github.com/vutadev/dgon-dokploy-cli/compare/v0.2.2...HEAD
[0.2.2]: https://github.com/vutadev/dgon-dokploy-cli/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/vutadev/dgon-dokploy-cli/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/vutadev/dgon-dokploy-cli/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vutadev/dgon-dokploy-cli/releases/tag/v0.1.0
