#!/usr/bin/env node
import { program } from 'commander';
import { setOutputMode } from './lib/output.js';
import { setActiveAlias } from './lib/config.js';
import { ensureDokployDirs } from './lib/paths.js';
import { authCommand } from './commands/auth.js';
import { configCommand } from './commands/config.js';
import { projectCommand } from './commands/project.js';
import { appCommand } from './commands/app.js';
import { dbCommand } from './commands/db.js';
import { domainCommand } from './commands/domain.js';
import { envCommand } from './commands/env.js';
import { serverCommand } from './commands/server.js';
import { destinationCommand } from './commands/destination.js';
import { composeCommand } from './commands/compose.js';
import { updateCommand } from './commands/update.js';
import { VERSION } from './lib/version.js';
import { checkForUpdate, shouldCheckForUpdate } from './lib/update-checker.js';
import { isAutoUpdateCheckEnabled, getLastUpdateCheck, setLastUpdateCheck } from './lib/config.js';

// Ensure ~/.dokploy directories exist
await ensureDokployDirs();

// Check if TUI mode should be launched
const isTTY = process.stdout.isTTY;
const hasSubcommand = process.argv.length > 2;
const forceNoTUI = process.argv.includes('--no-tui');

// Launch TUI if: interactive terminal + no subcommand + not forced CLI
if (isTTY && !hasSubcommand && !forceNoTUI) {
  // Dynamic import to avoid loading React for CLI mode
  const { launchTUI } = await import('./tui/app.js');
  await launchTUI();
} else {
  // Standard CLI mode
  program
    .name('dokploy')
    .description('CLI for Dokploy - self-hosted deployment platform')
    .version(VERSION)
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress spinners and progress output')
    .option('--config <path>', 'Path to config file')
    .option('--server <url>', 'Server URL override')
    .option('-a, --alias <name>', 'Use specific server alias')
    .option('--no-tui', 'Disable TUI mode, use CLI')
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
  program.addCommand(destinationCommand);
  program.addCommand(composeCommand);
  program.addCommand(updateCommand);

  // Background update check (non-blocking)
  let updateNotification: Promise<string | null> | null = null;
  const isTTYMode = process.stdout.isTTY;
  const lastCheck = getLastUpdateCheck();
  const autoCheckEnabled = isAutoUpdateCheckEnabled();

  if (isTTYMode && shouldCheckForUpdate(lastCheck, autoCheckEnabled)) {
    updateNotification = (async () => {
      try {
        const result = await checkForUpdate();
        setLastUpdateCheck(Date.now());
        if (result.updateAvailable && result.latestVersion) {
          return `Update available: ${result.currentVersion} -> ${result.latestVersion}. Run: dokploy update`;
        }
      } catch {
        // Silent fail
      }
      return null;
    })();
  }

  // Parse args
  await program.parseAsync();

  // Show update notification after command completes
  if (updateNotification) {
    const msg = await updateNotification;
    if (msg && !process.argv.includes('--json') && !process.argv.includes('-q') && !process.argv.includes('--quiet')) {
      console.log(`\n\x1b[33m${msg}\x1b[0m`);
    }
  }
}
