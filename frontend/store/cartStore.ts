import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ICatalogItem } from "@/shared/types/content";

export type CartItem = {
  item: ICatalogItem,
  price: number,
  area: number,
  discount: number,
  color: string
}

type CartStore = {
  items: CartItem[]
  addItem: (product: CartItem) => void
  removeItem: (id: number) => void
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalPriceWithoutDiscount: () => number;
  getDiscounts: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.item.id === product.item.id);
          if (existingItem) {
            existingItem.area = product.area
            const DISCOUNTS = [0, 5, 8, 12];
            const meters = Math.floor(existingItem.area / 100);

            existingItem.discount = DISCOUNTS[meters]
            existingItem.price = product.price

            existingItem.color = product.color
            return {items: [...state.items]}
          }
          return {
            items: [...state.items, { ...product }],
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.item.id !== id),
        })),

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * ((100 - item.discount) / 100), 0);
      },

      getTotalPriceWithoutDiscount: () => {
        return get().items.reduce((total, item) => total + item.price, 0)
      },

      getDiscounts: () => {
        return get().items.reduce((total, item) => total + item.discount, 0)
      }
    }),
    {
      name: 'cart-storage',
      skipHydration: true,
    }
  )
);
