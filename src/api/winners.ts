import { ENDPOINTS } from '../constants/api';
import type { Winner } from '../types/winner';
import type { PaginatedResult, WinnersQueryParams } from '../types/api';
import { apiRequest, apiPaginatedRequest, ApiError } from './client';

export function getWinners(params: WinnersQueryParams): Promise<PaginatedResult<Winner>> {
  const queryParams: Record<string, string | number> = {
    _page: params.page,
    _limit: params.limit,
  };
  if (params.sort) {
    queryParams._sort = params.sort;
    queryParams._order = params.order ?? 'ASC';
  }
  return apiPaginatedRequest<Winner>(ENDPOINTS.WINNERS, { queryParams });
}

export function getWinner(id: number): Promise<Winner | null> {
  return apiRequest<Winner>(`${ENDPOINTS.WINNERS}/${id}`).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  });
}

export function createWinner(data: Winner): Promise<Winner> {
  return apiRequest<Winner>(ENDPOINTS.WINNERS, {
    method: 'POST',
    body: data as unknown as Record<string, unknown>,
  });
}

export function updateWinner(id: number, data: { wins: number; time: number }): Promise<Winner> {
  return apiRequest<Winner>(`${ENDPOINTS.WINNERS}/${id}`, {
    method: 'PUT',
    body: data as unknown as Record<string, unknown>,
  });
}

export function deleteWinner(id: number): Promise<void> {
  return apiRequest<void>(`${ENDPOINTS.WINNERS}/${id}`).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) {
      return;
    }
    throw error;
  });
}

// Upsert: increments wins and keeps the best (lowest) time.
export async function saveWinner(id: number, time: number): Promise<void> {
  const existing = await getWinner(id);
  if (existing) {
    await updateWinner(id, {
      wins: existing.wins + 1,
      time: Math.min(existing.time, time),
    });
  } else {
    await createWinner({ id, wins: 1, time });
  }
}
