import { create } from 'zustand';
import type { SessionUser } from '@chirudeli/shared-types';
import { webTokenStorage } from '../lib/tokenStorage';

interface SessionState {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: SessionUser | null;
  hydrate: () => Promise<void>;
  setSignedIn: (user: SessionUser) => void;
  setSignedOut: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  user: null,
  hydrate: async () => {
    const token = await webTokenStorage.getAccessToken();
    set({ status: token ? 'signedIn' : 'signedOut' });
  },
  setSignedIn: (user) => set({ status: 'signedIn', user }),
  setSignedOut: () => set({ status: 'signedOut', user: null }),
}));
