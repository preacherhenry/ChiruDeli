import { create } from 'zustand';
import type { CartItem } from '@chirudeli/shared-types';

interface CartState {
  businessId: string | null;
  businessName: string | null;
  items: CartItem[];
  /** Returns false (and leaves the cart untouched) if the item is from a
   * different business than what's already in the cart — the screen should
   * confirm with the user before calling replaceCart. */
  addItem: (businessId: string, businessName: string, item: CartItem) => boolean;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  replaceCart: (businessId: string, businessName: string, item: CartItem) => void;
  clearCart: () => void;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  businessId: null,
  businessName: null,
  items: [],

  addItem: (businessId, businessName, item) => {
    const state = get();
    if (state.businessId && state.businessId !== businessId) {
      return false;
    }
    set((s) => {
      const existingIndex = s.items.findIndex(
        (i) => i.productId === item.productId && i.addOnsLabel === item.addOnsLabel,
      );
      if (existingIndex >= 0) {
        const items = [...s.items];
        items[existingIndex] = {
          ...items[existingIndex]!,
          quantity: items[existingIndex]!.quantity + item.quantity,
        };
        return { items, businessId, businessName };
      }
      return { items: [...s.items, item], businessId, businessName };
    });
    return true;
  },

  removeItem: (productId) =>
    set((s) => {
      const items = s.items.filter((i) => i.productId !== productId);
      return items.length === 0 ? { items, businessId: null, businessName: null } : { items };
    }),

  setQuantity: (productId, quantity) =>
    set((s) => {
      if (quantity <= 0) {
        const items = s.items.filter((i) => i.productId !== productId);
        return items.length === 0 ? { items, businessId: null, businessName: null } : { items };
      }
      return { items: s.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)) };
    }),

  replaceCart: (businessId, businessName, item) => set({ businessId, businessName, items: [item] }),

  clearCart: () => set({ businessId: null, businessName: null, items: [] }),

  subtotal: () => {
    const { items } = get();
    return Math.round(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) * 100) / 100;
  },
}));
