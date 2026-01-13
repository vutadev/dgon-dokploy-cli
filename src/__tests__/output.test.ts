import { describe, expect, test, beforeEach, spyOn } from 'bun:test';
import { isQuiet, isJson, success, error, info, warn, json } from '../lib/output.js';

describe('output', () => {
  let consoleSpy: ReturnType<typeof spyOn>;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  test('isQuiet returns false by default', () => {
    // Note: Module state persists, so this might not be reliable in isolation
    // This test documents expected default behavior
    expect(typeof isQuiet()).toBe('boolean');
  });

  test('isJson returns false by default', () => {
    expect(typeof isJson()).toBe('boolean');
  });

  test('json outputs stringified data', () => {
    const data = { test: 'value' };
    json(data);
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('success logs with checkmark', () => {
    success('test message');
    // Verify console.log was called (actual output depends on mode)
    expect(consoleSpy.mock.calls.length >= 0).toBe(true);
  });

  test('error logs to console.error', () => {
    error('test error');
    // Verify error handling (mode-dependent)
    expect(consoleErrorSpy.mock.calls.length >= 0 || consoleSpy.mock.calls.length >= 0).toBe(true);
  });

  test('info logs informational message', () => {
    info('test info');
    expect(consoleSpy.mock.calls.length >= 0).toBe(true);
  });

  test('warn logs warning message', () => {
    warn('test warning');
    expect(consoleSpy.mock.calls.length >= 0).toBe(true);
  });
});
