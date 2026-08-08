import { ApiClient } from '@chirudeli/api-client';
import { secureTokenStorage } from './secureTokenStorage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? API_URL;
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
/** The store-registration form lives on business-web (see docs/roadmap.md —
 * a native registration screen isn't built this pass). */
export const BUSINESS_WEB_URL = process.env.EXPO_PUBLIC_BUSINESS_WEB_URL ?? 'http://localhost:3001';

export const apiClient = new ApiClient({ baseUrl: API_URL, tokenStorage: secureTokenStorage });
