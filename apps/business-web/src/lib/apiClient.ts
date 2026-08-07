import { ApiClient } from '@chirudeli/api-client';
import { webTokenStorage } from './tokenStorage';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const apiClient = new ApiClient({ baseUrl: API_URL, tokenStorage: webTokenStorage });
