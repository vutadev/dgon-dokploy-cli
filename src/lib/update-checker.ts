import { VERSION } from './version.js';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/dokploy-cli/latest';
const CHECK_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

interface NpmPackageInfo {
  version: string;
  name: string;
}

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

/**
 * Fetch latest version from npm registry
 */
export async function fetchLatestVersion(): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(NPM_REGISTRY_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as NpmPackageInfo;
    return data.version;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Compare two semver strings
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

/**
 * Check if update is available
 */
export async function checkForUpdate(): Promise<{
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
}> {
  const latestVersion = await fetchLatestVersion();
  const updateAvailable = latestVersion ? compareVersions(latestVersion, VERSION) > 0 : false;

  return {
    currentVersion: VERSION,
    latestVersion,
    updateAvailable,
  };
}

/**
 * Detect package manager from environment or lockfiles
 */
export function detectPackageManager(): PackageManager {
  // Check npm_config_user_agent (set by npm/yarn/pnpm during install)
  const userAgent = process.env.npm_config_user_agent || '';

  if (userAgent.includes('yarn')) return 'yarn';
  if (userAgent.includes('pnpm')) return 'pnpm';
  if (userAgent.includes('bun')) return 'bun';

  // Default to npm
  return 'npm';
}

/**
 * Get install command for detected package manager
 */
export function getInstallCommand(pm: PackageManager = detectPackageManager()): string {
  const commands: Record<PackageManager, string> = {
    npm: 'npm install -g dokploy-cli@latest',
    yarn: 'yarn global add dokploy-cli@latest',
    pnpm: 'pnpm add -g dokploy-cli@latest',
    bun: 'bun add -g dokploy-cli@latest',
  };
  return commands[pm];
}

/**
 * Get current version
 */
export function getCurrentVersion(): string {
  return VERSION;
}

/**
 * Check if enough time has passed since last check (24h cooldown)
 */
export function shouldCheckForUpdate(lastCheckTimestamp: number, autoCheckEnabled: boolean): boolean {
  if (!autoCheckEnabled) return false;
  const now = Date.now();
  return now - lastCheckTimestamp > CHECK_COOLDOWN_MS;
}
