import { create } from 'zustand';

interface OnlineStatusState {
  isOnline: boolean;
  toggle: () => void;
}

// Local-only for this scaffold — the real toggle should call a role-gated
// `PATCH /riders/me/status` (see docs/roadmap.md, "Rider app backend").
export const useOnlineStatusStore = create<OnlineStatusState>((set) => ({
  isOnline: false,
  toggle: () => set((s) => ({ isOnline: !s.isOnline })),
}));
