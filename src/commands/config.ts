import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { confirm } from '@inquirer/prompts';
import {
  exportConfig,
  importConfig,
  getConfigPath,
  listServerAliases,
  getCurrentAlias,
} from '../lib/config.js';
import { success, error, info, keyValue, spinner, isJson, json } from '../lib/output.js';
import type { ConfigExport } from '../types/index.js';

export const configCommand = new Command('config')
  .description('Manage CLI configuration');

configCommand
  .command('export [file]')
  .description('Export server configurations to a file')
  .option('-a, --alias <aliases...>', 'Export only specific aliases')
  .option('--stdout', 'Output to stdout instead of file')
  .action(async (file, options) => {
    const aliases = options.alias;
    const exportData = exportConfig(aliases);

    if (Object.keys(exportData.servers).length === 0) {
      error('No servers to export');
      process.exit(1);
    }

    if (options.stdout || isJson()) {
      json(exportData);
      return;
    }

    const outputFile = file || 'dokploy-config.json';
    const s = spinner(`Exporting to ${outputFile}...`).start();

    try {
      await writeFile(outputFile, JSON.stringify(exportData, null, 2));
      s.succeed('Configuration exported');
      success(`Exported ${Object.keys(exportData.servers).length} server(s) to ${outputFile}`);
    } catch (err) {
      s.fail('Export failed');
      error(err instanceof Error ? err.message : 'Failed to write file');
      process.exit(1);
    }
  });

configCommand
  .command('import <file>')
  .description('Import server configurations from a file')
  .option('--overwrite', 'Overwrite existing aliases')
  .action(async (file, options) => {
    const s = spinner(`Reading ${file}...`).start();

    let data: ConfigExport;
    try {
      const content = await readFile(file, 'utf-8');
      data = JSON.parse(content) as ConfigExport;
    } catch (err) {
      s.fail('Failed to read file');
      error(err instanceof Error ? err.message : 'Invalid file');
      process.exit(1);
    }

    // Validate structure
    if (!data.servers || typeof data.servers !== 'object') {
      s.fail('Invalid config format');
      error('File does not contain valid server configurations');
      process.exit(1);
    }

    s.stop();

    const serverCount = Object.keys(data.servers).length;
    info(`Found ${serverCount} server(s) in ${file}`);

    if (!options.overwrite) {
      const existing = listServerAliases().map(s => s.alias);
      const conflicts = Object.keys(data.servers).filter(a => existing.includes(a));
      if (conflicts.length > 0) {
        info(`Conflicts: ${conflicts.join(', ')}`);
        const confirmed = await confirm({
          message: 'Overwrite existing aliases?',
          default: false,
        });
        if (!confirmed) {
          const result = importConfig(data, false);
          if (result.imported.length === 0) {
            error('No servers imported (all skipped)');
            return;
          }
          success(`Imported ${result.imported.length} server(s), skipped ${result.skipped.length}`);
          return;
        }
      }
    }

    const result = importConfig(data, options.overwrite);

    if (isJson()) {
      json({ success: true, ...result });
    } else {
      success(`Imported ${result.imported.length} server(s)`);
      if (result.skipped.length > 0) {
        info(`Skipped: ${result.skipped.join(', ')}`);
      }
    }
  });

configCommand
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const servers = listServerAliases();
    const currentAlias = getCurrentAlias();
    const configPath = getConfigPath();

    if (isJson()) {
      json({
        configPath,
        currentAlias,
        servers: servers.map(s => ({
          alias: s.alias,
          serverUrl: s.serverUrl,
          isCurrent: s.isCurrent,
        })),
      });
    } else {
      keyValue({
        'Config Path': configPath,
        'Current Alias': currentAlias,
        'Servers': servers.length,
      });

      if (servers.length > 0) {
        console.log('\nConfigured Servers:');
        servers.forEach(s => {
          const marker = s.isCurrent ? ' (current)' : '';
          console.log(`  ${s.alias}${marker}: ${s.serverUrl}`);
        });
      }
    }
  });

configCommand
  .command('path')
  .description('Show config file path')
  .action(() => {
    const path = getConfigPath();
    if (isJson()) {
      json({ path });
    } else {
      console.log(path);
    }
  });
