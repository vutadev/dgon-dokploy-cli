import { useCallback, useMemo } from 'react';
import { useAppContext } from '../context/app-context.js';
import type { Resource } from '../../types/index.js';

// Get resource name for search
const getResourceName = (resource: Resource): string => resource.data.name;

// Get resource status for search
const getResourceStatus = (resource: Resource): string => {
  switch (resource.type) {
    case 'application':
      return resource.data.applicationStatus;
    case 'database':
      return resource.data.applicationStatus; // API uses applicationStatus for DBs
    case 'compose':
      return resource.data.composeStatus;
  }
};

/**
 * Simple fuzzy match - checks if all characters in query appear in text in order
 */
function fuzzyMatch(text: string, query: string): boolean {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  let textIndex = 0;
  for (const char of queryLower) {
    const foundIndex = textLower.indexOf(char, textIndex);
    if (foundIndex === -1) return false;
    textIndex = foundIndex + 1;
  }
  return true;
}

/**
 * Calculate match score for sorting (higher = better match)
 */
function matchScore(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match gets highest score
  if (textLower === queryLower) return 100;

  // Starts with query
  if (textLower.startsWith(queryLower)) return 80;

  // Contains query as substring
  if (textLower.includes(queryLower)) return 60;

  // Fuzzy match (characters in order)
  if (fuzzyMatch(text, query)) return 40;

  return 0;
}

/**
 * Hook to handle search/filter functionality
 * Provides fuzzy matching for projects and apps
 */
export function useSearch() {
  const {
    projects,
    apps,
    resources,
    searchQuery,
    isSearching,
    setSearchQuery,
    setIsSearching,
    activePanel,
  } = useAppContext();

  // Filter and sort projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;

    return projects
      .filter((p) => fuzzyMatch(p.name, searchQuery))
      .sort((a, b) => matchScore(b.name, searchQuery) - matchScore(a.name, searchQuery));
  }, [projects, searchQuery]);

  // Filter and sort apps by search query (searches name and status)
  const filteredApps = useMemo(() => {
    if (!searchQuery) return apps;

    return apps
      .filter((a) => {
        const nameMatch = fuzzyMatch(a.name, searchQuery);
        const statusMatch = a.applicationStatus
          ? fuzzyMatch(a.applicationStatus, searchQuery)
          : false;
        return nameMatch || statusMatch;
      })
      .sort((a, b) => matchScore(b.name, searchQuery) - matchScore(a.name, searchQuery));
  }, [apps, searchQuery]);

  // Filter and sort resources by search query (searches name, status, type)
  const filteredResources = useMemo(() => {
    if (!searchQuery) return resources;

    return resources
      .filter((r) => {
        const name = getResourceName(r);
        const status = getResourceStatus(r);
        const nameMatch = fuzzyMatch(name, searchQuery);
        const statusMatch = fuzzyMatch(status, searchQuery);
        const typeMatch = fuzzyMatch(r.type, searchQuery);
        return nameMatch || statusMatch || typeMatch;
      })
      .sort((a, b) => matchScore(getResourceName(b), searchQuery) - matchScore(getResourceName(a), searchQuery));
  }, [resources, searchQuery]);

  // Enter search mode
  const startSearch = useCallback(() => {
    setIsSearching(true);
    setSearchQuery('');
  }, [setIsSearching, setSearchQuery]);

  // Exit search mode
  const stopSearch = useCallback(() => {
    setIsSearching(false);
    setSearchQuery('');
  }, [setIsSearching, setSearchQuery]);

  // Update search query
  const updateQuery = useCallback(
    (query: string) => {
      setSearchQuery(query);
    },
    [setSearchQuery]
  );

  // Get items for current panel
  const currentItems = activePanel === 'sidebar' ? filteredProjects : filteredResources;

  return {
    searchQuery,
    isSearching,
    filteredProjects,
    filteredApps,
    filteredResources,
    currentItems,
    startSearch,
    stopSearch,
    updateQuery,
  };
}
