// Global CLI options
export interface GlobalOptions {
  json?: boolean;
  quiet?: boolean;
  config?: string;
  server?: string;
  alias?: string;
}

// Single server configuration
export interface ServerConfig {
  serverUrl: string;
  apiToken: string;
  defaultProjectId?: string;
}

// Config stored in ~/.config/dokploy/config.json
export interface DokployConfig {
  currentAlias: string;
  servers: Record<string, ServerConfig>;
}

// Legacy config format (for migration)
export interface LegacyDokployConfig {
  serverUrl: string;
  apiToken: string;
  defaultProjectId?: string;
}

// Export format for config
export interface ConfigExport {
  version: string;
  exportedAt: string;
  servers: Record<string, ServerConfig>;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Environment (nested in Project)
export interface Environment {
  environmentId: string;
  name: string;
  description?: string;
  projectId: string;
  isDefault: boolean;
  createdAt: string;
  applications?: Application[];
}

// Project
export interface Project {
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  environments?: Environment[];
}

// Application
export interface Application {
  applicationId: string;
  name: string;
  appName: string;
  projectId: string;
  applicationStatus: 'idle' | 'running' | 'done' | 'error';
  buildType: 'dockerfile' | 'nixpacks' | 'buildpack' | 'heroku_buildpacks' | 'paketo_buildpacks' | 'static';
  sourceType: 'github' | 'gitlab' | 'bitbucket' | 'git' | 'docker' | 'drop';
  createdAt: string;
}

// Database types
export type DatabaseType = 'postgres' | 'mysql' | 'mongo' | 'redis' | 'mariadb';

export interface Database {
  id: string;
  name: string;
  appName: string;
  projectId: string;
  databaseStatus: 'idle' | 'running' | 'done' | 'error';
  type: DatabaseType;
  createdAt: string;
}

// Domain
export interface Domain {
  domainId: string;
  host: string;
  path?: string;
  port?: number;
  https: boolean;
  certificateType: 'none' | 'letsencrypt' | 'custom';
  applicationId?: string;
  createdAt: string;
}

// Server stats
export interface ServerStats {
  cpu: number;
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
}

// Deployment
export interface Deployment {
  deploymentId: string;
  title?: string;
  status: 'running' | 'done' | 'error';
  logPath: string;
  applicationId?: string;
  composeId?: string;
  createdAt: string;
}

// Environment variable
export interface EnvVar {
  key: string;
  value: string;
}
