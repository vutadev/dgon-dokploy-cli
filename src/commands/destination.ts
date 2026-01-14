import { Command } from 'commander';
import { input, confirm } from '@inquirer/prompts';
import { api, ApiError } from '../lib/api.js';
import { success, error, table, keyValue, spinner, isJson, json } from '../lib/output.js';
import type { Destination } from '../types/index.js';

export const destinationCommand = new Command('destination')
  .description('Manage backup destinations (S3-compatible storage)');

destinationCommand
  .command('list')
  .alias('ls')
  .description('List all destinations')
  .action(async () => {
    const s = spinner('Fetching destinations...').start();

    try {
      const destinations = await api.get<Destination[]>('/destination.all');
      s.stop();

      if (destinations.length === 0) {
        console.log('No destinations found. Use `dokploy destination add` to create one.');
        return;
      }

      table(destinations, [
        { name: 'ID', key: 'destinationId' },
        { name: 'Name', key: 'name' },
        { name: 'Bucket', key: 'bucket' },
        { name: 'Region', key: 'region' },
        { name: 'Created', key: 'createdAt' },
      ]);
    } catch (err) {
      s.fail('Failed to fetch destinations');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

destinationCommand
  .command('add')
  .description('Add a new backup destination')
  .option('-n, --name <name>', 'Destination name')
  .option('--bucket <bucket>', 'S3 bucket name')
  .option('--region <region>', 'S3 region')
  .option('--endpoint <endpoint>', 'S3 endpoint URL')
  .option('--access-key <key>', 'Access key ID')
  .option('--secret-key <key>', 'Secret access key')
  .action(async (options) => {
    let name = options.name;
    let bucket = options.bucket;
    let region = options.region;
    let endpoint = options.endpoint;
    let accessKey = options.accessKey;
    let secretKey = options.secretKey;

    // Interactive prompts for missing values
    if (!name) {
      name = await input({ message: 'Destination name:', validate: v => v ? true : 'Required' });
    }
    if (!bucket) {
      bucket = await input({ message: 'S3 bucket:', validate: v => v ? true : 'Required' });
    }
    if (!region) {
      region = await input({ message: 'Region (e.g., us-east-1):', default: 'us-east-1' });
    }
    if (!endpoint) {
      endpoint = await input({ message: 'Endpoint URL (optional):' });
    }
    if (!accessKey) {
      accessKey = await input({ message: 'Access Key ID:', validate: v => v ? true : 'Required' });
    }
    if (!secretKey) {
      secretKey = await input({ message: 'Secret Access Key:', validate: v => v ? true : 'Required' });
    }

    const s = spinner('Creating destination...').start();

    try {
      const dest = await api.post<Destination>('/destination.create', {
        name,
        bucket,
        region,
        endpoint: endpoint || undefined,
        accessKey,
        secretAccessKey: secretKey,
      });
      s.succeed('Destination created');

      if (isJson()) {
        json(dest);
      } else {
        success(`Destination "${name}" created`);
        keyValue({
          'ID': dest.destinationId,
          'Name': dest.name,
          'Bucket': dest.bucket,
        });
      }
    } catch (err) {
      s.fail('Failed to create destination');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

destinationCommand
  .command('test <destinationId>')
  .description('Test connection to destination')
  .action(async (destinationId) => {
    const s = spinner('Testing connection...').start();

    try {
      await api.post('/destination.testConnection', { destinationId });
      s.succeed('Connection successful');

      if (isJson()) {
        json({ success: true, destinationId });
      }
    } catch (err) {
      s.fail('Connection failed');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

destinationCommand
  .command('remove <destinationId>')
  .description('Remove a destination')
  .option('-f, --force', 'Skip confirmation')
  .action(async (destinationId, options) => {
    if (!options.force) {
      const confirmed = await confirm({
        message: `Remove destination ${destinationId}?`,
        default: false,
      });
      if (!confirmed) return;
    }

    const s = spinner('Removing destination...').start();

    try {
      await api.post('/destination.remove', { destinationId });
      s.succeed('Destination removed');

      if (isJson()) {
        json({ success: true, destinationId });
      }
    } catch (err) {
      s.fail('Failed to remove destination');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
