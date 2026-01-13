import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import { readFile, writeFile } from 'fs/promises';
import { api, ApiError } from '../lib/api.js';
import { success, error, info, spinner, isJson, json } from '../lib/output.js';
import type { Application, Project } from '../types/index.js';

export const envCommand = new Command('env')
  .description('Manage environment variables');

envCommand
  .command('pull [file]')
  .description('Pull environment variables to a file')
  .option('-a, --app <appId>', 'Application ID')
  .action(async (file = '.env', options) => {
    let appId = options.app;

    // Get app list if not specified
    if (!appId) {
      const projects = await api.get<(Project & { applications: Application[] })[]>('/project.all');
      const apps = projects.flatMap(p => p.applications || []);

      if (apps.length === 0) {
        error('No applications found.');
        process.exit(1);
      }

      appId = await select({
        message: 'Select application:',
        choices: apps.map(a => ({ name: `${a.name} (${a.applicationId})`, value: a.applicationId })),
      });
    }

    const s = spinner('Pulling environment variables...').start();

    try {
      const app = await api.post<Application & { env: string }>(
        '/application.one',
        { applicationId: appId }
      );

      const envContent = app.env || '';
      await writeFile(file, envContent);

      s.succeed('Environment variables pulled');

      if (isJson()) {
        json({ success: true, file, applicationId: appId });
      } else {
        success(`Environment variables saved to ${file}`);
        const lineCount = envContent.split('\n').filter(Boolean).length;
        info(`${lineCount} variable(s) written`);
      }
    } catch (err) {
      s.fail('Failed to pull environment variables');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

envCommand
  .command('push [file]')
  .description('Push environment variables from a file')
  .option('-a, --app <appId>', 'Application ID')
  .action(async (file = '.env', options) => {
    let appId = options.app;

    // Read env file
    let envContent: string;
    try {
      envContent = await readFile(file, 'utf-8');
    } catch {
      error(`File not found: ${file}`);
      process.exit(1);
    }

    // Get app list if not specified
    if (!appId) {
      const projects = await api.get<(Project & { applications: Application[] })[]>('/project.all');
      const apps = projects.flatMap(p => p.applications || []);

      if (apps.length === 0) {
        error('No applications found.');
        process.exit(1);
      }

      appId = await select({
        message: 'Select application:',
        choices: apps.map(a => ({ name: `${a.name} (${a.applicationId})`, value: a.applicationId })),
      });
    }

    const s = spinner('Pushing environment variables...').start();

    try {
      await api.post('/application.saveEnvironment', {
        applicationId: appId,
        env: envContent,
      });

      s.succeed('Environment variables pushed');

      if (isJson()) {
        json({ success: true, file, applicationId: appId });
      } else {
        success(`Environment variables from ${file} pushed`);
        const lineCount = envContent.split('\n').filter(Boolean).length;
        info(`${lineCount} variable(s) updated`);
      }
    } catch (err) {
      s.fail('Failed to push environment variables');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

envCommand
  .command('show')
  .description('Show environment variables for an application')
  .option('-a, --app <appId>', 'Application ID')
  .action(async (options) => {
    let appId = options.app;

    // Get app list if not specified
    if (!appId) {
      const projects = await api.get<(Project & { applications: Application[] })[]>('/project.all');
      const apps = projects.flatMap(p => p.applications || []);

      if (apps.length === 0) {
        error('No applications found.');
        process.exit(1);
      }

      appId = await select({
        message: 'Select application:',
        choices: apps.map(a => ({ name: `${a.name} (${a.applicationId})`, value: a.applicationId })),
      });
    }

    const s = spinner('Fetching environment variables...').start();

    try {
      const app = await api.post<Application & { env: string }>(
        '/application.one',
        { applicationId: appId }
      );

      s.stop();

      if (isJson()) {
        // Parse env string to object
        const envVars: Record<string, string> = {};
        (app.env || '').split('\n').forEach(line => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        });
        json(envVars);
      } else {
        console.log(app.env || '(no environment variables)');
      }
    } catch (err) {
      s.fail('Failed to fetch environment variables');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
