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

// Environment (nested in Project) - contains all resources
export interface Environment {
  environmentId: string;
  name: string;
  description?: string;
  projectId: string;
  isDefault: boolean;
  createdAt: string;
  applications?: Application[];
  compose?: Compose[];
  // Databases are inside environments
  postgres?: Database[];
  mysql?: Database[];
  mongo?: Database[];
  redis?: Database[];
  mariadb?: Database[];
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

// Database - API returns type-specific ID (postgresId, mysqlId, etc.)
export interface Database {
  postgresId?: string;
  mysqlId?: string;
  mongoId?: string;
  redisId?: string;
  mariadbId?: string;
  name: string;
  appName: string;
  applicationStatus: 'idle' | 'running' | 'done' | 'error';
  createdAt: string;
}

// Docker Compose
export interface Compose {
  composeId: string;
  name: string;
  appName: string;
  projectId: string;
  composeStatus: 'idle' | 'running' | 'done' | 'error';
  composeType: 'docker-compose' | 'stack';
  sourceType: 'github' | 'gitlab' | 'bitbucket' | 'git' | 'raw';
  createdAt: string;
}

// Resource status union type
export type ResourceStatus = 'idle' | 'running' | 'done' | 'error';

// Resource type discriminator
export type ResourceType = 'application' | 'database' | 'compose';

// Database with resolved ID for TUI
export interface DatabaseWithId extends Database {
  id: string;
  dbType: DatabaseType;
}

// Unified resource for TUI display (discriminated union)
export type Resource =
  | { type: 'application'; data: Application; projectId: string; environmentId: string }
  | { type: 'database'; dbType: DatabaseType; data: DatabaseWithId; projectId: string; environmentId: string }
  | { type: 'compose'; data: Compose; projectId: string; environmentId: string };

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

// Extended Database (from /postgres.one, /mysql.one, etc.)
export interface DatabaseFull extends Database {
  description?: string;
  env: string | null;
  dockerImage?: string;
  databaseName?: string;
  databaseUser?: string;
  databasePassword?: string;
  externalPort?: number | null;
  replicas: number;
  memoryReservation?: number;
  memoryLimit?: number;
  cpuReservation?: number;
  cpuLimit?: number;
  mounts: Mount[];
}

// Extended Compose (from /compose.one)
export interface ComposeFull extends Compose {
  description?: string;
  env: string | null;
  composeFile?: string;
  composePath?: string;
  repository?: string;
  owner?: string;
  branch?: string;
  customGitUrl?: string;
  customGitBranch?: string;
  domains: Domain[];
  deployments: Deployment[];
  mounts: Mount[];
}

// Extended Application (from /application.one)
export interface ApplicationFull extends Application {
  description?: string;
  env: string | null;
  dockerfile?: string;
  dockerImage?: string;
  username?: string;
  password?: string;
  customGitUrl?: string;
  customGitBranch?: string;
  customGitSSHKeyId?: string;
  repository?: string;
  owner?: string;
  branch?: string;
  buildPath?: string;
  publishDirectory?: string;
  command?: string;
  replicas: number;
  memoryReservation?: number;
  memoryLimit?: number;
  cpuReservation?: number;
  cpuLimit?: number;
  domains: Domain[];
  deployments: Deployment[];
  mounts: Mount[];
  ports: Port[];
  redirects: Redirect[];
  security: Security[];
}

// Mount configuration for volumes/binds
export interface Mount {
  mountId: string;
  type: 'bind' | 'volume' | 'file';
  hostPath?: string;
  mountPath: string;
  content?: string;
  serviceType?: string;
}

// Port mapping configuration
export interface Port {
  portId: string;
  publishedPort: number;
  targetPort: number;
  protocol: 'tcp' | 'udp';
}

// Redirect rule configuration
export interface Redirect {
  redirectId: string;
  regex: string;
  replacement: string;
  permanent: boolean;
}

// Basic auth security configuration
export interface Security {
  securityId: string;
  username: string;
  password: string;
}

// Backup destination (S3-compatible storage)
export interface Destination {
  destinationId: string;
  name: string;
  accessKey: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  endpoint: string;
  createdAt: string;
}

// Export format for single application
export interface AppExport {
  version: string;
  type: 'application';
  exportedAt: string;
  // Source reference (for re-import convenience)
  source?: {
    applicationId: string;
    projectId: string;
    projectName: string;
  };
  data: {
    name: string;
    description?: string;
    buildType: string;
    sourceType: string;
    env: string;
    dockerfile?: string;
    dockerImage?: string;
    replicas: number;
    domains: Omit<Domain, 'domainId' | 'applicationId' | 'createdAt'>[];
    mounts: Omit<Mount, 'mountId'>[];
    ports: Omit<Port, 'portId'>[];
  };
}

// Export format for project with all applications
export interface ProjectExport {
  version: string;
  type: 'project';
  exportedAt: string;
  data: {
    name: string;
    description?: string;
    applications: AppExport['data'][];
  };
}
