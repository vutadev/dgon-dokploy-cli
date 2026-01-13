import pc from 'picocolors';
import ora, { type Ora } from 'ora';
import { Table } from 'console-table-printer';

let quietMode = false;
let jsonMode = false;

export function setOutputMode(options: { quiet?: boolean; json?: boolean }) {
  if (options.quiet) quietMode = true;
  if (options.json) jsonMode = true;
}

export function isQuiet(): boolean {
  return quietMode;
}

export function isJson(): boolean {
  return jsonMode;
}

// Spinner utilities
export function spinner(text: string): Ora {
  if (quietMode || jsonMode) {
    return {
      start: () => ({ succeed: () => {}, fail: () => {}, stop: () => {} }),
      succeed: () => {},
      fail: () => {},
      stop: () => {},
    } as unknown as Ora;
  }
  return ora(text);
}

// Colored output
export function success(message: string): void {
  if (jsonMode) return;
  console.log(pc.green(`✓ ${message}`));
}

export function error(message: string): void {
  if (jsonMode) {
    console.log(JSON.stringify({ error: message }));
    return;
  }
  console.error(pc.red(`✗ ${message}`));
}

export function warn(message: string): void {
  if (jsonMode) return;
  console.log(pc.yellow(`⚠ ${message}`));
}

export function info(message: string): void {
  if (jsonMode) return;
  console.log(pc.blue(`ℹ ${message}`));
}

export function dim(message: string): void {
  if (jsonMode) return;
  console.log(pc.dim(message));
}

// JSON output
export function json<T>(data: T): void {
  console.log(JSON.stringify(data, null, 2));
}

// Table output
export function table<T>(
  data: T[],
  columns?: { name: string; key: keyof T; color?: string }[]
): void {
  if (jsonMode) {
    json(data);
    return;
  }

  if (data.length === 0) {
    dim('No data to display');
    return;
  }

  const t = new Table();

  if (columns) {
    data.forEach(row => {
      const rowData: Record<string, unknown> = {};
      columns.forEach(col => {
        rowData[col.name] = row[col.key as keyof T];
      });
      t.addRow(rowData);
    });
  } else {
    data.forEach(row => t.addRow(row as Record<string, unknown>));
  }

  t.printTable();
}

// Formatted key-value output
export function keyValue(data: Record<string, unknown>): void {
  if (jsonMode) {
    json(data);
    return;
  }

  const maxKeyLength = Math.max(...Object.keys(data).map(k => k.length));

  Object.entries(data).forEach(([key, value]) => {
    const paddedKey = key.padEnd(maxKeyLength);
    console.log(`${pc.bold(paddedKey)}  ${value}`);
  });
}
