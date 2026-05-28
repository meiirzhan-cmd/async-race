import { ENDPOINTS } from '../constants/api';
import type { EngineResponse, DriveResponse } from '../types/engine';
import { apiRequest, ApiError } from './client';

export function startEngine(id: number): Promise<EngineResponse> {
  return apiRequest<EngineResponse>(ENDPOINTS.ENGINE, {
    method: 'PATCH',
    queryParams: { id, status: 'started' },
  });
}

export function stopEngine(id: number): Promise<EngineResponse> {
  return apiRequest<EngineResponse>(ENDPOINTS.ENGINE, {
    method: 'PATCH',
    queryParams: { id, status: 'stopped' },
  });
}

// Returns { success: false } on 500 (engine breakdown) instead of throwing,
// since engine failure is an expected race outcome, not an error.
export async function driveMode(id: number, signal?: AbortSignal): Promise<DriveResponse> {
  try {
    return await apiRequest<DriveResponse>(ENDPOINTS.ENGINE, {
      method: 'PATCH',
      queryParams: { id, status: 'drive' },
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 500) {
      return { success: false };
    }
    throw error;
  }
}
