import { Box, Text, useInput } from 'ink';
import type { MultiSelectItem } from '../hooks/use-multi-select.js';

interface MultiSelectListProps<T> {
  items: MultiSelectItem<T>[];
  selectedIndex: number;
  selectedCount: number;
  onToggle: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  maxVisible?: number;
  isActive?: boolean;
}

/**
 * Multi-select checkbox list with keyboard navigation
 * Space: toggle, a: select all, d: deselect all, j/k: navigate
 */
export function MultiSelectList<T>({
  items,
  selectedIndex,
  selectedCount,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onMoveUp,
  onMoveDown,
  maxVisible = 8,
  isActive = true,
}: MultiSelectListProps<T>) {
  useInput(
    (input, key) => {
      if (!isActive) return;

      if (input === ' ') {
        onToggle();
      } else if (input === 'a' || input === 'A') {
        onSelectAll();
      } else if (input === 'd' || input === 'D') {
        onDeselectAll();
      } else if (input === 'j' || key.downArrow) {
        onMoveDown();
      } else if (input === 'k' || key.upArrow) {
        onMoveUp();
      }
    },
    { isActive }
  );

  // Calculate visible range for scrolling
  const startIdx = Math.max(0, selectedIndex - Math.floor(maxVisible / 2));
  const endIdx = Math.min(items.length, startIdx + maxVisible);
  const visibleItems = items.slice(startIdx, endIdx);

  return (
    <Box flexDirection="column">
      {/* Header with count */}
      <Box marginBottom={1}>
        <Text dimColor>
          {selectedCount}/{items.length} selected
        </Text>
      </Box>

      {/* Item list */}
      {visibleItems.map((item, i) => {
        const actualIndex = startIdx + i;
        const isCurrent = actualIndex === selectedIndex;
        const checkbox = item.selected ? '[x]' : '[ ]';

        return (
          <Box key={item.id}>
            <Text
              color={isCurrent ? 'cyan' : undefined}
              inverse={isCurrent}
            >
              {isCurrent ? '>' : ' '} {checkbox} {item.label}
            </Text>
          </Box>
        );
      })}

      {/* Hint bar */}
      <Box marginTop={1}>
        <Text dimColor>
          <Text color="yellow">Space</Text> toggle{' '}
          <Text color="yellow">a</Text> all{' '}
          <Text color="yellow">d</Text> none{' '}
          <Text color="yellow">j/k</Text> move
        </Text>
      </Box>
    </Box>
  );
}
