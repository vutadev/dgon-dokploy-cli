import { Command } from 'commander';
import { api, ApiError } from '../lib/api.js';
import { error, table, keyValue, spinner, isJson, json } from '../lib/output.js';
import pc from 'picocolors';

interface Server {
  serverId: string;
  name: string;
  description?: string;
  ipAddress: string;
  port: number;
  serverStatus: 'active' | 'inactive';
  createdAt: string;
}

interface ServerStats {
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  totalMemory: number;
  usedMemory: number;
  diskUsagePercent: number;
  totalDisk: number;
  usedDisk: number;
}

export const serverCommand = new Command('server')
  .description('Manage servers');

serverCommand
  .command('list')
  .alias('ls')
  .description('List all servers')
  .action(async () => {
    const s = spinner('Fetching servers...').start();

    try {
      const servers = await api.get<Server[]>('/server.all');
      s.stop();

      table(servers, [
        { name: 'ID', key: 'serverId' },
        { name: 'Name', key: 'name' },
        { name: 'IP', key: 'ipAddress' },
        { name: 'Port', key: 'port' },
        { name: 'Status', key: 'serverStatus' },
      ]);
    } catch (err) {
      s.fail('Failed to fetch servers');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

serverCommand
  .command('stats [serverId]')
  .description('Show server statistics')
  .action(async (serverId) => {
    const s = spinner('Fetching server stats...').start();

    try {
      let stats: ServerStats;

      if (serverId) {
        stats = await api.post<ServerStats>('/server.stats', { serverId });
      } else {
        // Get default/first server stats
        const servers = await api.get<Server[]>('/server.all');
        if (servers.length === 0) {
          s.fail('No servers found');
          process.exit(1);
        }
        stats = await api.post<ServerStats>('/server.stats', { serverId: servers[0].serverId });
      }

      s.stop();

      if (isJson()) {
        json(stats);
      } else {
        // Format sizes
        const formatBytes = (bytes: number): string => {
          const gb = bytes / (1024 * 1024 * 1024);
          return `${gb.toFixed(2)} GB`;
        };

        // Create progress bar
        const progressBar = (percent: number, width = 20): string => {
          const filled = Math.round((percent / 100) * width);
          const empty = width - filled;
          const color = percent > 80 ? pc.red : percent > 60 ? pc.yellow : pc.green;
          return color('█'.repeat(filled) + '░'.repeat(empty));
        };

        console.log('\n' + pc.bold('Server Statistics'));
        console.log('─'.repeat(40));

        console.log(`\n${pc.bold('CPU Usage')}`);
        console.log(`  ${progressBar(stats.cpuUsagePercent)} ${stats.cpuUsagePercent.toFixed(1)}%`);

        console.log(`\n${pc.bold('Memory')}`);
        console.log(`  ${progressBar(stats.memoryUsagePercent)} ${stats.memoryUsagePercent.toFixed(1)}%`);
        console.log(`  ${pc.dim(`${formatBytes(stats.usedMemory)} / ${formatBytes(stats.totalMemory)}`)}`);

        console.log(`\n${pc.bold('Disk')}`);
        console.log(`  ${progressBar(stats.diskUsagePercent)} ${stats.diskUsagePercent.toFixed(1)}%`);
        console.log(`  ${pc.dim(`${formatBytes(stats.usedDisk)} / ${formatBytes(stats.totalDisk)}`)}`);

        console.log();
      }
    } catch (err) {
      s.fail('Failed to fetch server stats');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });

serverCommand
  .command('info <serverId>')
  .description('Show server details')
  .action(async (serverId) => {
    const s = spinner('Fetching server...').start();

    try {
      const server = await api.post<Server>('/server.one', { serverId });
      s.stop();

      if (isJson()) {
        json(server);
      } else {
        keyValue({
          'ID': server.serverId,
          'Name': server.name,
          'Description': server.description || '-',
          'IP Address': server.ipAddress,
          'Port': server.port,
          'Status': server.serverStatus,
          'Created': server.createdAt,
        });
      }
    } catch (err) {
      s.fail('Failed to fetch server');
      if (err instanceof ApiError) {
        error(err.message);
      }
      process.exit(1);
    }
  });
