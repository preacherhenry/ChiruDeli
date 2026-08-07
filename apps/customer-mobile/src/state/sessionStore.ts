import { create } from 'zustand';
import type { SessionUser } from '@chirudeli/shared-types';
import { secureTokenStorage } from '../lib/secureTokenStorage';

interface SessionState {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: SessionUser | null;
  hasSeenOnboarding: boolean;
  hydrate: () => Promise<void>;
  setSignedIn: (user: SessionUser) => void;
  setSignedOut: () => void;
  completeOnboarding: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  user: null,
  hasSeenOnboarding: false,
  hydrate: async () => {
    const token = await secureTokenStorage.getAccessToken();
    set({ status: token ? 'signedIn' : 'signedOut' });
  },
  setSignedIn: (user) => set({ status: 'signedIn', user }),
  setSignedOut: () => set({ status: 'signedOut', user: null }),
  completeOnboarding: () => set({ hasSeenOnboarding: true }),
}));
