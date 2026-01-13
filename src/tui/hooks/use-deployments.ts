import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/app-context.js';
import { api } from '../../lib/api.js';
import type { Deployment } from '../../types/index.js';

/**
 * Hook to fetch deployments for the active app
 * Used for log viewing and deployment status
 */
export function useDeployments() {
  const { activeApp } = useAppContext();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDeployments = useCallback(async () => {
    if (!activeApp) {
      setDeployments([]);
      return [];
    }

    setIsLoading(true);
    try {
      const data = await api.post<Deployment[]>('/deployment.all', {
        applicationId: activeApp.applicationId,
      });
      setDeployments(data);
      return data;
    } catch {
      setDeployments([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [activeApp?.applicationId]);

  // Load when app changes
  useEffect(() => {
    if (activeApp) {
      loadDeployments();
    } else {
      setDeployments([]);
    }
  }, [activeApp?.applicationId]);

  const latestDeployment = deployments[0] || null;

  return {
    deployments,
    latestDeployment,
    isLoading,
    refresh: loadDeployments,
  };
}
