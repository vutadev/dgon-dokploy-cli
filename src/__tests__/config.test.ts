import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import {
  getConfig,
  setConfig,
  clearConfig,
  isConfigured,
  setServerConfig,
  getServerConfig,
  removeServerConfig,
  listServerAliases,
  getCurrentAlias,
  setCurrentAlias,
  exportConfig,
  importConfig,
} from '../lib/config.js';

describe('config', () => {
  beforeEach(() => {
    clearConfig();
  });

  afterEach(() => {
    clearConfig();
  });

  test('getConfig returns empty values when not configured', () => {
    const config = getConfig();
    expect(config.serverUrl).toBe('');
    expect(config.apiToken).toBe('');
  });

  test('setConfig stores values correctly', () => {
    setConfig({
      serverUrl: 'http://localhost:3000',
      apiToken: 'test-token',
    });

    const config = getConfig();
    expect(config.serverUrl).toBe('http://localhost:3000');
    expect(config.apiToken).toBe('test-token');
  });

  test('isConfigured returns false when not configured', () => {
    expect(isConfigured()).toBe(false);
  });

  test('isConfigured returns true when configured', () => {
    setConfig({
      serverUrl: 'http://localhost:3000',
      apiToken: 'test-token',
    });
    expect(isConfigured()).toBe(true);
  });

  test('clearConfig removes all values', () => {
    setConfig({
      serverUrl: 'http://localhost:3000',
      apiToken: 'test-token',
    });

    clearConfig();

    const config = getConfig();
    expect(config.serverUrl).toBe('');
    expect(config.apiToken).toBe('');
  });

  test('setConfig allows partial updates', () => {
    setConfig({ serverUrl: 'http://localhost:3000' });
    setConfig({ apiToken: 'test-token' });

    const config = getConfig();
    expect(config.serverUrl).toBe('http://localhost:3000');
    expect(config.apiToken).toBe('test-token');
  });
});

describe('multi-server config', () => {
  beforeEach(() => {
    clearConfig();
  });

  afterEach(() => {
    clearConfig();
  });

  test('setServerConfig creates server with alias', () => {
    setServerConfig('prod', {
      serverUrl: 'https://prod.example.com',
      apiToken: 'prod-token',
    });

    const config = getServerConfig('prod');
    expect(config?.serverUrl).toBe('https://prod.example.com');
    expect(config?.apiToken).toBe('prod-token');
  });

  test('multiple servers can be configured', () => {
    setServerConfig('prod', {
      serverUrl: 'https://prod.example.com',
      apiToken: 'prod-token',
    });
    setServerConfig('staging', {
      serverUrl: 'https://staging.example.com',
      apiToken: 'staging-token',
    });

    const aliases = listServerAliases();
    expect(aliases.length).toBe(2);
  });

  test('removeServerConfig removes server', () => {
    setServerConfig('test', {
      serverUrl: 'http://test.local',
      apiToken: 'test-token',
    });

    expect(removeServerConfig('test')).toBe(true);
    expect(getServerConfig('test')).toBeNull();
  });

  test('setCurrentAlias switches active server', () => {
    setServerConfig('server1', {
      serverUrl: 'http://server1.local',
      apiToken: 'token1',
    });
    setServerConfig('server2', {
      serverUrl: 'http://server2.local',
      apiToken: 'token2',
    });

    setCurrentAlias('server2');
    expect(getCurrentAlias()).toBe('server2');
  });

  test('setCurrentAlias throws for nonexistent alias', () => {
    expect(() => setCurrentAlias('nonexistent')).toThrow();
  });

  test('isConfigured checks specific alias', () => {
    setServerConfig('configured', {
      serverUrl: 'http://configured.local',
      apiToken: 'token',
    });

    expect(isConfigured('configured')).toBe(true);
    expect(isConfigured('unconfigured')).toBe(false);
  });
});

describe('config export/import', () => {
  beforeEach(() => {
    clearConfig();
  });

  afterEach(() => {
    clearConfig();
  });

  test('exportConfig exports all servers', () => {
    setServerConfig('prod', {
      serverUrl: 'https://prod.example.com',
      apiToken: 'prod-token',
    });
    setServerConfig('staging', {
      serverUrl: 'https://staging.example.com',
      apiToken: 'staging-token',
    });

    const exported = exportConfig();
    expect(exported.version).toMatch(/^\d+\.\d+\.\d+(-dev)?$/); // Matches version or dev fallback
    expect(Object.keys(exported.servers).length).toBe(2);
    expect(exported.servers['prod'].serverUrl).toBe('https://prod.example.com');
  });

  test('exportConfig exports specific aliases', () => {
    setServerConfig('prod', {
      serverUrl: 'https://prod.example.com',
      apiToken: 'prod-token',
    });
    setServerConfig('staging', {
      serverUrl: 'https://staging.example.com',
      apiToken: 'staging-token',
    });

    const exported = exportConfig(['prod']);
    expect(Object.keys(exported.servers).length).toBe(1);
    expect(exported.servers['prod']).toBeDefined();
    expect(exported.servers['staging']).toBeUndefined();
  });

  test('importConfig imports servers', () => {
    const data = {
      version: '0.2.0',
      exportedAt: new Date().toISOString(),
      servers: {
        imported: {
          serverUrl: 'http://imported.local',
          apiToken: 'imported-token',
        },
      },
    };

    const result = importConfig(data);
    expect(result.imported).toContain('imported');
    expect(getServerConfig('imported')?.serverUrl).toBe('http://imported.local');
  });

  test('importConfig skips existing without overwrite', () => {
    setServerConfig('existing', {
      serverUrl: 'http://original.local',
      apiToken: 'original-token',
    });

    const data = {
      version: '0.2.0',
      exportedAt: new Date().toISOString(),
      servers: {
        existing: {
          serverUrl: 'http://new.local',
          apiToken: 'new-token',
        },
      },
    };

    const result = importConfig(data, false);
    expect(result.skipped).toContain('existing');
    expect(getServerConfig('existing')?.serverUrl).toBe('http://original.local');
  });

  test('importConfig overwrites with flag', () => {
    setServerConfig('existing', {
      serverUrl: 'http://original.local',
      apiToken: 'original-token',
    });

    const data = {
      version: '0.2.0',
      exportedAt: new Date().toISOString(),
      servers: {
        existing: {
          serverUrl: 'http://new.local',
          apiToken: 'new-token',
        },
      },
    };

    const result = importConfig(data, true);
    expect(result.imported).toContain('existing');
    expect(getServerConfig('existing')?.serverUrl).toBe('http://new.local');
  });
});
