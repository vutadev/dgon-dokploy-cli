import { spawn } from 'child_process';
import type { Project, Resource, DatabaseType } from '../types/index.js';

/**
 * Database ID field mapping
 * Maps database type to the specific ID field in the Database interface
 */
const dbIdFields: Record<DatabaseType, string> = {
  postgres: 'postgresId',
  mysql: 'mysqlId',
  mongo: 'mongoId',
  redis: 'redisId',
  mariadb: 'mariadbId',
};

/**
 * Build dashboard URL based on resource type
 * URL structure: /dashboard/project/{projectId}/environment/{environmentId}/services/{serviceType}/{serviceId}
 */
function buildDashboardUrl(config: {
  serverUrl: string;
  type: 'project' | 'application' | 'database' | 'compose';
  id: string;
  projectId?: string;
  environmentId?: string;
  dbType?: DatabaseType;
}): string {
  const { serverUrl, type, id, projectId, environmentId, dbType } = config;

  // Normalize server URL (remove trailing slash)
  const baseUrl = serverUrl.replace(/\/$/, '');

  // Build URL based on resource type
  switch (type) {
    case 'project':
      // Projects don't have a detail page - open dashboard
      return `${baseUrl}/dashboard`;
    case 'application':
      if (!projectId || !environmentId) {
        throw new Error('projectId and environmentId are required for application URLs');
      }
      return `${baseUrl}/dashboard/project/${projectId}/environment/${environmentId}/services/application/${id}`;
    case 'compose':
      if (!projectId || !environmentId) {
        throw new Error('projectId and environmentId are required for compose URLs');
      }
      return `${baseUrl}/dashboard/project/${projectId}/environment/${environmentId}/services/compose/${id}`;
    case 'database':
      if (!projectId || !environmentId) {
        throw new Error('projectId and environmentId are required for database URLs');
      }
      if (!dbType) {
        throw new Error('Database type is required for database URLs');
      }
      return `${baseUrl}/dashboard/project/${projectId}/environment/${environmentId}/services/${dbType}/${id}`;
    default:
      throw new Error(`Unknown resource type: ${type}`);
  }
}

/**
 * Open URL in default browser (platform-aware)
 * Returns a promise that resolves when the browser is opened
 */
async function openInBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Determine platform-specific command
    const command = process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
      ? 'start'
      : 'xdg-open';

    // Spawn the command
    const child = spawn(command, [url], {
      detached: true,
      stdio: 'ignore',
    });

    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Browser open timed out after 5 seconds'));
    }, 5000);

    // Handle errors
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to open browser: ${error.message}`));
    });

    // Handle success
    child.on('spawn', () => {
      clearTimeout(timeout);
      child.unref(); // Allow parent to exit independently
      resolve();
    });
  });
}

/**
 * Extract database ID from database resource
 */
function getDatabaseId(dbType: DatabaseType, data: any): string | null {
  const idField = dbIdFields[dbType];
  return data[idField] || null;
}

/**
 * High-level wrapper to open a resource in the browser
 * Handles both Project and Resource types
 */
export async function openResourceInBrowser(
  serverUrl: string,
  resource: Project | Resource,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate server URL
    if (!serverUrl || !serverUrl.startsWith('http')) {
      return {
        success: false,
        error: 'Invalid server URL',
      };
    }

    let url: string;

    // Check if it's a Project (has projectId field)
    if ('projectId' in resource && 'environments' in resource) {
      // It's a Project - open first environment if available
      const project = resource as Project;
      if (project.environments && project.environments.length > 0) {
        const firstEnv = project.environments[0];
        url = `${serverUrl.replace(/\/$/, '')}/dashboard/project/${project.projectId}/environment/${firstEnv.environmentId}`;
      } else {
        // No environments - just open dashboard
        url = buildDashboardUrl({
          serverUrl,
          type: 'project',
          id: project.projectId,
        });
      }
    } else {
      // It's a Resource (discriminated union)
      const res = resource as Resource;

      switch (res.type) {
        case 'application':
          url = buildDashboardUrl({
            serverUrl,
            type: 'application',
            id: res.data.applicationId,
            projectId: res.projectId,
            environmentId: res.environmentId,
          });
          break;

        case 'compose':
          url = buildDashboardUrl({
            serverUrl,
            type: 'compose',
            id: res.data.composeId,
            projectId: res.projectId,
            environmentId: res.environmentId,
          });
          break;

        case 'database':
          const dbId = getDatabaseId(res.dbType, res.data);
          if (!dbId) {
            return {
              success: false,
              error: `Database ID not found for type: ${res.dbType}`,
            };
          }
          url = buildDashboardUrl({
            serverUrl,
            type: 'database',
            id: dbId,
            projectId: res.projectId,
            environmentId: res.environmentId,
            dbType: res.dbType,
          });
          break;

        default:
          return {
            success: false,
            error: 'Unknown resource type',
          };
      }
    }

    // Open the URL in the browser
    await openInBrowser(url);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
