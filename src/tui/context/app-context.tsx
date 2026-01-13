import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Project, Application } from '../../types/index.js';

type Panel = 'sidebar' | 'main' | 'logs';

interface ActionMessage {
  text: string;
  type: 'success' | 'error' | 'info';
}

export interface ServerInfo {
  alias: string;
  serverUrl: string;
  isCurrent: boolean;
}

interface AppState {
  activeProject: Project | null;
  activeApp: Application | null;
  activePanel: Panel;
  projects: Project[];
  apps: Application[];
  isLoading: boolean;
  error: string | null;
  // Action state
  actionRunning: string | null; // e.g., 'deploying...', 'stopping...'
  actionMessage: ActionMessage | null;
  // Search state
  searchQuery: string;
  isSearching: boolean;
  // Server state
  servers: ServerInfo[];
  currentServerAlias: string;
  showServerSelector: boolean;
  // Login state
  showLoginForm: boolean;
}

interface AppContextValue extends AppState {
  setActiveProject: (project: Project | null) => void;
  setActiveApp: (app: Application | null) => void;
  setActivePanel: (panel: Panel) => void;
  setProjects: (projects: Project[]) => void;
  setApps: (apps: Application[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActionRunning: (action: string | null) => void;
  setActionMessage: (message: ActionMessage | null) => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (searching: boolean) => void;
  setServers: (servers: ServerInfo[]) => void;
  setCurrentServerAlias: (alias: string) => void;
  setShowServerSelector: (show: boolean) => void;
  setShowLoginForm: (show: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Global state provider for TUI
 * Manages active selections, data, and action state
 */
export function AppProvider({ children }: AppProviderProps) {
  const [state, setState] = useState<AppState>({
    activeProject: null,
    activeApp: null,
    activePanel: 'sidebar',
    projects: [],
    apps: [],
    isLoading: false,
    error: null,
    actionRunning: null,
    actionMessage: null,
    searchQuery: '',
    isSearching: false,
    servers: [],
    currentServerAlias: '',
    showServerSelector: false,
    showLoginForm: false,
  });

  // Memoized setters to prevent infinite loops in useEffect dependencies
  const setActiveProject = useCallback((project: Project | null) => setState((s) => ({ ...s, activeProject: project })), []);
  const setActiveApp = useCallback((app: Application | null) => setState((s) => ({ ...s, activeApp: app })), []);
  const setActivePanel = useCallback((panel: Panel) => setState((s) => ({ ...s, activePanel: panel })), []);
  const setProjects = useCallback((projects: Project[]) => setState((s) => ({ ...s, projects })), []);
  const setApps = useCallback((apps: Application[]) => setState((s) => ({ ...s, apps })), []);
  const setLoading = useCallback((isLoading: boolean) => setState((s) => ({ ...s, isLoading })), []);
  const setError = useCallback((error: string | null) => setState((s) => ({ ...s, error })), []);
  const setActionRunning = useCallback((actionRunning: string | null) => setState((s) => ({ ...s, actionRunning })), []);
  const setActionMessage = useCallback((actionMessage: ActionMessage | null) => setState((s) => ({ ...s, actionMessage })), []);
  const setSearchQuery = useCallback((searchQuery: string) => setState((s) => ({ ...s, searchQuery })), []);
  const setIsSearching = useCallback((isSearching: boolean) => setState((s) => ({ ...s, isSearching })), []);
  const setServers = useCallback((servers: ServerInfo[]) => setState((s) => ({ ...s, servers })), []);
  const setCurrentServerAlias = useCallback((currentServerAlias: string) => setState((s) => ({ ...s, currentServerAlias })), []);
  const setShowServerSelector = useCallback((showServerSelector: boolean) => setState((s) => ({ ...s, showServerSelector })), []);
  const setShowLoginForm = useCallback((showLoginForm: boolean) => setState((s) => ({ ...s, showLoginForm })), []);

  const value: AppContextValue = useMemo(() => ({
    ...state,
    setActiveProject,
    setActiveApp,
    setActivePanel,
    setProjects,
    setApps,
    setLoading,
    setError,
    setActionRunning,
    setActionMessage,
    setSearchQuery,
    setIsSearching,
    setServers,
    setCurrentServerAlias,
    setShowServerSelector,
    setShowLoginForm,
  }), [state, setActiveProject, setActiveApp, setActivePanel, setProjects, setApps, setLoading, setError, setActionRunning, setActionMessage, setSearchQuery, setIsSearching, setServers, setCurrentServerAlias, setShowServerSelector, setShowLoginForm]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to access app state
 */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
