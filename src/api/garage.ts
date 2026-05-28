import { ENDPOINTS } from '../constants/api';
import type { Car, CarFormData } from '../types/car';
import type { PaginatedResult } from '../types/api';
import { apiRequest, apiPaginatedRequest } from './client';

export function getCars(page: number, limit: number): Promise<PaginatedResult<Car>> {
  return apiPaginatedRequest<Car>(ENDPOINTS.GARAGE, {
    queryParams: { _page: page, _limit: limit },
  });
}

export function getCar(id: number): Promise<Car> {
  return apiRequest<Car>(`${ENDPOINTS.GARAGE}/${id}`);
}

export function createCar(data: CarFormData): Promise<Car> {
  return apiRequest<Car>(ENDPOINTS.GARAGE, {
    method: 'POST',
    body: data as unknown as Record<string, unknown>,
  });
}

export function updateCar(id: number, data: CarFormData): Promise<Car> {
  return apiRequest<Car>(`${ENDPOINTS.GARAGE}/${id}`, {
    method: 'PUT',
    body: data as unknown as Record<string, unknown>,
  });
}

export function deleteCar(id: number): Promise<void> {
  return apiRequest<void>(`${ENDPOINTS.GARAGE}/${id}`, { method: 'DELETE' });
}
