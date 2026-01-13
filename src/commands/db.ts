import { Command } from 'commander';
import { input, select, confirm } from '@inquirer/prompts';
import { api, ApiError } from '../lib/api.js';
import { success, error, table, keyValue, spinner, isJson, json } from '../lib/output.js';
import type { Database, DatabaseType, Project } from '../types/index.js';

// Map database types to API router prefixes
const dbRouters: Record<DatabaseType, string> = {
  postgres: 'postgres',
  mysql: 'mysql',
  mongo: 'mongo',
  redis: 'redis',
  mariadb: 'mariadb',
};

export const dbCommand = new Command('db')
  .description('Manage databases');

dbCommand
  .command('list')
  .alias('ls')
  .description('List all databases')
  .option('-t, --type <type>', 'Filter by type (postgres, mysql, mongo, redis, mariadb)')
  .action(async (options) => {
    const s = spinner('Fetching databases...').start();

    try {
      // Get all projects with their databases
      const projects = await api.get<(Project & {
        postgres?: Database[];
        mysql?: Database[];
        mongo?: Database[];
        redis?: Database[];
        mariadb?: Database[];
      })[]>('/project.all');

      const databases: (Database & { type: DatabaseType })[] = [];

      projects.forEach(p => {
        (['postgres', 'mysql', 'mongo', 'redis', 'mariadb'] as const).forEach(type => {
          const dbs = p[type as keyof typeof p] as Database[] | undefined;
          if (dbs) {
            dbs.forEach(db => databases.push({ ...db, type }));
          }
        });
      });

      // Filter by type if specified
      const filtered = options.type
        ? databases.filter(db => db.type === options.type)
        : databases;

      s.stop();

      table(filtered, [
        { name: 'ID', key: 'id' },
        { name: 'Name', key: 'name' },
        { name: 'Type', key: 'type' },
        { name: 'Status', key: 'databaseStatus' },
      ]);
    } catch (err) {
      s.fail('Failed to fetch databases');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

dbCommand
  .command('create')
  .description('Create a new database')
  .option('-t, --type <type>', 'Database type (postgres, mysql, mongo, redis, mariadb)')
  .option('-p, --project <projectId>', 'Project ID')
  .option('-n, --name <name>', 'Database name')
  .action(async (options) => {
    let dbType = options.type as DatabaseType;
    let projectId = options.project;
    let name = options.name;

    // Select database type
    if (!dbType) {
      dbType = await select({
        message: 'Database type:',
        choices: [
          { name: 'PostgreSQL', value: 'postgres' },
          { name: 'MySQL', value: 'mysql' },
          { name: 'MongoDB', value: 'mongo' },
          { name: 'Redis', value: 'redis' },
          { name: 'MariaDB', value: 'mariadb' },
        ],
      });
    }

    // Get project list if not specified
    if (!projectId) {
      const projects = await api.get<Project[]>('/project.all');
      if (projects.length === 0) {
        error('No projects found. Create a project first.');
        process.exit(1);
      }

      projectId = await select({
        message: 'Select project:',
        choices: projects.map(p => ({ name: p.name, value: p.projectId })),
      });
    }

    if (!name) {
      name = await input({
        message: 'Database name:',
        validate: (value) => value ? true : 'Name is required',
      });
    }

    const s = spinner(`Creating ${dbType} database...`).start();
    const router = dbRouters[dbType];

    try {
      const db = await api.post<Database>(`/${router}.create`, {
        projectId,
        name,
      });
      s.succeed('Database created');

      if (isJson()) {
        json(db);
      } else {
        success(`${dbType} database "${name}" created`);
        keyValue({
          'ID': db.id,
          'Name': db.name,
          'Type': dbType,
        });
      }
    } catch (err) {
      s.fail('Failed to create database');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

dbCommand
  .command('delete <dbId>')
  .description('Delete a database')
  .requiredOption('-t, --type <type>', 'Database type (postgres, mysql, mongo, redis, mariadb)')
  .option('-f, --force', 'Skip confirmation')
  .action(async (dbId, options) => {
    const dbType = options.type as DatabaseType;

    if (!dbRouters[dbType]) {
      error(`Invalid database type: ${dbType}`);
      process.exit(1);
    }

    if (!options.force) {
      const confirmed = await confirm({
        message: `Delete ${dbType} database ${dbId}? This cannot be undone.`,
        default: false,
      });
      if (!confirmed) return;
    }

    const s = spinner('Deleting database...').start();
    const router = dbRouters[dbType];

    // The ID field varies by database type
    const idField = `${dbType}Id`;

    try {
      await api.delete(`/${router}.remove`, { [idField]: dbId });
      s.succeed('Database deleted');

      if (isJson()) {
        json({ success: true, dbId, type: dbType });
      }
    } catch (err) {
      s.fail('Failed to delete database');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

dbCommand
  .command('stop <dbId>')
  .description('Stop a database')
  .requiredOption('-t, --type <type>', 'Database type')
  .action(async (dbId, options) => {
    const dbType = options.type as DatabaseType;
    const router = dbRouters[dbType];
    const idField = `${dbType}Id`;

    const s = spinner('Stopping database...').start();

    try {
      await api.post(`/${router}.stop`, { [idField]: dbId });
      s.succeed('Database stopped');

      if (isJson()) {
        json({ success: true, dbId });
      }
    } catch (err) {
      s.fail('Failed to stop database');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

dbCommand
  .command('start <dbId>')
  .description('Start a database')
  .requiredOption('-t, --type <type>', 'Database type')
  .action(async (dbId, options) => {
    const dbType = options.type as DatabaseType;
    const router = dbRouters[dbType];
    const idField = `${dbType}Id`;

    const s = spinner('Starting database...').start();

    try {
      await api.post(`/${router}.deploy`, { [idField]: dbId });
      s.succeed('Database started');

      if (isJson()) {
        json({ success: true, dbId });
      }
    } catch (err) {
      s.fail('Failed to start database');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
