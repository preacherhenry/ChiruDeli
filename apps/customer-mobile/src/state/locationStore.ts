import { create } from 'zustand';

interface LocationState {
  coords: { latitude: number; longitude: number } | null;
  label: string;
  permissionAsked: boolean;
  setLocation: (coords: { latitude: number; longitude: number }, label?: string) => void;
  setPermissionAsked: () => void;
}

// Chirundu Town centre — sensible default until the device grants location
// or the customer picks/adds an address.
const DEFAULT_COORDS = { latitude: -16.0334, longitude: 28.85 };

export const useLocationStore = create<LocationState>((set) => ({
  coords: DEFAULT_COORDS,
  label: 'Chirundu Town',
  permissionAsked: false,
  setLocation: (coords, label) => set({ coords, label: label ?? 'Current location' }),
  setPermissionAsked: () => set({ permissionAsked: true }),
}));
