import { Box, Text, useInput } from 'ink';
import { useMemo } from 'react';
import { MultiSelectList } from './multi-select-list.js';
import { PathInput } from './path-input.js';
import { useImport } from '../hooks/use-import.js';
import { useMultiSelect } from '../hooks/use-multi-select.js';
import { usePathInput } from '../hooks/use-path-input.js';
import { useAppContext } from '../context/app-context.js';

/**
 * Import dialog with two-step process:
 * 1. Enter file path (with suggested files if any)
 * 2. Select services (for project exports)
 */
export function ImportDialog() {
  const { importStep, setImportStep } = useAppContext();
  const {
    showImportDialog,
    importFiles,
    importSelectedIndex,
    importableServices,
    closeImportDialog,
    selectNext,
    selectPrev,
    loadFileFromPath,
    executeProjectImport,
  } = useImport();

  // Path input for step 1
  const defaultPath = importFiles.length > 0 ? importFiles[0] : './project-export.json';
  const pathInput = usePathInput({
    initialValue: defaultPath,
    mode: 'import',
  });

  // Multi-select for service selection (step 2)
  const multiSelectItems = useMemo(
    () =>
      importableServices.map(s => ({
        id: s.id,
        label: `${s.name} (${s.dbType || s.type})`,
        data: s,
      })),
    [importableServices]
  );

  const multiSelect = useMultiSelect({
    items: multiSelectItems,
    initialSelected: multiSelectItems.map(i => i.id), // Select all by default
  });

  // Handle step 1: path input
  useInput(
    (input, key) => {
      if (!showImportDialog || importStep !== 'path') return;

      if (key.escape) {
        closeImportDialog();
      } else if (key.return) {
        // Load file from entered path
        if (pathInput.isValid) {
          loadFileFromPath(pathInput.normalizedPath);
        }
      } else if (key.downArrow && importFiles.length > 0) {
        // Navigate suggested files
        selectNext();
        const nextFile = importFiles[Math.min(importSelectedIndex + 1, importFiles.length - 1)];
        pathInput.setValue(nextFile);
      } else if (key.upArrow && importFiles.length > 0) {
        // Navigate suggested files
        selectPrev();
        const prevFile = importFiles[Math.max(importSelectedIndex - 1, 0)];
        pathInput.setValue(prevFile);
      } else if (key.backspace || key.delete) {
        pathInput.deleteChar();
      } else if (input && !key.ctrl && !key.meta) {
        pathInput.appendChar(input);
      }
    },
    { isActive: showImportDialog && importStep === 'path' }
  );

  // Handle step 2: service selection
  useInput(
    (_input, key) => {
      if (!showImportDialog || importStep !== 'select') return;

      if (key.escape) {
        // Go back to path input
        setImportStep('path');
      } else if (key.return) {
        // Execute import with selected services
        const selected = multiSelect.getSelected();
        if (selected.length > 0) {
          executeProjectImport(selected.map(s => s.id));
        }
      }
    },
    { isActive: showImportDialog && importStep === 'select' }
  );

  if (!showImportDialog) return null;

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
          Import - {importStep === 'path' ? 'Enter File Path' : 'Select Services'}
        </Text>
      </Box>

      {/* Step 1: Path input */}
      {importStep === 'path' && (
        <>
          <Box marginBottom={1}>
            <Text dimColor>Enter path to export file:</Text>
          </Box>

          <PathInput
            label="File path"
            value={pathInput.value}
            normalizedPath={pathInput.normalizedPath}
            isValid={pathInput.isValid}
            error={pathInput.error}
            isValidating={pathInput.isValidating}
            isActive={true}
          />

          {/* Show suggested files if any */}
          {importFiles.length > 0 && (
            <>
              <Box marginTop={1} marginBottom={1}>
                <Text dimColor>Suggested files (↑/↓ to select):</Text>
              </Box>
              {importFiles.slice(0, 5).map((file, i) => (
                <Box key={file}>
                  <Text dimColor>
                    {i === importSelectedIndex ? '>' : ' '} {file}
                  </Text>
                </Box>
              ))}
            </>
          )}

          <Box marginTop={1}>
            <Text dimColor>
              <Text color="yellow">Enter</Text> load{' '}
              <Text color="yellow">Esc</Text> cancel
            </Text>
          </Box>
        </>
      )}

      {/* Step 2: Service selection */}
      {importStep === 'select' && (
        <>
          <Box marginBottom={1}>
            <Text dimColor>Select services to import:</Text>
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
            isActive={showImportDialog}
          />

          <Box marginTop={1}>
            <Text dimColor>
              <Text color="yellow">Enter</Text> import{' '}
              <Text color="yellow">Esc</Text> back
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
}
