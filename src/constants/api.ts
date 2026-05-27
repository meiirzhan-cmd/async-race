export const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const ENDPOINTS = {
  GARAGE: '/garage',
  ENGINE: '/engine',
  WINNERS: '/winners',
} as const;
