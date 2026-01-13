import { Command } from 'commander';
import { input, confirm, select } from '@inquirer/prompts';
import { api, ApiError } from '../lib/api.js';
import { success, error, table, keyValue, spinner, isJson, json } from '../lib/output.js';
import type { Domain, Application, Project } from '../types/index.js';

export const domainCommand = new Command('domain')
  .description('Manage domains');

domainCommand
  .command('list')
  .alias('ls')
  .description('List all domains')
  .option('-a, --app <appId>', 'Filter by application')
  .action(async (options) => {
    const s = spinner('Fetching domains...').start();

    try {
      let domains: Domain[] = [];

      if (options.app) {
        // Get domains for specific application
        const app = await api.post<Application & { domains: Domain[] }>(
          '/application.one',
          { applicationId: options.app }
        );
        domains = app.domains || [];
      } else {
        // Get all domains from all projects/apps
        const projects = await api.get<(Project & { applications: (Application & { domains: Domain[] })[] })[]>('/project.all');
        projects.forEach(p => {
          (p.applications || []).forEach(app => {
            domains.push(...(app.domains || []));
          });
        });
      }

      s.stop();

      table(domains, [
        { name: 'ID', key: 'domainId' },
        { name: 'Host', key: 'host' },
        { name: 'Path', key: 'path' },
        { name: 'HTTPS', key: 'https' },
        { name: 'Certificate', key: 'certificateType' },
      ]);
    } catch (err) {
      s.fail('Failed to fetch domains');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

domainCommand
  .command('add')
  .description('Add a domain to an application')
  .option('-a, --app <appId>', 'Application ID')
  .option('-h, --host <host>', 'Domain hostname')
  .option('--https', 'Enable HTTPS')
  .action(async (options) => {
    let appId = options.app;
    let host = options.host;

    // Get app list if not specified
    if (!appId) {
      const projects = await api.get<(Project & { applications: Application[] })[]>('/project.all');
      const apps = projects.flatMap(p => p.applications || []);

      if (apps.length === 0) {
        error('No applications found. Create an application first.');
        process.exit(1);
      }

      appId = await select({
        message: 'Select application:',
        choices: apps.map(a => ({ name: `${a.name} (${a.applicationId})`, value: a.applicationId })),
      });
    }

    if (!host) {
      host = await input({
        message: 'Domain hostname (e.g., app.example.com):',
        validate: (value) => {
          if (!value) return 'Hostname is required';
          // Basic domain validation
          if (!/^[a-zA-Z0-9][a-zA-Z0-9-_.]+[a-zA-Z0-9]$/.test(value)) {
            return 'Invalid hostname format';
          }
          return true;
        },
      });
    }

    const enableHttps = options.https ?? await confirm({
      message: 'Enable HTTPS with Let\'s Encrypt?',
      default: true,
    });

    const s = spinner('Adding domain...').start();

    try {
      const domain = await api.post<Domain>('/domain.create', {
        applicationId: appId,
        host,
        https: enableHttps,
        certificateType: enableHttps ? 'letsencrypt' : 'none',
      });
      s.succeed('Domain added');

      if (isJson()) {
        json(domain);
      } else {
        success(`Domain ${host} added`);
        keyValue({
          'ID': domain.domainId,
          'Host': domain.host,
          'HTTPS': domain.https ? 'Yes' : 'No',
        });
      }
    } catch (err) {
      s.fail('Failed to add domain');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

domainCommand
  .command('remove <domainId>')
  .description('Remove a domain')
  .option('-f, --force', 'Skip confirmation')
  .action(async (domainId, options) => {
    if (!options.force) {
      const confirmed = await confirm({
        message: `Remove domain ${domainId}?`,
        default: false,
      });
      if (!confirmed) return;
    }

    const s = spinner('Removing domain...').start();

    try {
      await api.delete('/domain.delete', { domainId });
      s.succeed('Domain removed');

      if (isJson()) {
        json({ success: true, domainId });
      }
    } catch (err) {
      s.fail('Failed to remove domain');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

domainCommand
  .command('ssl <domainId>')
  .description('Generate SSL certificate for domain')
  .action(async (domainId) => {
    const s = spinner('Generating SSL certificate...').start();

    try {
      await api.post('/domain.generateCertificate', { domainId });
      s.succeed('SSL certificate generated');

      if (isJson()) {
        json({ success: true, domainId });
      } else {
        success('SSL certificate generated successfully');
      }
    } catch (err) {
      s.fail('Failed to generate certificate');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
