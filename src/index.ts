#!/usr/bin/env bun
import { program } from 'commander';
import { setOutputMode } from './lib/output.js';
import { setActiveAlias } from './lib/config.js';
import { authCommand } from './commands/auth.js';
import { configCommand } from './commands/config.js';
import { projectCommand } from './commands/project.js';
import { appCommand } from './commands/app.js';
import { dbCommand } from './commands/db.js';
import { domainCommand } from './commands/domain.js';
import { envCommand } from './commands/env.js';
import { serverCommand } from './commands/server.js';

// Global options
program
  .name('dokploy')
  .description('CLI for Dokploy - self-hosted deployment platform')
  .version('0.2.0')
  .option('--json', 'Output as JSON')
  .option('-q, --quiet', 'Suppress spinners and progress output')
  .option('--config <path>', 'Path to config file')
  .option('--server <url>', 'Server URL override')
  .option('-a, --alias <name>', 'Use specific server alias')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    setOutputMode({ quiet: opts.quiet, json: opts.json });
    if (opts.alias) {
      setActiveAlias(opts.alias);
    }
  });

// Add commands
program.addCommand(authCommand);
program.addCommand(configCommand);
program.addCommand(projectCommand);
program.addCommand(appCommand);
program.addCommand(dbCommand);
program.addCommand(domainCommand);
program.addCommand(envCommand);
program.addCommand(serverCommand);

// Parse args
program.parse();
