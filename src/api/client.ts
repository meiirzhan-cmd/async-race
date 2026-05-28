import { BASE_URL } from '../constants/api';
import type { PaginatedResult } from '../types/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  queryParams?: Record<string, string | number>;
  signal?: AbortSignal;
}

function buildUrl(endpoint: string, queryParams?: Record<string, string | number>): string {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, queryParams, signal } = options;
  const url = buildUrl(endpoint, queryParams);

  const headers: HeadersInit = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    throw new ApiError(response.statusText, response.status);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function apiPaginatedRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<PaginatedResult<T>> {
  const { method = 'GET', queryParams, signal } = options;
  const url = buildUrl(endpoint, queryParams);

  const response = await fetch(url, { method, signal });

  if (!response.ok) {
    throw new ApiError(response.statusText, response.status);
  }

  const data = (await response.json()) as T[];
  const totalCount = Number(response.headers.get('X-Total-Count') ?? data.length);
  return { data, totalCount };
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
