import { describe, it, expect } from 'bun:test';
import { compareVersions, shouldCheckForUpdate, detectPackageManager, getInstallCommand } from '../lib/update-checker.js';

describe('update-checker', () => {
  describe('compareVersions', () => {
    it('returns 1 when first version is higher', () => {
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    });

    it('returns -1 when first version is lower', () => {
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.9.9', '2.0.0')).toBe(-1);
    });

    it('returns 0 when versions are equal', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('0.0.1', '0.0.1')).toBe(0);
    });

    it('handles missing parts', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1', '1.0.0')).toBe(0);
    });
  });

  describe('shouldCheckForUpdate', () => {
    const DAY_MS = 24 * 60 * 60 * 1000;

    it('returns false when auto check is disabled', () => {
      expect(shouldCheckForUpdate(0, false)).toBe(false);
      expect(shouldCheckForUpdate(Date.now() - DAY_MS * 2, false)).toBe(false);
    });

    it('returns true when cooldown has passed', () => {
      const oldTimestamp = Date.now() - DAY_MS - 1000;
      expect(shouldCheckForUpdate(oldTimestamp, true)).toBe(true);
    });

    it('returns false when within cooldown', () => {
      const recentTimestamp = Date.now() - DAY_MS / 2;
      expect(shouldCheckForUpdate(recentTimestamp, true)).toBe(false);
    });

    it('returns true when never checked before', () => {
      expect(shouldCheckForUpdate(0, true)).toBe(true);
    });
  });

  describe('detectPackageManager', () => {
    it('detects npm by default', () => {
      const original = process.env.npm_config_user_agent;
      delete process.env.npm_config_user_agent;
      expect(detectPackageManager()).toBe('npm');
      process.env.npm_config_user_agent = original;
    });
  });

  describe('getInstallCommand', () => {
    it('returns correct command for each package manager', () => {
      expect(getInstallCommand('npm')).toBe('npm install -g dokploy-cli@latest');
      expect(getInstallCommand('yarn')).toBe('yarn global add dokploy-cli@latest');
      expect(getInstallCommand('pnpm')).toBe('pnpm add -g dokploy-cli@latest');
      expect(getInstallCommand('bun')).toBe('bun add -g dokploy-cli@latest');
    });
  });
});
