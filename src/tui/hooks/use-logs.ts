import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../context/app-context.js';
import { api } from '../../lib/api.js';

interface LogLine {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

/**
 * Hook to fetch and manage application logs
 * Polls for new logs when viewing logs panel
 */
export function useLogs() {
  const { activeApp, activePanel } = useAppContext();
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!activeApp) {
      setLogs([]);
      return;
    }

    setIsLoading(true);
    try {
      // Try to get logs from deployment endpoint
      // Note: Actual log content would need a specific logs endpoint
      // For now, we show deployment status as log entries
      const deployments = await api.getWithParams<Array<{
        deploymentId: string;
        status: string;
        createdAt: string;
        title?: string;
      }>>('/deployment.all', {
        applicationId: activeApp.applicationId,
      });

      const logLines: LogLine[] = deployments.slice(0, 10).map((d) => ({
        timestamp: new Date(d.createdAt).toLocaleTimeString(),
        message: `[${d.status.toUpperCase()}] ${d.title || 'Deployment'} - ${d.deploymentId.slice(0, 8)}`,
        level: d.status === 'error' ? 'error' : d.status === 'running' ? 'warn' : 'info',
      }));

      setLogs(logLines);
    } catch {
      setLogs([{
        timestamp: new Date().toLocaleTimeString(),
        message: 'Failed to fetch logs',
        level: 'error',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [activeApp?.applicationId]);

  // Start/stop polling based on panel
  useEffect(() => {
    if (activePanel === 'logs' && activeApp) {
      fetchLogs();
      pollRef.current = setInterval(fetchLogs, 5000);
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [activePanel, activeApp?.applicationId, fetchLogs]);

  const toggleAutoScroll = useCallback(() => {
    setAutoScroll((prev) => !prev);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    isLoading,
    autoScroll,
    toggleAutoScroll,
    clearLogs,
    refresh: fetchLogs,
  };
}
