import type { TokenStorage } from '@chirudeli/api-client';

const ACCESS_KEY = 'chirudeli-admin.accessToken';
const REFRESH_KEY = 'chirudeli-admin.refreshToken';

/** See apps/business-web's equivalent file for the httpOnly-cookie note — same applies here. */
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
