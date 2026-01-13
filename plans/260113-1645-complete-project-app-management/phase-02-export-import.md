# Phase 2: Export/Import Commands

**Date:** 2026-01-13
**Priority:** P2
**Status:** Pending (Depends on Phase 1 types)
**Estimated Lines:** ~220

---

## Context Links

- [Main Plan](./plan.md)
- [Phase 1](./phase-01-core-cli.md) - Types defined here
- [Brainstorm](../reports/brainstorm-2026-01-13-complete-project-app-management.md)
- Related: `src/commands/app.ts`, `src/commands/project.ts`

---

## Overview

Enable project and application portability through export/import functionality:
- **Project clone** - Use native `/project.duplicate` API for same-server cloning
- **Project export/import** - JSON format for cross-server migration
- **App export/import** - Single application portability

---

## Requirements

1. **Project Clone** - Duplicate project using Dokploy API
2. **Project Export** - Save project config as JSON file
3. **Project Import** - Create project from JSON file
4. **App Export** - Save app config (env, domains, settings) as JSON
5. **App Import** - Create app from JSON file

---

## Related Code Files

| File | Current Lines | Changes |
|------|---------------|---------|
| `src/commands/project.ts` | 156 | Add clone (~40), export (~50), import (~60) |
| `src/commands/app.ts` | ~360 (after P1) | Add export (~50), import (~70) |

---

## Implementation Steps

### 1. Project Clone Command (src/commands/project.ts)

Add after line 156:

```typescript
projectCommand
  .command('clone <projectId>')
  .description('Clone a project (same server)')
  .option('-n, --name <name>', 'Name for cloned project')
  .option('--all', 'Clone all services (default: applications only)')
  .action(async (projectId, options) => {
    // Get project info for display and environment ID
    const projects = await api.get<Project[]>('/project.all');
    const project = projects.find(p => p.projectId === projectId);

    if (!project) {
      error(`Project ${projectId} not found`);
      process.exit(1);
    }

    const defaultEnv = project.environments?.find(e => e.isDefault);
    if (!defaultEnv) {
      error('Project has no default environment');
      process.exit(1);
    }

    let name = options.name;
    if (!name) {
      name = await input({
        message: 'Name for cloned project:',
        default: `${project.name}-copy`,
        validate: v => v ? true : 'Required',
      });
    }

    // Build selected services (all apps by default, or all services with --all)
    const apps = defaultEnv.applications || [];
    const selectedServices = apps.map(app => ({
      id: app.applicationId,
      type: 'application' as const,
    }));

    if (selectedServices.length === 0) {
      error('No services to clone');
      process.exit(1);
    }

    const s = spinner(`Cloning project with ${selectedServices.length} service(s)...`).start();

    try {
      await api.post('/project.duplicate', {
        sourceEnvironmentId: defaultEnv.environmentId,
        name,
        selectedServices,
      });
      s.succeed('Project cloned');

      if (isJson()) {
        json({ success: true, sourceProjectId: projectId, newName: name });
      } else {
        success(`Project "${project.name}" cloned as "${name}"`);
      }
    } catch (err) {
      s.fail('Failed to clone project');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
```

### 2. Project Export Command (src/commands/project.ts)

Add after clone command:

```typescript
import { writeFile } from 'fs/promises';
import type { ProjectExport, ApplicationFull } from '../types/index.js';

projectCommand
  .command('export <projectId> [file]')
  .description('Export project configuration to JSON')
  .action(async (projectId, file) => {
    const outputFile = file || `project-${projectId}.json`;

    // Get project info
    const projects = await api.get<Project[]>('/project.all');
    const project = projects.find(p => p.projectId === projectId);

    if (!project) {
      error(`Project ${projectId} not found`);
      process.exit(1);
    }

    const s = spinner('Exporting project...').start();

    try {
      const apps = (project.environments || []).flatMap(e => e.applications || []);
      const exportData: ProjectExport = {
        version: '1.0',
        type: 'project',
        exportedAt: new Date().toISOString(),
        data: {
          name: project.name,
          description: project.description,
          applications: [],
        },
      };

      // Fetch full details for each app
      for (const app of apps) {
        const fullApp = await api.post<ApplicationFull>('/application.one', {
          applicationId: app.applicationId,
        });

        exportData.data.applications.push({
          name: fullApp.name,
          description: fullApp.description,
          buildType: fullApp.buildType,
          sourceType: fullApp.sourceType,
          env: fullApp.env || '',
          dockerfile: fullApp.dockerfile,
          dockerImage: fullApp.dockerImage,
          replicas: fullApp.replicas,
          domains: (fullApp.domains || []).map(d => ({
            host: d.host,
            path: d.path,
            port: d.port,
            https: d.https,
            certificateType: d.certificateType,
          })),
          mounts: (fullApp.mounts || []).map(m => ({
            type: m.type,
            hostPath: m.hostPath,
            mountPath: m.mountPath,
            content: m.content,
          })),
          ports: (fullApp.ports || []).map(p => ({
            publishedPort: p.publishedPort,
            targetPort: p.targetPort,
            protocol: p.protocol,
          })),
        });
      }

      await writeFile(outputFile, JSON.stringify(exportData, null, 2));
      s.succeed('Project exported');

      if (isJson()) {
        json({ success: true, file: outputFile, apps: apps.length });
      } else {
        success(`Project exported to ${outputFile}`);
        info(`${apps.length} application(s) included`);
      }
    } catch (err) {
      s.fail('Failed to export project');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
```

### 3. Project Import Command (src/commands/project.ts)

Add after export command:

```typescript
import { readFile } from 'fs/promises';

projectCommand
  .command('import <file>')
  .description('Import project from JSON file')
  .option('-n, --name <name>', 'Override project name')
  .option('--no-env', 'Skip environment variables')
  .option('--no-domains', 'Skip domain configuration')
  .action(async (file, options) => {
    // Read and parse export file
    let exportData: ProjectExport;
    try {
      const content = await readFile(file, 'utf-8');
      exportData = JSON.parse(content);
    } catch {
      error(`Cannot read file: ${file}`);
      process.exit(1);
    }

    // Validate format
    if (exportData.type !== 'project' || !exportData.version) {
      error('Invalid export file format');
      process.exit(1);
    }

    const projectName = options.name || exportData.data.name;
    const s = spinner(`Importing project "${projectName}"...`).start();

    try {
      // Create project
      const project = await api.post<Project>('/project.create', {
        name: projectName,
        description: exportData.data.description,
      });

      let created = 0;
      const failed: string[] = [];

      // Create each application
      for (const appData of exportData.data.applications) {
        try {
          // Create app
          const app = await api.post<Application>('/application.create', {
            projectId: project.projectId,
            name: appData.name,
            description: appData.description,
          });

          // Update app settings
          await api.post('/application.update', {
            applicationId: app.applicationId,
            buildType: appData.buildType,
            replicas: appData.replicas,
            dockerImage: appData.dockerImage,
            dockerfile: appData.dockerfile,
          });

          // Set environment (unless --no-env)
          if (!options.noEnv && appData.env) {
            await api.post('/application.saveEnvironment', {
              applicationId: app.applicationId,
              env: appData.env,
            });
          }

          // Create domains (unless --no-domains)
          if (!options.noDomains && appData.domains?.length) {
            for (const domain of appData.domains) {
              await api.post('/domain.create', {
                applicationId: app.applicationId,
                host: domain.host,
                path: domain.path,
                https: domain.https,
                certificateType: domain.certificateType,
              });
            }
          }

          created++;
        } catch (err) {
          failed.push(appData.name);
        }
      }

      s.succeed('Project imported');

      if (isJson()) {
        json({
          success: true,
          projectId: project.projectId,
          created,
          failed: failed.length,
        });
      } else {
        success(`Project "${projectName}" imported`);
        info(`${created} app(s) created`);
        if (failed.length) {
          warn(`${failed.length} app(s) failed: ${failed.join(', ')}`);
        }
      }
    } catch (err) {
      s.fail('Failed to import project');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
```

### 4. App Export Command (src/commands/app.ts)

Add after update command:

```typescript
import { writeFile } from 'fs/promises';
import type { AppExport, ApplicationFull } from '../types/index.js';

appCommand
  .command('export <appId> [file]')
  .description('Export application configuration to JSON')
  .action(async (appId, file) => {
    const outputFile = file || `app-${appId}.json`;
    const s = spinner('Exporting application...').start();

    try {
      const app = await api.post<ApplicationFull>('/application.one', {
        applicationId: appId,
      });

      const exportData: AppExport = {
        version: '1.0',
        type: 'application',
        exportedAt: new Date().toISOString(),
        data: {
          name: app.name,
          description: app.description,
          buildType: app.buildType,
          sourceType: app.sourceType,
          env: app.env || '',
          dockerfile: app.dockerfile,
          dockerImage: app.dockerImage,
          replicas: app.replicas,
          domains: (app.domains || []).map(d => ({
            host: d.host,
            path: d.path,
            port: d.port,
            https: d.https,
            certificateType: d.certificateType,
          })),
          mounts: (app.mounts || []).map(m => ({
            type: m.type,
            hostPath: m.hostPath,
            mountPath: m.mountPath,
            content: m.content,
          })),
          ports: (app.ports || []).map(p => ({
            publishedPort: p.publishedPort,
            targetPort: p.targetPort,
            protocol: p.protocol,
          })),
        },
      };

      await writeFile(outputFile, JSON.stringify(exportData, null, 2));
      s.succeed('Application exported');

      if (isJson()) {
        json({ success: true, file: outputFile, applicationId: appId });
      } else {
        success(`Application exported to ${outputFile}`);
        info(`Domains: ${exportData.data.domains.length}, Mounts: ${exportData.data.mounts.length}`);
      }
    } catch (err) {
      s.fail('Failed to export application');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
```

### 5. App Import Command (src/commands/app.ts)

Add after export command:

```typescript
import { readFile } from 'fs/promises';
import type { AppExport, Project } from '../types/index.js';

appCommand
  .command('import <file>')
  .description('Import application from JSON file')
  .option('-p, --project <projectId>', 'Target project ID')
  .option('-n, --name <name>', 'Override application name')
  .option('--no-env', 'Skip environment variables')
  .option('--no-domains', 'Skip domain configuration')
  .option('--deploy', 'Deploy after import')
  .action(async (file, options) => {
    // Read and parse
    let exportData: AppExport;
    try {
      const content = await readFile(file, 'utf-8');
      exportData = JSON.parse(content);
    } catch {
      error(`Cannot read file: ${file}`);
      process.exit(1);
    }

    if (exportData.type !== 'application' || !exportData.version) {
      error('Invalid export file format');
      process.exit(1);
    }

    // Get project
    let projectId = options.project;
    if (!projectId) {
      const projects = await api.get<Project[]>('/project.all');
      if (projects.length === 0) {
        error('No projects found. Create a project first.');
        process.exit(1);
      }
      projectId = await select({
        message: 'Select target project:',
        choices: projects.map(p => ({ name: p.name, value: p.projectId })),
      });
    }

    const appName = options.name || exportData.data.name;
    const s = spinner(`Importing "${appName}"...`).start();

    try {
      // Create app
      const app = await api.post<Application>('/application.create', {
        projectId,
        name: appName,
        description: exportData.data.description,
      });

      // Update settings
      await api.post('/application.update', {
        applicationId: app.applicationId,
        buildType: exportData.data.buildType,
        replicas: exportData.data.replicas,
        dockerImage: exportData.data.dockerImage,
        dockerfile: exportData.data.dockerfile,
      });

      // Environment
      if (!options.noEnv && exportData.data.env) {
        await api.post('/application.saveEnvironment', {
          applicationId: app.applicationId,
          env: exportData.data.env,
        });
      }

      // Domains
      if (!options.noDomains && exportData.data.domains?.length) {
        for (const domain of exportData.data.domains) {
          await api.post('/domain.create', {
            applicationId: app.applicationId,
            host: domain.host,
            path: domain.path,
            https: domain.https,
            certificateType: domain.certificateType,
          });
        }
      }

      // Optional deploy
      if (options.deploy) {
        await api.post('/application.deploy', { applicationId: app.applicationId });
      }

      s.succeed('Application imported');

      if (isJson()) {
        json({ success: true, applicationId: app.applicationId, deployed: !!options.deploy });
      } else {
        success(`Application "${appName}" imported`);
        keyValue({
          'ID': app.applicationId,
          'Domains': exportData.data.domains?.length || 0,
        });
        if (options.deploy) info('Deployment started');
      }
    } catch (err) {
      s.fail('Failed to import application');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
```

---

## Todo List

- [ ] Implement `project clone` command
- [ ] Implement `project export` command
- [ ] Implement `project import` command
- [ ] Implement `app export` command
- [ ] Implement `app import` command
- [ ] Add `warn` helper to output.ts if missing
- [ ] Test export -> import round-trip preserves config
- [ ] Test cross-server import (manually)

---

## Success Criteria

1. `dokploy project clone <id>` creates identical project
2. `dokploy project export <id>` produces valid JSON file
3. `dokploy project import file.json` recreates project with apps
4. `dokploy app export <id>` captures env, domains, settings
5. `dokploy app import file.json -p <projectId>` creates working app
6. Round-trip export->import preserves configuration

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Env vars contain secrets | High | Low | Document security warning |
| Domain conflicts on import | Medium | Medium | Show warning, continue other domains |
| Version format changes | Low | Medium | Version field + future migration logic |
| Large project slow export | Low | Low | Show progress per app |

---

## Notes

- Export does NOT include git credentials, SSH keys, or secrets
- Import creates new IDs - does not preserve original IDs
- `/project.duplicate` only works on same server; use export/import for cross-server
- Consider adding `--include-secrets` flag in future (with security warning)
