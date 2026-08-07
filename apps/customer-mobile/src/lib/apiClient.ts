import { ApiClient } from '@chirudeli/api-client';
import { secureTokenStorage } from './secureTokenStorage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? API_URL;
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export const apiClient = new ApiClient({ baseUrl: API_URL, tokenStorage: secureTokenStorage });
