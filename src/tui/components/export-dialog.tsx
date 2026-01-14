import { Box, Text, useInput } from 'ink';
import { useState, useMemo, useEffect } from 'react';
import { MultiSelectList } from './multi-select-list.js';
import { PathInput } from './path-input.js';
import { useExport } from '../hooks/use-export.js';
import { useMultiSelect } from '../hooks/use-multi-select.js';
import { usePathInput } from '../hooks/use-path-input.js';
import { useAppContext } from '../context/app-context.js';

/**
 * Export dialog with two-step process:
 * 1. Select services to export (multi-select)
 * 2. Enter output file path
 */
export function ExportDialog() {
  const { activeProject, exportStep, setExportStep } = useAppContext();
  const {
    showExportDialog,
    closeExportDialog,
    getExportableResources,
    executeExport,
  } = useExport();

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Reset state when dialog is opened
  useEffect(() => {
    if (showExportDialog && exportStep === 'select') {
      setSelectedServiceIds([]);
    }
  }, [showExportDialog, exportStep]);

  // Prepare items for multi-select
  const exportableResources = useMemo(() => getExportableResources(), [getExportableResources]);
  const multiSelectItems = useMemo(
    () =>
      exportableResources.map(r => ({
        id: r.id,
        label: `${r.name} (${r.dbType || r.type})`,
        data: r,
      })),
    [exportableResources]
  );

  // Multi-select hook
  const multiSelect = useMultiSelect({
    items: multiSelectItems,
    initialSelected: multiSelectItems.map(i => i.id), // Select all by default
  });

  // Path input hook
  const defaultPath = activeProject
    ? `./${activeProject.name}-export.json`
    : './project-export.json';
  const pathInput = usePathInput({
    initialValue: defaultPath,
    mode: 'export',
  });

  // Handle step 1: service selection
  useInput(
    (_input, key) => {
      if (!showExportDialog || exportStep !== 'select') return;

      if (key.escape) {
        closeExportDialog();
      } else if (key.return) {
        // Move to path step
        const selected = multiSelect.getSelected();
        if (selected.length === 0) {
          // No services selected, show error
          return;
        }
        setSelectedServiceIds(selected.map(s => s.id));
        setExportStep('path');
      }
    },
    { isActive: showExportDialog && exportStep === 'select' }
  );

  // Handle step 2: path input
  useInput(
    (input, key) => {
      if (!showExportDialog || exportStep !== 'path') return;

      if (key.escape) {
        // Go back to service selection
        setExportStep('select');
      } else if (key.return) {
        // Execute export
        if (pathInput.isValid) {
          executeExport(selectedServiceIds, pathInput.normalizedPath);
        }
      } else if (key.backspace || key.delete) {
        pathInput.deleteChar();
      } else if (input && !key.ctrl && !key.meta) {
        pathInput.appendChar(input);
      }
    },
    { isActive: showExportDialog && exportStep === 'path' }
  );

  if (!showExportDialog) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      paddingX={1}
      paddingY={1}
      width="100%"
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Export Project - Step {exportStep === 'select' ? '1/2' : '2/2'}
        </Text>
      </Box>

      {/* Step 1: Service selection */}
      {exportStep === 'select' && (
        <>
          <Box marginBottom={1}>
            <Text dimColor>Select services to export:</Text>
          </Box>

          <MultiSelectList
            items={multiSelect.items}
            selectedIndex={multiSelect.selectedIndex}
            selectedCount={multiSelect.selectedCount}
            onToggle={multiSelect.toggleCurrent}
            onSelectAll={multiSelect.selectAll}
            onDeselectAll={multiSelect.deselectAll}
            onMoveUp={multiSelect.moveUp}
            onMoveDown={multiSelect.moveDown}
            maxVisible={8}
            isActive={showExportDialog}
          />

          <Box marginTop={1}>
            <Text dimColor>
              <Text color="yellow">Enter</Text> next{' '}
              <Text color="yellow">Esc</Text> cancel
            </Text>
          </Box>
        </>
      )}

      {/* Step 2: Path input */}
      {exportStep === 'path' && (
        <>
          <Box marginBottom={1}>
            <Text dimColor>
              Exporting {selectedServiceIds.length} service(s)
            </Text>
          </Box>

          <PathInput
            label="Output path"
            value={pathInput.value}
            normalizedPath={pathInput.normalizedPath}
            isValid={pathInput.isValid}
            error={pathInput.error}
            isValidating={pathInput.isValidating}
            isActive={true}
          />

          <Box marginTop={1}>
            <Text dimColor>
              <Text color="yellow">Enter</Text> export{' '}
              <Text color="yellow">Esc</Text> back
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
}
