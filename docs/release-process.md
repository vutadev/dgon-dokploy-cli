# Release Process

## Prerequisites

1. **NPM_TOKEN**: Add npm access token as GitHub repository secret
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add secret: `NPM_TOKEN` with your npm token (requires publish permission)

2. **npm login**: Ensure you're logged in locally: `npm login`

## Release Steps

### 1. Update Version and Changelog

```bash
# Update version in package.json (choose one)
bun version patch   # 0.2.1 → 0.2.2
bun version minor   # 0.2.1 → 0.3.0
bun version major   # 0.2.1 → 1.0.0

# Update CHANGELOG.md
# - Move [Unreleased] items to new version section
# - Add release date
```

### 2. Commit Changes

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): bump version to X.Y.Z"
```

### 3. Create and Push Tag

```bash
git tag vX.Y.Z
git push origin main --tags
```

### 4. Automated Release

GitHub Actions will automatically:
- Build with Bun
- Run tests
- Publish to npm
- Create GitHub release with changelog

## Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): New features, backward compatible
- **PATCH** (0.0.x): Bug fixes, backward compatible

## Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/):
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
