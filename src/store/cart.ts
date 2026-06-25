import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  photoUrl?: string;
}

export interface PendingAdd {
  restaurantId: number;
  restaurantName: string;
  item: Omit<CartItem, "quantity" | "notes">;
}

interface CartState {
  restaurantId: number | null;
  restaurantName: string;
  items: CartItem[];
  pending: PendingAdd | null;

  addItem: (restaurantId: number, restaurantName: string, item: Omit<CartItem, "quantity" | "notes">) => void;
  removeItem: (menuItemId: number) => void;
  setQuantity: (menuItemId: number, qty: number) => void;
  setNotes: (menuItemId: number, notes: string) => void;
  confirmSwitch: () => void;
  cancelPending: () => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: "",
      items: [],
      pending: null,

      addItem(restaurantId, restaurantName, item) {
        const state = get();
        if (state.restaurantId !== null && state.restaurantId !== restaurantId) {
          set({ pending: { restaurantId, restaurantName, item } });
          return;
        }
        const existing = state.items.find((i) => i.menuItemId === item.menuItemId);
        if (existing) {
          set({
            restaurantId,
            restaurantName,
            items: state.items.map((i) =>
              i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            restaurantId,
            restaurantName,
            items: [...state.items, { ...item, quantity: 1, notes: "" }],
          });
        }
      },

      removeItem(menuItemId) {
        const items = get().items.filter((i) => i.menuItemId !== menuItemId);
        set({ items, ...(items.length === 0 ? { restaurantId: null, restaurantName: "" } : {}) });
      },

      setQuantity(menuItemId, qty) {
        if (qty <= 0) { get().removeItem(menuItemId); return; }
        set({ items: get().items.map((i) => i.menuItemId === menuItemId ? { ...i, quantity: qty } : i) });
      },

      setNotes(menuItemId, notes) {
        set({ items: get().items.map((i) => i.menuItemId === menuItemId ? { ...i, notes } : i) });
      },

      confirmSwitch() {
        const { pending } = get();
        if (!pending) return;
        set({
          restaurantId: pending.restaurantId,
          restaurantName: pending.restaurantName,
          items: [{ ...pending.item, quantity: 1, notes: "" }],
          pending: null,
        });
      },

      cancelPending() {
        set({ pending: null });
      },

      clearCart() {
        set({ restaurantId: null, restaurantName: "", items: [], pending: null });
      },
    }),
    { name: "supido-cart" }
  )
);
