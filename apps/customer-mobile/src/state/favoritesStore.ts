import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  businessIds: string[];
  toggleBusiness: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

// Client-only for now (AsyncStorage-persisted) — syncing favorites to the
// FavoriteBusiness table via a real endpoint is tracked in docs/roadmap.md.
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      businessIds: [],
      toggleBusiness: (id) =>
        set((s) => ({
          businessIds: s.businessIds.includes(id)
            ? s.businessIds.filter((x) => x !== id)
            : [...s.businessIds, id],
        })),
      isFavorite: (id) => get().businessIds.includes(id),
    }),
    { name: 'chirudeli.favorites', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
