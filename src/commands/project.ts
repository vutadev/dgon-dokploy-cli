import { Command } from 'commander';
import { input, confirm } from '@inquirer/prompts';
import { api, ApiError } from '../lib/api.js';
import { success, error, table, keyValue, spinner, isJson, json } from '../lib/output.js';
import type { Project } from '../types/index.js';

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
      await api.delete('/project.remove', { projectId });
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
