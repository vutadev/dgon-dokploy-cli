import { Command } from 'commander';
import { input, confirm } from '@inquirer/prompts';
import {
  getConfig,
  setServerConfig,
  removeServerConfig,
  isConfigured,
  getConfigPath,
  listServerAliases,
  getCurrentAlias,
  setCurrentAlias,
  getActiveAlias,
} from '../lib/config.js';
import { verifyConnection } from '../lib/api.js';
import { success, error, info, keyValue, spinner, isJson, json, table } from '../lib/output.js';

export const authCommand = new Command('auth')
  .description('Manage authentication and server connections');

authCommand
  .command('login')
  .description('Login to a Dokploy server')
  .option('-s, --server <url>', 'Server URL')
  .option('-t, --token <token>', 'API token')
  .option('-a, --alias <name>', 'Server alias (default: "default")', 'default')
  .action(async (options) => {
    let serverUrl = options.server;
    let apiToken = options.token;
    const alias = options.alias;

    if (!serverUrl) {
      serverUrl = await input({
        message: 'Dokploy server URL:',
        default: 'http://localhost:3000',
        validate: (value) => {
          if (!value) return 'Server URL is required';
          try {
            new URL(value);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        },
      });
    }

    if (!apiToken) {
      apiToken = await input({
        message: 'API token:',
        validate: (value) => value ? true : 'API token is required',
      });
    }

    const s = spinner('Verifying connection...').start();

    const valid = await verifyConnection(serverUrl, apiToken);

    if (valid) {
      setServerConfig(alias, { serverUrl, apiToken });
      s.succeed('Connected successfully');

      if (isJson()) {
        json({ success: true, alias, serverUrl });
      } else {
        success(`Logged in as "${alias}" to ${serverUrl}`);
        info(`Config saved to ${getConfigPath()}`);
      }
    } else {
      s.fail('Connection failed');
      error('Could not connect. Check server URL and token.');
      process.exit(1);
    }
  });

authCommand
  .command('logout')
  .description('Logout from current or specified server')
  .option('-a, --alias <name>', 'Server alias to logout from')
  .option('--all', 'Logout from all servers')
  .action(async (options) => {
    if (options.all) {
      const confirmed = await confirm({
        message: 'Logout from all servers?',
        default: false,
      });
      if (confirmed) {
        const aliases = listServerAliases();
        aliases.forEach(a => removeServerConfig(a.alias));
        if (isJson()) {
          json({ success: true, message: 'Logged out from all servers' });
        } else {
          success('Logged out from all servers');
        }
      }
      return;
    }

    const alias = options.alias || getActiveAlias();

    if (!isConfigured(alias)) {
      error(`Not logged in as "${alias}"`);
      return;
    }

    const confirmed = await confirm({
      message: `Logout from "${alias}"?`,
      default: false,
    });

    if (confirmed) {
      removeServerConfig(alias);
      if (isJson()) {
        json({ success: true, alias });
      } else {
        success(`Logged out from "${alias}"`);
      }
    }
  });

authCommand
  .command('whoami')
  .description('Show current authentication status')
  .option('-a, --alias <name>', 'Check specific alias')
  .action((options) => {
    const alias = options.alias || getActiveAlias();
    const config = getConfig();

    if (!config.serverUrl || !config.apiToken) {
      if (isJson()) {
        json({ authenticated: false, alias });
      } else {
        error(`Not logged in as "${alias}". Run \`dokploy auth login\` first.`);
      }
      return;
    }

    if (isJson()) {
      json({
        authenticated: true,
        alias,
        serverUrl: config.serverUrl,
        configPath: getConfigPath(),
      });
    } else {
      keyValue({
        'Alias': alias,
        'Server': config.serverUrl,
        'Token': config.apiToken.slice(0, 8) + '...' + config.apiToken.slice(-4),
        'Config': getConfigPath(),
      });
    }
  });

authCommand
  .command('verify')
  .description('Verify current connection')
  .option('-a, --alias <name>', 'Verify specific alias')
  .action(async (options) => {
    const alias = options.alias || getActiveAlias();

    if (!isConfigured(alias)) {
      error(`Not logged in as "${alias}". Run \`dokploy auth login\` first.`);
      process.exit(1);
    }

    const config = getConfig();
    const s = spinner('Verifying connection...').start();

    const valid = await verifyConnection(config.serverUrl, config.apiToken);

    if (valid) {
      s.succeed('Connection verified');
      if (isJson()) {
        json({ valid: true, alias, serverUrl: config.serverUrl });
      } else {
        success(`Connected to ${config.serverUrl} as "${alias}"`);
      }
    } else {
      s.fail('Connection failed');
      error('Token may be expired or server unreachable');
      process.exit(1);
    }
  });

authCommand
  .command('list')
  .alias('ls')
  .description('List all configured servers')
  .action(() => {
    const servers = listServerAliases();

    if (servers.length === 0) {
      if (isJson()) {
        json({ servers: [] });
      } else {
        info('No servers configured. Run `dokploy auth login` to add one.');
      }
      return;
    }

    if (isJson()) {
      json({ servers, currentAlias: getCurrentAlias() });
    } else {
      table(servers.map(s => ({
        Alias: s.isCurrent ? `${s.alias} (current)` : s.alias,
        Server: s.serverUrl,
      })), [
        { name: 'Alias', key: 'Alias' },
        { name: 'Server', key: 'Server' },
      ]);
    }
  });

authCommand
  .command('use <alias>')
  .description('Switch to a different server')
  .action((alias) => {
    try {
      setCurrentAlias(alias);
      if (isJson()) {
        json({ success: true, currentAlias: alias });
      } else {
        success(`Switched to "${alias}"`);
      }
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to switch alias');
      process.exit(1);
    }
  });

authCommand
  .command('test')
  .description('Test API connectivity and data access (headless mode)')
  .option('-a, --alias <name>', 'Test specific alias')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    const alias = options.alias || getActiveAlias();

    if (!isConfigured(alias)) {
      error(`Not logged in as "${alias}". Run \`dokploy auth login\` first.`);
      process.exit(1);
    }

    const config = getConfig();
    const results: Record<string, unknown> = {
      alias,
      serverUrl: config.serverUrl,
      tests: {},
    };

    // Test 1: Connection
    info(`Testing connection to ${config.serverUrl}...`);
    const valid = await verifyConnection(config.serverUrl, config.apiToken);
    (results.tests as Record<string, unknown>).connection = valid;
    if (!valid) {
      error('Connection failed - check server URL and API token');
      if (isJson()) json(results);
      process.exit(1);
    }
    success('✓ Connection OK');

    // Test 2: Fetch projects (includes environments and apps)
    info('Fetching projects...');
    try {
      const { api } = await import('../lib/api.js');
      type ProjectWithEnvs = {
        projectId: string;
        name: string;
        environments?: { applications?: { applicationId: string; name: string }[] }[];
      };
      const projects = await api.get<ProjectWithEnvs[]>('/project.all');
      (results.tests as Record<string, unknown>).projects = { count: projects.length };
      success(`✓ Projects: ${projects.length} found`);

      if (options.verbose && projects.length > 0) {
        projects.forEach(p => info(`  - ${p.name} (${p.projectId})`));
      }

      // Test 3: Extract apps from environments (already in response)
      const allApps = projects.flatMap(p =>
        (p.environments || []).flatMap(env => env.applications || [])
      );
      (results.tests as Record<string, unknown>).applications = { count: allApps.length };
      success(`✓ Applications: ${allApps.length} found across all projects`);

      if (options.verbose && allApps.length > 0) {
        allApps.slice(0, 10).forEach(a => info(`  - ${a.name} (${a.applicationId})`));
        if (allApps.length > 10) {
          info(`  ... and ${allApps.length - 10} more`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      (results.tests as Record<string, unknown>).error = message;
      error(`API error: ${message}`);
      if (isJson()) json(results);
      process.exit(1);
    }

    success('\nAll tests passed!');
    if (isJson()) json(results);
  });

authCommand
  .command('remove <alias>')
  .description('Remove a server configuration')
  .option('-f, --force', 'Skip confirmation')
  .action(async (alias, options) => {
    if (!isConfigured(alias)) {
      error(`Server "${alias}" not found`);
      process.exit(1);
    }

    if (!options.force) {
      const confirmed = await confirm({
        message: `Remove server "${alias}"? This cannot be undone.`,
        default: false,
      });
      if (!confirmed) return;
    }

    removeServerConfig(alias);

    if (isJson()) {
      json({ success: true, removed: alias });
    } else {
      success(`Removed server "${alias}"`);
    }
  });
