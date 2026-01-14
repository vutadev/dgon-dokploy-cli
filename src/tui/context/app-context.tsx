import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Project, Environment, Application, ApplicationFull, DatabaseFull, ComposeFull, Resource, DatabaseType } from '../../types/index.js';

// Discriminated union for detail panel data
export type DetailData =
  | { type: 'application'; data: ApplicationFull }
  | { type: 'database'; dbType: DatabaseType; data: DatabaseFull }
  | { type: 'compose'; data: ComposeFull };

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
  activeEnvironment: Environment | null;
  activeApp: Application | null;
  activeResource: Resource | null;
  activePanel: Panel;
  projects: Project[];
  apps: Application[];
  resources: Resource[];
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
  // Confirm dialog state
  showConfirm: boolean;
  confirmMessage: string;
  // Detail panel state
  showDetailPanel: boolean;
  detailApp: ApplicationFull | null;
  detailData: DetailData | null;
  // Auto-refresh state
  autoRefreshEnabled: boolean;
  // Import dialog state
  showImportDialog: boolean;
  importFiles: string[];
  importSelectedIndex: number;
  importStep: 'path' | 'select';
  // Export dialog state
  showExportDialog: boolean;
  exportStep: 'select' | 'path';
}

interface AppContextValue extends AppState {
  setActiveProject: (project: Project | null) => void;
  setActiveEnvironment: (env: Environment | null) => void;
  setActiveApp: (app: Application | null) => void;
  setActiveResource: (resource: Resource | null) => void;
  setActivePanel: (panel: Panel) => void;
  setProjects: (projects: Project[]) => void;
  setApps: (apps: Application[]) => void;
  setResources: (resources: Resource[]) => void;
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
  setShowConfirm: (show: boolean) => void;
  setConfirmMessage: (message: string) => void;
  setShowDetailPanel: (show: boolean) => void;
  setDetailApp: (app: ApplicationFull | null) => void;
  setDetailData: (data: DetailData | null) => void;
  setAutoRefreshEnabled: (enabled: boolean) => void;
  setShowImportDialog: (show: boolean) => void;
  setImportFiles: (files: string[]) => void;
  setImportSelectedIndex: (index: number) => void;
  setImportStep: (step: 'path' | 'select') => void;
  setShowExportDialog: (show: boolean) => void;
  setExportStep: (step: 'select' | 'path') => void;
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
    activeEnvironment: null,
    activeApp: null,
    activeResource: null,
    activePanel: 'sidebar',
    projects: [],
    apps: [],
    resources: [],
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
    showConfirm: false,
    confirmMessage: '',
    showDetailPanel: false,
    detailApp: null,
    detailData: null,
    autoRefreshEnabled: true,
    showImportDialog: false,
    importFiles: [],
    importSelectedIndex: 0,
    importStep: 'path',
    showExportDialog: false,
    exportStep: 'select',
  });

  // Memoized setters to prevent infinite loops in useEffect dependencies
  const setActiveProject = useCallback((project: Project | null) => setState((s) => ({ ...s, activeProject: project })), []);
  const setActiveEnvironment = useCallback((env: Environment | null) => setState((s) => ({ ...s, activeEnvironment: env })), []);
  const setActiveApp = useCallback((app: Application | null) => setState((s) => ({ ...s, activeApp: app })), []);
  const setActiveResource = useCallback((resource: Resource | null) => setState((s) => ({ ...s, activeResource: resource })), []);
  const setActivePanel = useCallback((panel: Panel) => setState((s) => ({ ...s, activePanel: panel })), []);
  const setProjects = useCallback((projects: Project[]) => setState((s) => ({ ...s, projects })), []);
  const setApps = useCallback((apps: Application[]) => setState((s) => ({ ...s, apps })), []);
  const setResources = useCallback((resources: Resource[]) => setState((s) => ({ ...s, resources })), []);
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
  const setShowConfirm = useCallback((showConfirm: boolean) => setState((s) => ({ ...s, showConfirm })), []);
  const setConfirmMessage = useCallback((confirmMessage: string) => setState((s) => ({ ...s, confirmMessage })), []);
  const setShowDetailPanel = useCallback((showDetailPanel: boolean) => setState((s) => ({ ...s, showDetailPanel })), []);
  const setDetailApp = useCallback((detailApp: ApplicationFull | null) => setState((s) => ({ ...s, detailApp })), []);
  const setDetailData = useCallback((detailData: DetailData | null) => setState((s) => ({ ...s, detailData })), []);
  const setAutoRefreshEnabled = useCallback((autoRefreshEnabled: boolean) => setState((s) => ({ ...s, autoRefreshEnabled })), []);
  const setShowImportDialog = useCallback((showImportDialog: boolean) => setState((s) => ({ ...s, showImportDialog })), []);
  const setImportFiles = useCallback((importFiles: string[]) => setState((s) => ({ ...s, importFiles })), []);
  const setImportSelectedIndex = useCallback((importSelectedIndex: number) => setState((s) => ({ ...s, importSelectedIndex })), []);
  const setImportStep = useCallback((importStep: 'path' | 'select') => setState((s) => ({ ...s, importStep })), []);
  const setShowExportDialog = useCallback((showExportDialog: boolean) => setState((s) => ({ ...s, showExportDialog })), []);
  const setExportStep = useCallback((exportStep: 'select' | 'path') => setState((s) => ({ ...s, exportStep })), []);

  const value: AppContextValue = useMemo(() => ({
    ...state,
    setActiveProject,
    setActiveEnvironment,
    setActiveApp,
    setActiveResource,
    setActivePanel,
    setProjects,
    setApps,
    setResources,
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
    setShowConfirm,
    setConfirmMessage,
    setShowDetailPanel,
    setDetailApp,
    setDetailData,
    setAutoRefreshEnabled,
    setShowImportDialog,
    setImportFiles,
    setImportSelectedIndex,
    setImportStep,
    setShowExportDialog,
    setExportStep,
  }), [state, setActiveProject, setActiveEnvironment, setActiveApp, setActiveResource, setActivePanel, setProjects, setApps, setResources, setLoading, setError, setActionRunning, setActionMessage, setSearchQuery, setIsSearching, setServers, setCurrentServerAlias, setShowServerSelector, setShowLoginForm, setShowConfirm, setConfirmMessage, setShowDetailPanel, setDetailApp, setDetailData, setAutoRefreshEnabled, setShowImportDialog, setImportFiles, setImportSelectedIndex, setImportStep, setShowExportDialog, setExportStep]);

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
