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

// Map database type to ID field name
const dbIdFields: Record<DatabaseType, string> = {
  postgres: 'postgresId',
  mysql: 'mysqlId',
  mongo: 'mongoId',
  redis: 'redisId',
  mariadb: 'mariadbId',
};

// Extended database with resolved id and type for display
interface DatabaseDisplay {
  id: string;
  name: string;
  type: DatabaseType;
  status: string;
}

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
      // Get all projects (databases are in environments)
      const projects = await api.get<Project[]>('/project.all');
      const databases: DatabaseDisplay[] = [];

      // Extract databases from all environments
      projects.forEach(p => {
        (p.environments || []).forEach(env => {
          (['postgres', 'mysql', 'mongo', 'redis', 'mariadb'] as const).forEach(type => {
            const dbs = env[type] || [];
            dbs.forEach((db: Database) => {
              const idField = dbIdFields[type] as keyof Database;
              databases.push({
                id: db[idField] as string || '',
                name: db.name,
                type,
                status: db.applicationStatus,
              });
            });
          });
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
        { name: 'Status', key: 'status' },
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
        const idField = dbIdFields[dbType] as keyof Database;
        success(`${dbType} database "${name}" created`);
        keyValue({
          'ID': db[idField] as string || '',
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
      await api.post(`/${router}.remove`, { [idField]: dbId });
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
