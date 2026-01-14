import { getConfig } from './config.js';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  serverUrl?: string;
  apiToken?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const config = getConfig();
  const serverUrl = options.serverUrl || config.serverUrl;
  const apiToken = options.apiToken || config.apiToken;

  if (!serverUrl || !apiToken) {
    throw new ApiError(
      'Not authenticated. Run `dokploy auth login` first.',
      401
    );
  }

  const url = `${serverUrl.replace(/\/$/, '')}/api${endpoint}`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiToken,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
    } catch {
      // Ignore JSON parse errors
    }
    throw new ApiError(errorMessage, response.status);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}

export async function verifyConnection(
  serverUrl: string,
  apiToken: string
): Promise<boolean> {
  try {
    await apiRequest('/project.all', { serverUrl, apiToken });
    return true;
  } catch {
    return false;
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  // GET with query params (for endpoints like /application.one?applicationId=xxx)
  getWithParams: <T>(endpoint: string, params: Record<string, string>) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest<T>(`${endpoint}?${queryString}`, { method: 'GET' });
  },
  post: <T>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, { method: 'PUT', body }),
  delete: <T>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, { method: 'DELETE', body }),
};
