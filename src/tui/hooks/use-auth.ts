import { useCallback, useState } from 'react';
import { useAppContext } from '../context/app-context.js';
import { verifyConnection, api } from '../../lib/api.js';
import { setServerConfig, listServerAliases, setCurrentAlias } from '../../lib/config.js';
import { setCachedProjects } from '../../lib/cache.js';
import type { Project } from '../../types/index.js';

interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * Hook to manage authentication in TUI
 * Handles login form state and server authentication
 */
export function useAuth() {
  const {
    servers,
    setServers,
    setCurrentServerAlias,
    showLoginForm,
    setShowLoginForm,
    setActionMessage,
    setProjects,
    setActiveProject,
    setLoading,
  } = useAppContext();

  const [isVerifying, setIsVerifying] = useState(false);

  // Check if any server configured
  const isConfigured = servers.length > 0;

  // Open login form
  const openLoginForm = useCallback(() => {
    setShowLoginForm(true);
  }, [setShowLoginForm]);

  // Close login form
  const closeLoginForm = useCallback(() => {
    setShowLoginForm(false);
  }, [setShowLoginForm]);

  // Validate URL format
  const validateUrl = useCallback((url: string): string | null => {
    if (!url.trim()) return 'Server URL is required';
    try {
      new URL(url);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  }, []);

  // Submit login
  const login = useCallback(
    async (serverUrl: string, apiToken: string, alias: string): Promise<LoginResult> => {
      // Validate inputs
      const urlError = validateUrl(serverUrl);
      if (urlError) return { success: false, error: urlError };
      if (!apiToken.trim()) return { success: false, error: 'API token is required' };
      if (!alias.trim()) return { success: false, error: 'Alias is required' };

      setIsVerifying(true);

      try {
        // Verify connection
        const valid = await verifyConnection(serverUrl, apiToken);

        if (!valid) {
          return { success: false, error: 'Connection failed. Check URL and token.' };
        }

        // Save config
        setServerConfig(alias, { serverUrl, apiToken });
        setCurrentAlias(alias);

        // Update state
        const serverList = listServerAliases();
        setServers(serverList);
        setCurrentServerAlias(alias);

        // Close form
        setShowLoginForm(false);

        // Show success message
        setActionMessage({ text: `Connected to ${alias}`, type: 'success' });

        // Load projects after successful login
        setLoading(true);
        try {
          const projectsData = await api.get<Project[]>('/project.all');
          setProjects(projectsData);
          setCachedProjects(projectsData);
          if (projectsData.length > 0) {
            setActiveProject(projectsData[0]);
          }
        } catch {
          // Silently fail - user can manually refresh
        } finally {
          setLoading(false);
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection failed';
        return { success: false, error: message };
      } finally {
        setIsVerifying(false);
      }
    },
    [validateUrl, setServers, setCurrentServerAlias, setShowLoginForm, setActionMessage, setProjects, setActiveProject, setLoading]
  );

  return {
    isConfigured,
    isVerifying,
    showLoginForm,
    openLoginForm,
    closeLoginForm,
    login,
    validateUrl,
  };
}
