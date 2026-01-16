import { homedir } from 'os';
import { join } from 'path';
import { mkdir } from 'fs/promises';

// Base directory for all dokploy CLI data
export const DOKPLOY_DIR = join(homedir(), '.dokploy');

// Config file path
export const CONFIG_DIR = DOKPLOY_DIR;

// Directory for export/import files
export const EXPORTS_DIR = join(DOKPLOY_DIR, 'exports');

/**
 * Get default export file path for a given name
 */
export function getDefaultExportPath(name: string): string {
  const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '-');
  return join(EXPORTS_DIR, `${safeName}-export.json`);
}

/**
 * Get default config export file path
 */
export function getConfigExportPath(): string {
  return join(EXPORTS_DIR, 'servers-config.json');
}

/**
 * Ensure dokploy directories exist
 */
export async function ensureDokployDirs(): Promise<void> {
  await mkdir(DOKPLOY_DIR, { recursive: true });
  await mkdir(EXPORTS_DIR, { recursive: true });
}
