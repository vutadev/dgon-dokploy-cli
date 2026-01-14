import { useCallback } from 'react';
import { useAppContext, type DetailData } from '../context/app-context.js';
import { api } from '../../lib/api.js';
import type { ApplicationFull, DatabaseFull, ComposeFull, DatabaseType } from '../../types/index.js';

// Map database types to API router prefixes
const dbRouters: Record<DatabaseType, string> = {
  postgres: 'postgres',
  mysql: 'mysql',
  mongo: 'mongo',
  redis: 'redis',
  mariadb: 'mariadb',
};

// Map database type to ID field name for API
const dbIdFields: Record<DatabaseType, string> = {
  postgres: 'postgresId',
  mysql: 'mysqlId',
  mongo: 'mongoId',
  redis: 'redisId',
  mariadb: 'mariadbId',
};

/**
 * Hook to manage resource detail panel
 * Fetches full resource data when opening panel
 * Supports applications, databases, and compose
 */
export function useDetail() {
  const {
    activeResource,
    showDetailPanel,
    setShowDetailPanel,
    setDetailApp,
    setDetailData,
    setActionRunning,
    setActionMessage,
  } = useAppContext();

  const openDetail = useCallback(async () => {
    if (!activeResource || showDetailPanel) return;

    setActionRunning('Loading details...');

    try {
      let detailData: DetailData;

      switch (activeResource.type) {
        case 'application': {
          const fullApp = await api.getWithParams<ApplicationFull>('/application.one', {
            applicationId: activeResource.data.applicationId,
          });
          detailData = { type: 'application', data: fullApp };
          // Also set detailApp for backward compatibility
          setDetailApp(fullApp);
          break;
        }
        case 'database': {
          const dbType = activeResource.dbType;
          const router = dbRouters[dbType];
          const idField = dbIdFields[dbType];
          const fullDb = await api.getWithParams<DatabaseFull>(`/${router}.one`, {
            [idField]: activeResource.data.id,
          });
          detailData = { type: 'database', dbType, data: fullDb };
          break;
        }
        case 'compose': {
          const fullCompose = await api.getWithParams<ComposeFull>('/compose.one', {
            composeId: activeResource.data.composeId,
          });
          detailData = { type: 'compose', data: fullCompose };
          break;
        }
      }

      setDetailData(detailData);
      setShowDetailPanel(true);
      setActionRunning(null);
    } catch {
      setActionRunning(null);
      setActionMessage({
        text: 'Failed to load details',
        type: 'error',
      });
    }
  }, [activeResource, showDetailPanel, setShowDetailPanel, setDetailApp, setDetailData, setActionRunning, setActionMessage]);

  const closeDetail = useCallback(() => {
    setShowDetailPanel(false);
    setDetailApp(null);
    setDetailData(null);
  }, [setShowDetailPanel, setDetailApp, setDetailData]);

  return {
    showDetailPanel,
    openDetail,
    closeDetail,
  };
}
