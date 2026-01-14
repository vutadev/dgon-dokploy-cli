import { useState, useCallback } from 'react';

export interface MultiSelectItem<T = unknown> {
  id: string;
  label: string;
  data: T;
  selected: boolean;
}

interface UseMultiSelectOptions<T> {
  items: Array<{ id: string; label: string; data: T }>;
  initialSelected?: string[];
}

export interface UseMultiSelectReturn<T> {
  items: MultiSelectItem<T>[];
  selectedIndex: number;
  selectedCount: number;
  toggle: (id: string) => void;
  toggleCurrent: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  moveUp: () => void;
  moveDown: () => void;
  getSelected: () => Array<{ id: string; label: string; data: T }>;
}

/**
 * Hook for multi-select checkbox list with keyboard navigation
 * Space: toggle, a: select all, d: deselect all, j/k: navigate
 */
export function useMultiSelect<T = unknown>(
  options: UseMultiSelectOptions<T>
): UseMultiSelectReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(options.initialSelected || [])
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // Create items with selection state
  const items: MultiSelectItem<T>[] = options.items.map(item => ({
    ...item,
    selected: selectedIds.has(item.id),
  }));

  const selectedCount = selectedIds.size;

  // Toggle selection for specific ID
  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle current item
  const toggleCurrent = useCallback(() => {
    if (items.length === 0) return;
    toggle(items[currentIndex].id);
  }, [currentIndex, items, toggle]);

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(options.items.map(item => item.id)));
  }, [options.items]);

  // Deselect all items
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Navigate up
  const moveUp = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  // Navigate down
  const moveDown = useCallback(() => {
    setCurrentIndex(prev => Math.min(options.items.length - 1, prev + 1));
  }, [options.items.length]);

  // Get selected items
  const getSelected = useCallback(() => {
    return items.filter(item => item.selected).map(({ id, label, data }) => ({
      id,
      label,
      data,
    }));
  }, [items]);

  return {
    items,
    selectedIndex: currentIndex,
    selectedCount,
    toggle,
    toggleCurrent,
    selectAll,
    deselectAll,
    moveUp,
    moveDown,
    getSelected,
  };
}
