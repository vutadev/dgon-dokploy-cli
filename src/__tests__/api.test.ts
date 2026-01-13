import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { ApiError, verifyConnection } from '../lib/api.js';
import { clearConfig } from '../lib/config.js';

describe('api', () => {
  beforeEach(() => {
    clearConfig();
  });

  afterEach(() => {
    clearConfig();
  });

  test('ApiError contains message and status', () => {
    const err = new ApiError('Test error', 404);
    expect(err.message).toBe('Test error');
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe('ApiError');
  });

  test('ApiError can include response data', () => {
    const responseData = { detail: 'Not found' };
    const err = new ApiError('Test error', 404, responseData);
    expect(err.response).toEqual(responseData);
  });

  test('verifyConnection returns false for invalid server', async () => {
    // Use localhost with unlikely port to fail fast
    const result = await verifyConnection('http://127.0.0.1:59999', 'fake-token');
    expect(result).toBe(false);
  }, { timeout: 10000 });

  test('verifyConnection returns false for missing token', async () => {
    const result = await verifyConnection('http://localhost:3000', '');
    expect(result).toBe(false);
  });
});
