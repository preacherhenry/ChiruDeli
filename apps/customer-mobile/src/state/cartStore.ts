import { create } from 'zustand';
import type { CartItem, CartStore as CartStoreGroup } from '@chirudeli/shared-types';

interface CartState {
  /** Items from any number of businesses can sit in the cart at once —
   * customers browse and add from as many stores as they like without ever
   * clearing or switching carts (see docs/architecture.md, "Multi-store
   * cart & order splitting"). */
  stores: CartStoreGroup[];
  addItem: (businessId: string, businessName: string, item: CartItem) => void;
  removeItem: (businessId: string, productId: string) => void;
  setQuantity: (businessId: string, productId: string, quantity: number) => void;
  clearStore: (businessId: string) => void;
  clearCart: () => void;
  totalItemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  stores: [],

  addItem: (businessId, businessName, item) =>
    set((s) => {
      const storeIndex = s.stores.findIndex((store) => store.businessId === businessId);
      if (storeIndex === -1) {
        return { stores: [...s.stores, { businessId, businessName, items: [item] }] };
      }

      const store = s.stores[storeIndex]!;
      const itemIndex = store.items.findIndex(
        (i) => i.productId === item.productId && i.addOnsLabel === item.addOnsLabel,
      );
      const items =
        itemIndex >= 0
          ? store.items.map((i, idx) => (idx === itemIndex ? { ...i, quantity: i.quantity + item.quantity } : i))
          : [...store.items, item];

      const stores = [...s.stores];
      stores[storeIndex] = { ...store, items };
      return { stores };
    }),

  removeItem: (businessId, productId) =>
    set((s) => {
      const stores = s.stores
        .map((store) =>
          store.businessId === businessId
            ? { ...store, items: store.items.filter((i) => i.productId !== productId) }
            : store,
        )
        .filter((store) => store.items.length > 0);
      return { stores };
    }),

  setQuantity: (businessId, productId, quantity) =>
    set((s) => {
      if (quantity <= 0) {
        const stores = s.stores
          .map((store) =>
            store.businessId === businessId
              ? { ...store, items: store.items.filter((i) => i.productId !== productId) }
              : store,
          )
          .filter((store) => store.items.length > 0);
        return { stores };
      }
      const stores = s.stores.map((store) =>
        store.businessId === businessId
          ? { ...store, items: store.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)) }
          : store,
      );
      return { stores };
    }),

  clearStore: (businessId) => set((s) => ({ stores: s.stores.filter((store) => store.businessId !== businessId) })),

  clearCart: () => set({ stores: [] }),

  totalItemCount: () => get().stores.reduce((sum, store) => sum + store.items.reduce((n, i) => n + i.quantity, 0), 0),

  subtotal: () => {
    const total = get().stores.reduce(
      (sum, store) => sum + store.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      0,
    );
    return Math.round(total * 100) / 100;
  },
}));
