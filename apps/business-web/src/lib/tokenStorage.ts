import type { TokenStorage } from '@chirudeli/api-client';

const ACCESS_KEY = 'chirudeli-business.accessToken';
const REFRESH_KEY = 'chirudeli-business.refreshToken';

/**
 * localStorage for now — a production deployment should move to httpOnly
 * cookies set by the API (see ApiClient's `useCookies` option) so tokens
 * aren't reachable from JS at all. Fine for this dashboard's current scope.
 */
export const webTokenStorage: TokenStorage = {
  async getAccessToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  async getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  async setTokens(accessToken, refreshToken) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACCESS_KEY, accessToken);
    window.localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  async clearTokens() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};
