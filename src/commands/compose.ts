import { Command } from 'commander';
import { input, select, confirm } from '@inquirer/prompts';
import { api, ApiError } from '../lib/api.js';
import { success, error, table, keyValue, spinner, isJson, json, info } from '../lib/output.js';
import type { Compose, ComposeFull, Project, Deployment } from '../types/index.js';

export const composeCommand = new Command('compose')
  .description('Manage Docker Compose services');

composeCommand
  .command('list')
  .alias('ls')
  .description('List all compose services')
  .option('-p, --project <projectId>', 'Filter by project')
  .action(async (options) => {
    const s = spinner('Fetching compose services...').start();

    try {
      const projects = await api.get<Project[]>('/project.all');

      let composes: Compose[];
      if (options.project) {
        const project = projects.find(p => p.projectId === options.project);
        if (!project) {
          s.fail(`Project ${options.project} not found`);
          process.exit(1);
        }
        composes = (project.environments || []).flatMap(env => env.compose || []);
      } else {
        composes = projects.flatMap(p =>
          (p.environments || []).flatMap(env => env.compose || [])
        );
      }

      s.stop();

      table(composes, [
        { name: 'ID', key: 'composeId' },
        { name: 'Name', key: 'name' },
        { name: 'Status', key: 'composeStatus' },
        { name: 'Type', key: 'composeType' },
        { name: 'Source', key: 'sourceType' },
      ]);
    } catch (err) {
      s.fail('Failed to fetch compose services');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

composeCommand
  .command('create')
  .description('Create a new compose service')
  .option('-p, --project <projectId>', 'Project ID')
  .option('-n, --name <name>', 'Service name')
  .option('-t, --type <type>', 'Compose type (docker-compose or stack)', 'docker-compose')
  .action(async (options) => {
    let projectId = options.project;
    let name = options.name;

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
        message: 'Compose service name:',
        validate: (value) => value ? true : 'Name is required',
      });
    }

    const s = spinner('Creating compose service...').start();

    try {
      const compose = await api.post<Compose>('/compose.create', {
        projectId,
        name,
        composeType: options.type,
      });
      s.succeed('Compose service created');

      if (isJson()) {
        json(compose);
      } else {
        success(`Compose service "${name}" created`);
        keyValue({
          'ID': compose.composeId,
          'Name': compose.name,
          'Type': compose.composeType,
          'Status': compose.composeStatus,
        });
      }
    } catch (err) {
      s.fail('Failed to create compose service');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

composeCommand
  .command('deploy <composeId>')
  .description('Deploy a compose service')
  .option('-w, --wait', 'Wait for deployment to complete')
  .action(async (composeId, options) => {
    const s = spinner('Queuing deployment...').start();

    try {
      const result = await api.post<{ success: boolean; message: string }>('/compose.deploy', { composeId });

      if (!result.success) {
        s.fail('Deployment failed to queue');
        error(result.message || 'Unknown error');
        process.exit(1);
      }

      s.succeed('Deployment queued');

      if (options.wait) {
        const ws = spinner('Waiting for deployment to complete...').start();
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max wait

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const compose = await api.getWithParams<ComposeFull>('/compose.one', { composeId });

          if (compose.composeStatus === 'done') {
            ws.succeed('Deployment completed successfully');
            break;
          } else if (compose.composeStatus === 'error') {
            ws.fail('Deployment failed');
            error('Check logs with `dokploy compose logs ' + composeId + '`');
            process.exit(1);
          }
          attempts++;
        }

        if (attempts >= maxAttempts) {
          ws.warn('Timeout waiting for deployment');
          info('Deployment may still be running. Check status with `dokploy compose info ' + composeId + '`');
        }
      }

      if (isJson()) {
        json({ success: true, composeId, message: result.message });
      } else if (!options.wait) {
        info('Use `dokploy compose deploy <id> --wait` to wait for completion');
        info('Or check logs with `dokploy compose logs <id>`');
      }
    } catch (err) {
      s.fail('Failed to queue deployment');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

composeCommand
  .command('redeploy <composeId>')
  .description('Redeploy a compose service')
  .action(async (composeId) => {
    const s = spinner('Starting redeployment...').start();

    try {
      await api.post('/compose.redeploy', { composeId });
      s.succeed('Redeployment started');

      if (isJson()) {
        json({ success: true, composeId });
      }
    } catch (err) {
      s.fail('Failed to start redeployment');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

composeCommand
  .command('stop <composeId>')
  .description('Stop a compose service')
  .action(async (composeId) => {
    const s = spinner('Stopping compose service...').start();

    try {
      await api.post('/compose.stop', { composeId });
      s.succeed('Compose service stopped');

      if (isJson()) {
        json({ success: true, composeId });
      }
    } catch (err) {
      s.fail('Failed to stop compose service');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

composeCommand
  .command('start <composeId>')
  .description('Start a compose service')
  .action(async (composeId) => {
    const s = spinner('Starting compose service...').start();

    try {
      await api.post('/compose.start', { composeId });
      s.succeed('Compose service started');

      if (isJson()) {
        json({ success: true, composeId });
      }
    } catch (err) {
      s.fail('Failed to start compose service');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

composeCommand
  .command('delete <composeId>')
  .description('Delete a compose service')
  .option('-f, --force', 'Skip confirmation')
  .action(async (composeId, options) => {
    if (!options.force) {
      const confirmed = await confirm({
        message: `Delete compose service ${composeId}? This cannot be undone.`,
        default: false,
      });
      if (!confirmed) return;
    }

    const s = spinner('Deleting compose service...').start();

    try {
      await api.post('/compose.remove', { composeId });
      s.succeed('Compose service deleted');

      if (isJson()) {
        json({ success: true, composeId });
      }
    } catch (err) {
      s.fail('Failed to delete compose service');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

composeCommand
  .command('info <composeId>')
  .description('Show compose service details')
  .option('--full', 'Show full details including env, domains, deployments')
  .action(async (composeId, options) => {
    const s = spinner('Fetching compose service...').start();

    try {
      const compose = await api.getWithParams<ComposeFull>('/compose.one', {
        composeId,
      });
      s.stop();

      if (isJson()) {
        json(compose);
        return;
      }

      keyValue({
        'ID': compose.composeId,
        'Name': compose.name,
        'App Name': compose.appName,
        'Status': compose.composeStatus,
        'Type': compose.composeType,
        'Source': compose.sourceType,
        'Created': compose.createdAt,
      });

      if (!options.full) return;

      console.log('\n--- Environment Variables ---');
      if (compose.env) {
        const lines = compose.env.split('\n').filter(Boolean);
        console.log(`${lines.length} variable(s)`);
        lines.slice(0, 5).forEach(line => {
          const [key] = line.split('=');
          console.log(`  ${key}=***`);
        });
        if (lines.length > 5) console.log(`  ... and ${lines.length - 5} more`);
      } else {
        console.log('  (none)');
      }

      console.log('\n--- Compose File ---');
      if (compose.composeFile) {
        const preview = compose.composeFile.split('\n').slice(0, 10).join('\n');
        console.log(preview);
        if (compose.composeFile.split('\n').length > 10) {
          console.log('  ... (truncated)');
        }
      } else {
        console.log('  (not set)');
      }

      console.log('\n--- Repository ---');
      if (compose.repository) {
        console.log(`  ${compose.owner}/${compose.repository}@${compose.branch}`);
      } else if (compose.customGitUrl) {
        console.log(`  ${compose.customGitUrl}@${compose.customGitBranch || 'main'}`);
      } else {
        console.log('  (raw compose file)');
      }

      console.log('\n--- Domains ---');
      if (compose.domains?.length) {
        compose.domains.forEach(d => {
          console.log(`  ${d.https ? 'https' : 'http'}://${d.host}${d.path || ''}`);
        });
      } else {
        console.log('  (none)');
      }

      console.log('\n--- Deployments (recent) ---');
      if (compose.deployments?.length) {
        compose.deployments.slice(0, 5).forEach(d => {
          console.log(`  ${d.status.padEnd(8)} ${d.createdAt}`);
        });
      } else {
        console.log('  (none)');
      }

    } catch (err) {
      s.fail('Failed to fetch compose service');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

composeCommand
  .command('logs <composeId>')
  .description('View compose deployment logs')
  .option('-n, --lines <number>', 'Number of lines', '100')
  .action(async (composeId, _options) => {
    try {
      const deployments = await api.getWithParams<Deployment[]>('/deployment.allByCompose', {
        composeId,
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
        info('Log streaming not yet implemented. Check Dokploy dashboard for full logs.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
