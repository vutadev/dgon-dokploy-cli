import Conf from 'conf';
import type { DokployConfig, ServerConfig, LegacyDokployConfig, ConfigExport } from '../types/index.js';
import { CONFIG_DIR } from './paths.js';

const DEFAULT_ALIAS = 'default';

const config = new Conf<DokployConfig>({
  projectName: 'dokploy',
  projectVersion: '0.2.0',
  cwd: CONFIG_DIR,
  configName: 'config',
  schema: {
    currentAlias: { type: 'string', default: DEFAULT_ALIAS },
    servers: { type: 'object', default: {} },
  },
  migrations: {
    // Migrate from legacy single-server config to multi-server
    '0.2.0': (store) => {
      const legacy = store as unknown as LegacyDokployConfig & DokployConfig;
      if (legacy.serverUrl && legacy.apiToken && !legacy.servers) {
        const servers: Record<string, ServerConfig> = {
          [DEFAULT_ALIAS]: {
            serverUrl: legacy.serverUrl,
            apiToken: legacy.apiToken,
            defaultProjectId: legacy.defaultProjectId,
          },
        };
        config.set('servers', servers);
        config.set('currentAlias', DEFAULT_ALIAS);
        // Clean up legacy keys
        config.delete('serverUrl' as keyof DokployConfig);
        config.delete('apiToken' as keyof DokployConfig);
        config.delete('defaultProjectId' as keyof DokployConfig);
      }
    },
  },
});

// Current alias tracking (can be overridden per-command)
let activeAlias: string | null = null;

export function setActiveAlias(alias: string): void {
  activeAlias = alias;
}

export function getActiveAlias(): string {
  return activeAlias || config.get('currentAlias') || DEFAULT_ALIAS;
}

export function getCurrentAlias(): string {
  return config.get('currentAlias') || DEFAULT_ALIAS;
}

export function setCurrentAlias(alias: string): void {
  const servers = config.get('servers') || {};
  if (!servers[alias]) {
    throw new Error(`Server alias "${alias}" not found`);
  }
  config.set('currentAlias', alias);
}

export function getServerConfig(alias?: string): ServerConfig | null {
  const targetAlias = alias || getActiveAlias();
  const servers = config.get('servers') || {};
  return servers[targetAlias] || null;
}

export function setServerConfig(alias: string, data: Partial<ServerConfig>): void {
  const servers = config.get('servers') || {};
  const existing = servers[alias] || { serverUrl: '', apiToken: '' };

  servers[alias] = {
    ...existing,
    ...data,
  };

  config.set('servers', servers);
}

export function removeServerConfig(alias: string): boolean {
  const servers = config.get('servers') || {};
  if (!servers[alias]) return false;

  delete servers[alias];
  config.set('servers', servers);

  // If removed current alias, switch to another or default
  if (getCurrentAlias() === alias) {
    const remaining = Object.keys(servers);
    config.set('currentAlias', remaining[0] || DEFAULT_ALIAS);
  }

  return true;
}

export function listServerAliases(): { alias: string; serverUrl: string; isCurrent: boolean }[] {
  const servers = config.get('servers') || {};
  const current = getCurrentAlias();

  return Object.entries(servers).map(([alias, cfg]) => ({
    alias,
    serverUrl: cfg.serverUrl,
    isCurrent: alias === current,
  }));
}

export function isConfigured(alias?: string): boolean {
  const cfg = getServerConfig(alias);
  return Boolean(cfg?.serverUrl && cfg?.apiToken);
}

export function clearConfig(): void {
  config.clear();
}

export function clearServerConfig(alias: string): void {
  removeServerConfig(alias);
}

export function getConfigPath(): string {
  return config.path;
}

// Export all server configs (for backup/sharing)
export function exportConfig(aliases?: string[]): ConfigExport {
  const servers = config.get('servers') || {};
  const exportData: Record<string, ServerConfig> = {};

  const targetAliases = aliases || Object.keys(servers);
  for (const alias of targetAliases) {
    if (servers[alias]) {
      exportData[alias] = servers[alias];
    }
  }

  return {
    version: '0.2.0',
    exportedAt: new Date().toISOString(),
    servers: exportData,
  };
}

// Import server configs from export
export function importConfig(data: ConfigExport, overwrite = false): { imported: string[]; skipped: string[] } {
  const servers = config.get('servers') || {};
  const imported: string[] = [];
  const skipped: string[] = [];

  for (const [alias, cfg] of Object.entries(data.servers)) {
    if (servers[alias] && !overwrite) {
      skipped.push(alias);
    } else {
      servers[alias] = cfg;
      imported.push(alias);
    }
  }

  config.set('servers', servers);

  return { imported, skipped };
}

// Legacy compatibility - get config for current alias
export function getConfig(): ServerConfig {
  return getServerConfig() || { serverUrl: '', apiToken: '' };
}

// Legacy compatibility - set config for current alias
export function setConfig(data: Partial<ServerConfig>): void {
  setServerConfig(getActiveAlias(), data);
}
