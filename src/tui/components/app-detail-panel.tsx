import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppContext, type DetailData } from '../context/app-context.js';
import type { ApplicationFull, DatabaseFull, ComposeFull, DatabaseType } from '../../types/index.js';

/**
 * Read-only detail panel showing resource information
 * Tab navigation with arrow keys, Escape to close
 * Supports applications, databases, and compose
 */
export function AppDetailPanel() {
  const { showDetailPanel, detailData, setShowDetailPanel } = useAppContext();
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Get tabs based on resource type
  const tabs = detailData ? getTabsForResource(detailData) : [];

  useInput(
    (input, key) => {
      if (!showDetailPanel) return;

      if (key.escape) {
        setShowDetailPanel(false);
        return;
      }

      // Tab navigation
      if (key.leftArrow || input === 'h') {
        setActiveTabIndex(Math.max(0, activeTabIndex - 1));
      }
      if (key.rightArrow || input === 'l') {
        setActiveTabIndex(Math.min(tabs.length - 1, activeTabIndex + 1));
      }
    },
    { isActive: showDetailPanel }
  );

  if (!showDetailPanel || !detailData) return null;

  const activeTab = tabs[activeTabIndex] || tabs[0];
  const name = getResourceName(detailData);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      width="100%"
      height={16}
    >
      {/* Header */}
      <Box paddingX={1} justifyContent="space-between">
        <Box gap={1}>
          <Text bold color="cyan">{name}</Text>
          <Text dimColor>({detailData.type})</Text>
        </Box>
        <Text dimColor>Esc to close</Text>
      </Box>

      {/* Tabs */}
      <Box paddingX={1} gap={2}>
        {tabs.map((tab, idx) => (
          <Text
            key={tab}
            bold={idx === activeTabIndex}
            color={idx === activeTabIndex ? 'cyan' : undefined}
            inverse={idx === activeTabIndex}
          >
            {' '}{tab.toUpperCase()}{' '}
          </Text>
        ))}
      </Box>

      {/* Content */}
      <Box flexDirection="column" paddingX={1} paddingY={1} flexGrow={1}>
        <TabContent detailData={detailData} activeTab={activeTab} />
      </Box>
    </Box>
  );
}

// Get tabs based on resource type
function getTabsForResource(data: DetailData): string[] {
  switch (data.type) {
    case 'application':
      return ['general', 'env', 'domains', 'deployments'];
    case 'database':
      return ['general', 'connection', 'env', 'mounts'];
    case 'compose':
      return ['general', 'env', 'domains', 'deployments'];
  }
}

// Default internal ports for database types
const dbDefaultPorts: Record<DatabaseType, number> = {
  postgres: 5432,
  mysql: 3306,
  mariadb: 3306,
  mongo: 27017,
  redis: 6379,
};

// Build connection URL for database
function buildConnectionUrl(db: DatabaseFull, dbType: DatabaseType, external: boolean): string {
  const port = external && db.externalPort ? db.externalPort : dbDefaultPorts[dbType];
  const host = external ? 'localhost' : db.appName;

  switch (dbType) {
    case 'postgres':
      return `postgresql://${db.databaseUser}:***@${host}:${port}/${db.databaseName}`;
    case 'mysql':
    case 'mariadb':
      return `mysql://${db.databaseUser}:***@${host}:${port}/${db.databaseName}`;
    case 'mongo':
      return `mongodb://${db.databaseUser}:***@${host}:${port}/${db.databaseName}`;
    case 'redis':
      return `redis://${host}:${port}`;
  }
}

// Get resource name
function getResourceName(data: DetailData): string {
  return data.data.name;
}

// Tab content dispatcher
function TabContent({ detailData, activeTab }: { detailData: DetailData; activeTab: string }) {
  switch (detailData.type) {
    case 'application':
      return <AppTabContent app={detailData.data} activeTab={activeTab} />;
    case 'database':
      return <DatabaseTabContent db={detailData.data} dbType={detailData.dbType} activeTab={activeTab} />;
    case 'compose':
      return <ComposeTabContent compose={detailData.data} activeTab={activeTab} />;
  }
}

// Application tab content
function AppTabContent({ app, activeTab }: { app: ApplicationFull; activeTab: string }) {
  switch (activeTab) {
    case 'general':
      return (
        <Box flexDirection="column">
          <Text>ID: <Text dimColor>{app.applicationId}</Text></Text>
          <Text>Status: <Text color={app.applicationStatus === 'running' ? 'green' : 'yellow'}>{app.applicationStatus}</Text></Text>
          <Text>Build: <Text dimColor>{app.buildType}</Text></Text>
          <Text>Source: <Text dimColor>{app.sourceType}</Text></Text>
          <Text>Replicas: <Text dimColor>{app.replicas}</Text></Text>
        </Box>
      );
    case 'env':
      return <EnvTab env={app.env} />;
    case 'domains':
      return <DomainsTab domains={app.domains || []} />;
    case 'deployments':
      return <DeploymentsTab deployments={app.deployments || []} />;
    default:
      return null;
  }
}

// Database tab content
function DatabaseTabContent({ db, dbType, activeTab }: { db: DatabaseFull; dbType: DatabaseType; activeTab: string }) {
  const internalPort = dbDefaultPorts[dbType];

  switch (activeTab) {
    case 'general':
      return (
        <Box flexDirection="column">
          <Text>Type: <Text color="magenta">{dbType}</Text></Text>
          <Text>Status: <Text color={db.applicationStatus === 'done' ? 'green' : 'yellow'}>{db.applicationStatus}</Text></Text>
          <Text>Image: <Text dimColor>{db.dockerImage || 'default'}</Text></Text>
          <Text>Replicas: <Text dimColor>{db.replicas}</Text></Text>
        </Box>
      );
    case 'connection':
      return (
        <Box flexDirection="column">
          {db.databaseName && <Text>Database: <Text dimColor>{db.databaseName}</Text></Text>}
          {db.databaseUser && <Text>Username: <Text dimColor>{db.databaseUser}</Text></Text>}
          {db.databasePassword && <Text>Password: <Text dimColor>{db.databasePassword}</Text></Text>}
          <Text>Internal Port: <Text dimColor>{internalPort}</Text></Text>
          <Text>External Port: <Text dimColor>{db.externalPort || '(not exposed)'}</Text></Text>
          <Text>Internal URL: <Text dimColor>{buildConnectionUrl(db, dbType, false)}</Text></Text>
          {db.externalPort && <Text>External URL: <Text dimColor>{buildConnectionUrl(db, dbType, true)}</Text></Text>}
        </Box>
      );
    case 'env':
      return <EnvTab env={db.env} />;
    case 'mounts':
      return <MountsTab mounts={db.mounts || []} />;
    default:
      return null;
  }
}

// Compose tab content
function ComposeTabContent({ compose, activeTab }: { compose: ComposeFull; activeTab: string }) {
  switch (activeTab) {
    case 'general':
      return (
        <Box flexDirection="column">
          <Text>ID: <Text dimColor>{compose.composeId}</Text></Text>
          <Text>Status: <Text color={compose.composeStatus === 'running' ? 'green' : 'yellow'}>{compose.composeStatus}</Text></Text>
          <Text>Type: <Text dimColor>{compose.composeType}</Text></Text>
          <Text>Source: <Text dimColor>{compose.sourceType}</Text></Text>
          {compose.composePath && <Text>Path: <Text dimColor>{compose.composePath}</Text></Text>}
          {compose.repository && <Text>Repo: <Text dimColor>{compose.repository}</Text></Text>}
        </Box>
      );
    case 'env':
      return <EnvTab env={compose.env} />;
    case 'domains':
      return <DomainsTab domains={compose.domains || []} />;
    case 'deployments':
      return <DeploymentsTab deployments={compose.deployments || []} />;
    default:
      return null;
  }
}

// Shared components
function EnvTab({ env }: { env: string | null }) {
  const lines = (env || '').split('\n').filter(Boolean);
  return (
    <Box flexDirection="column">
      <Text dimColor>{lines.length} variable(s)</Text>
      {lines.slice(0, 8).map((line: string, i: number) => {
        const [key] = line.split('=');
        return <Text key={i}>{key}=***</Text>;
      })}
      {lines.length > 8 && <Text dimColor>... and {lines.length - 8} more</Text>}
    </Box>
  );
}

function DomainsTab({ domains }: { domains: Array<{ host: string; path?: string; https: boolean }> }) {
  return (
    <Box flexDirection="column">
      {domains.length === 0 ? (
        <Text dimColor>(no domains)</Text>
      ) : (
        domains.slice(0, 6).map((d, i: number) => (
          <Text key={i}>
            {d.https ? 'https' : 'http'}://{d.host}{d.path || ''}
          </Text>
        ))
      )}
    </Box>
  );
}

function DeploymentsTab({ deployments }: { deployments: Array<{ status: string; createdAt: string }> }) {
  return (
    <Box flexDirection="column">
      {deployments.length === 0 ? (
        <Text dimColor>(no deployments)</Text>
      ) : (
        deployments.slice(0, 6).map((d, i: number) => (
          <Text key={i}>
            <Text color={d.status === 'done' ? 'green' : d.status === 'error' ? 'red' : 'yellow'}>
              {d.status.padEnd(8)}
            </Text>
            <Text dimColor>{d.createdAt}</Text>
          </Text>
        ))
      )}
    </Box>
  );
}

function MountsTab({ mounts }: { mounts: Array<{ type: string; mountPath: string; hostPath?: string }> }) {
  return (
    <Box flexDirection="column">
      {mounts.length === 0 ? (
        <Text dimColor>(no mounts)</Text>
      ) : (
        mounts.slice(0, 6).map((m, i: number) => (
          <Text key={i}>
            <Text dimColor>[{m.type}]</Text> {m.mountPath}
            {m.hostPath && <Text dimColor> ← {m.hostPath}</Text>}
          </Text>
        ))
      )}
    </Box>
  );
}
