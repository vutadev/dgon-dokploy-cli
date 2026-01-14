import { Command } from 'commander';
import { input, confirm } from '@inquirer/prompts';
import { readFile, writeFile } from 'fs/promises';
import { api, ApiError } from '../lib/api.js';
import { success, error, warn, table, keyValue, spinner, isJson, json, info } from '../lib/output.js';
import type { Project, Application, ApplicationFull, ProjectExport } from '../types/index.js';

export const projectCommand = new Command('project')
  .description('Manage projects');

projectCommand
  .command('list')
  .alias('ls')
  .description('List all projects')
  .action(async () => {
    const s = spinner('Fetching projects...').start();

    try {
      const projects = await api.get<Project[]>('/project.all');
      s.stop();

      table(projects, [
        { name: 'ID', key: 'projectId' },
        { name: 'Name', key: 'name' },
        { name: 'Description', key: 'description' },
        { name: 'Created', key: 'createdAt' },
      ]);
    } catch (err) {
      s.fail('Failed to fetch projects');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

projectCommand
  .command('create')
  .description('Create a new project')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <description>', 'Project description')
  .action(async (options) => {
    let name = options.name;
    let description = options.description;

    if (!name) {
      name = await input({
        message: 'Project name:',
        validate: (value) => value ? true : 'Name is required',
      });
    }

    if (!description) {
      description = await input({
        message: 'Description (optional):',
      });
    }

    const s = spinner('Creating project...').start();

    try {
      const project = await api.post<Project>('/project.create', {
        name,
        description: description || undefined,
      });
      s.succeed('Project created');

      if (isJson()) {
        json(project);
      } else {
        success(`Project "${name}" created`);
        keyValue({
          'ID': project.projectId,
          'Name': project.name,
        });
      }
    } catch (err) {
      s.fail('Failed to create project');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

projectCommand
  .command('delete <projectId>')
  .description('Delete a project')
  .option('-f, --force', 'Skip confirmation')
  .action(async (projectId, options) => {
    if (!options.force) {
      const confirmed = await confirm({
        message: `Delete project ${projectId}? This cannot be undone.`,
        default: false,
      });
      if (!confirmed) return;
    }

    const s = spinner('Deleting project...').start();

    try {
      await api.post('/project.remove', { projectId });
      s.succeed('Project deleted');

      if (isJson()) {
        json({ success: true, projectId });
      } else {
        success(`Project ${projectId} deleted`);
      }
    } catch (err) {
      s.fail('Failed to delete project');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

projectCommand
  .command('info <projectId>')
  .description('Show project details')
  .action(async (projectId) => {
    const s = spinner('Fetching project...').start();

    try {
      // Get all projects and find the one we want
      const projects = await api.get<Project[]>('/project.all');
      const project = projects.find(p => p.projectId === projectId);

      if (!project) {
        s.fail(`Project ${projectId} not found`);
        process.exit(1);
      }

      s.stop();

      if (isJson()) {
        json(project);
      } else {
        const appCount = (project.environments || []).flatMap(e => e.applications || []).length;
        keyValue({
          'ID': project.projectId,
          'Name': project.name,
          'Description': project.description || '-',
          'Applications': appCount.toString(),
          'Created': project.createdAt,
        });
      }
    } catch (err) {
      s.fail('Failed to fetch project');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

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

    // Build selected services (all apps by default)
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
        const fullApp = await api.getWithParams<ApplicationFull>('/application.one', {
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
        } catch {
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
