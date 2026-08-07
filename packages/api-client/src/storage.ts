/**
 * Token persistence differs per platform (expo-secure-store on mobile,
 * httpOnly-cookie-backed no-op here on web since the browser holds the
 * cookie for us). Each app supplies its own implementation at ApiClient
 * construction time — this package stays platform-agnostic.
 */
export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): Promise<void>;
  clearTokens(): Promise<void>;
}

export class InMemoryTokenStorage implements TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async getAccessToken() {
    return this.accessToken;
  }
  async getRefreshToken() {
    return this.refreshToken;
  }
  async setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }
}
