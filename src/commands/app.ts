import { Command } from 'commander';
import { input, select, confirm } from '@inquirer/prompts';
import { api, ApiError } from '../lib/api.js';
import { success, error, table, keyValue, spinner, isJson, json, info } from '../lib/output.js';
import type { Application, Project, Deployment } from '../types/index.js';

export const appCommand = new Command('app')
  .description('Manage applications');

appCommand
  .command('list')
  .alias('ls')
  .description('List applications')
  .option('-p, --project <projectId>', 'Filter by project')
  .action(async (options) => {
    const s = spinner('Fetching applications...').start();

    try {
      // Get all projects (includes environments with apps)
      const projects = await api.get<Project[]>('/project.all');

      let apps: Application[];
      if (options.project) {
        // Filter by specific project
        const project = projects.find(p => p.projectId === options.project);
        if (!project) {
          s.fail(`Project ${options.project} not found`);
          process.exit(1);
        }
        apps = (project.environments || []).flatMap(env => env.applications || []);
      } else {
        // All apps from all projects
        apps = projects.flatMap(p =>
          (p.environments || []).flatMap(env => env.applications || [])
        );
      }

      s.stop();

      table(apps, [
        { name: 'ID', key: 'applicationId' },
        { name: 'Name', key: 'name' },
        { name: 'Status', key: 'applicationStatus' },
        { name: 'Build', key: 'buildType' },
        { name: 'Source', key: 'sourceType' },
      ]);
    } catch (err) {
      s.fail('Failed to fetch applications');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

appCommand
  .command('create')
  .description('Create a new application')
  .option('-p, --project <projectId>', 'Project ID')
  .option('-n, --name <name>', 'Application name')
  .action(async (options) => {
    let projectId = options.project;
    let name = options.name;

    // Get project list if not specified
    if (!projectId) {
      const projects = await api.get<Project[]>('/project.all');
      if (projects.length === 0) {
        error('No projects found. Create a project first with `dokploy project create`');
        process.exit(1);
      }

      projectId = await select({
        message: 'Select project:',
        choices: projects.map(p => ({ name: p.name, value: p.projectId })),
      });
    }

    if (!name) {
      name = await input({
        message: 'Application name:',
        validate: (value) => value ? true : 'Name is required',
      });
    }

    const s = spinner('Creating application...').start();

    try {
      const app = await api.post<Application>('/application.create', {
        projectId,
        name,
      });
      s.succeed('Application created');

      if (isJson()) {
        json(app);
      } else {
        success(`Application "${name}" created`);
        keyValue({
          'ID': app.applicationId,
          'Name': app.name,
          'Status': app.applicationStatus,
        });
      }
    } catch (err) {
      s.fail('Failed to create application');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

appCommand
  .command('deploy <appId>')
  .description('Deploy an application')
  .action(async (appId) => {
    const s = spinner('Starting deployment...').start();

    try {
      await api.post('/application.deploy', { applicationId: appId });
      s.succeed('Deployment started');

      if (isJson()) {
        json({ success: true, applicationId: appId });
      } else {
        success(`Deployment started for ${appId}`);
        info('Use `dokploy app logs <appId>` to view deployment logs');
      }
    } catch (err) {
      s.fail('Failed to start deployment');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

appCommand
  .command('logs <appId>')
  .description('View application logs')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <number>', 'Number of lines', '100')
  .action(async (appId, _options) => {
    try {
      // Get latest deployment
      const deployments = await api.post<Deployment[]>('/deployment.all', {
        applicationId: appId,
      });

      if (deployments.length === 0) {
        error('No deployments found');
        process.exit(1);
      }

      const latest = deployments[0];

      if (isJson()) {
        json({ deploymentId: latest.deploymentId, status: latest.status });
      } else {
        info(`Latest deployment: ${latest.deploymentId} (${latest.status})`);
        // Note: Full log streaming would require SSE/WebSocket implementation
        info('Log streaming not yet implemented. Check Dokploy dashboard for full logs.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

appCommand
  .command('stop <appId>')
  .description('Stop an application')
  .action(async (appId) => {
    const s = spinner('Stopping application...').start();

    try {
      await api.post('/application.stop', { applicationId: appId });
      s.succeed('Application stopped');

      if (isJson()) {
        json({ success: true, applicationId: appId });
      }
    } catch (err) {
      s.fail('Failed to stop application');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

appCommand
  .command('start <appId>')
  .description('Start an application')
  .action(async (appId) => {
    const s = spinner('Starting application...').start();

    try {
      await api.post('/application.start', { applicationId: appId });
      s.succeed('Application started');

      if (isJson()) {
        json({ success: true, applicationId: appId });
      }
    } catch (err) {
      s.fail('Failed to start application');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

appCommand
  .command('delete <appId>')
  .description('Delete an application')
  .option('-f, --force', 'Skip confirmation')
  .action(async (appId, options) => {
    if (!options.force) {
      const confirmed = await confirm({
        message: `Delete application ${appId}? This cannot be undone.`,
        default: false,
      });
      if (!confirmed) return;
    }

    const s = spinner('Deleting application...').start();

    try {
      await api.delete('/application.delete', { applicationId: appId });
      s.succeed('Application deleted');

      if (isJson()) {
        json({ success: true, applicationId: appId });
      }
    } catch (err) {
      s.fail('Failed to delete application');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

appCommand
  .command('info <appId>')
  .description('Show application details')
  .action(async (appId) => {
    const s = spinner('Fetching application...').start();

    try {
      const app = await api.post<Application>('/application.one', {
        applicationId: appId,
      });
      s.stop();

      if (isJson()) {
        json(app);
      } else {
        keyValue({
          'ID': app.applicationId,
          'Name': app.name,
          'App Name': app.appName,
          'Status': app.applicationStatus,
          'Build Type': app.buildType,
          'Source': app.sourceType,
          'Created': app.createdAt,
        });
      }
    } catch (err) {
      s.fail('Failed to fetch application');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
