import Conf from 'conf';
import type { Project, Application } from '../types/index.js';
import { getActiveAlias } from './config.js';

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface TUICache {
  projects: Record<string, CacheEntry<Project[]>>; // keyed by server alias
  apps: Record<string, CacheEntry<Application[]>>; // keyed by `alias:projectId`
}

const cache = new Conf<TUICache>({
  projectName: 'dokploy',
  configName: 'tui-cache',
  defaults: {
    projects: {},
    apps: {},
  },
});

/**
 * Check if cache entry is still valid
 */
function isValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Get cached projects for current server
 */
export function getCachedProjects(): Project[] | null {
  const alias = getActiveAlias();
  const projects = cache.get('projects') || {};
  const entry = projects[alias];
  return isValid(entry) ? entry.data : null;
}

/**
 * Set cached projects for current server
 */
export function setCachedProjects(data: Project[]): void {
  const alias = getActiveAlias();
  const projects = cache.get('projects') || {};
  projects[alias] = {
    data,
    timestamp: Date.now(),
  };
  cache.set('projects', projects);
}

/**
 * Get cached apps for project
 */
export function getCachedApps(projectId: string): Application[] | null {
  const alias = getActiveAlias();
  const key = `${alias}:${projectId}`;
  const apps = cache.get('apps') || {};
  const entry = apps[key];
  return isValid(entry) ? entry.data : null;
}

/**
 * Set cached apps for project
 */
export function setCachedApps(projectId: string, data: Application[]): void {
  const alias = getActiveAlias();
  const key = `${alias}:${projectId}`;
  const apps = cache.get('apps') || {};
  apps[key] = {
    data,
    timestamp: Date.now(),
  };
  cache.set('apps', apps);
}

/**
 * Invalidate all cache for current server
 */
export function invalidateServerCache(): void {
  const alias = getActiveAlias();

  // Remove projects for this alias
  const projects = cache.get('projects') || {};
  delete projects[alias];
  cache.set('projects', projects);

  // Remove apps for this alias
  const apps = cache.get('apps') || {};
  for (const key of Object.keys(apps)) {
    if (key.startsWith(`${alias}:`)) {
      delete apps[key];
    }
  }
  cache.set('apps', apps);
}

/**
 * Invalidate apps cache for a project
 */
export function invalidateAppsCache(projectId: string): void {
  const alias = getActiveAlias();
  const key = `${alias}:${projectId}`;
  const apps = cache.get('apps') || {};
  delete apps[key];
  cache.set('apps', apps);
}

/**
 * Clear entire TUI cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): { projects: number; apps: number } {
  const projects = cache.get('projects') || {};
  const apps = cache.get('apps') || {};
  return {
    projects: Object.keys(projects).length,
    apps: Object.keys(apps).length,
  };
}
