import { Command } from 'commander';
import { spawn } from 'child_process';
import { confirm } from '@inquirer/prompts';
import { checkForUpdate, detectPackageManager, getInstallCommand } from '../lib/update-checker.js';
import { success, error, info, warn, spinner, isJson, json, keyValue } from '../lib/output.js';

export const updateCommand = new Command('update')
  .description('Check for and install CLI updates')
  .option('-c, --check', 'Check for updates without installing')
  .option('-y, --yes', 'Update without confirmation')
  .action(async (options: { check?: boolean; yes?: boolean }) => {
    const s = spinner('Checking for updates...').start();

    const result = await checkForUpdate();

    if (result.latestVersion === null) {
      s.fail('Could not check for updates');
      if (isJson()) {
        json({ error: 'Failed to fetch version info', currentVersion: result.currentVersion });
      } else {
        error('Unable to reach npm registry. Check your connection.');
      }
      return;
    }

    s.stop();

    // JSON output mode
    if (isJson()) {
      json({
        currentVersion: result.currentVersion,
        latestVersion: result.latestVersion,
        updateAvailable: result.updateAvailable,
      });
      return;
    }

    // Display version info
    keyValue({
      'Current version': result.currentVersion,
      'Latest version': result.latestVersion,
    });

    // No update available
    if (!result.updateAvailable) {
      success('You are on the latest version!');
      return;
    }

    // Update available
    warn(`Update available: ${result.currentVersion} -> ${result.latestVersion}`);

    // Check-only mode
    if (options.check) {
      const pm = detectPackageManager();
      info(`Run: ${getInstallCommand(pm)}`);
      return;
    }

    // Confirm update
    if (!options.yes) {
      const confirmed = await confirm({
        message: 'Install update now?',
        default: true,
      });

      if (!confirmed) {
        info('Update cancelled');
        return;
      }
    }

    // Execute update
    await executeUpdate();
  });

async function executeUpdate(): Promise<void> {
  const pm = detectPackageManager();
  const cmd = getInstallCommand(pm);
  const [executable, ...args] = cmd.split(' ');

  info(`Running: ${cmd}`);
  console.log('');

  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      console.log('');
      if (code === 0) {
        success('Update complete! Restart the CLI to use the new version.');
        resolve();
      } else {
        error(`Update failed with exit code ${code}`);
        reject(new Error(`Exit code: ${code}`));
      }
    });

    child.on('error', (err) => {
      error(`Failed to start update: ${err.message}`);
      reject(err);
    });
  });
}
