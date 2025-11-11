import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: {
    id: string;
    name: string;
    color: string | null;
  };
  trackInventory: boolean;
  quantity: number; // Available stock
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  note?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNote: (productId: string, note: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed values
  getItemCount: () => number;
  getSubtotal: () => number;
  getTax: (taxRate?: number) => number;
  getTotal: (taxRate?: number) => number;
  getItem: (productId: string) => CartItem | undefined;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // Add item to cart
      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find(
          (item) => item.product.id === product.id
        );

        if (existingItem) {
          // Check stock limit
          const newQuantity = existingItem.quantity + 1;
          if (
            product.trackInventory &&
            newQuantity > product.quantity
          ) {
            // Don't add if exceeds stock
            return;
          }

          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: newQuantity }
                : item
            ),
          });
        } else {
          set({
            items: [...items, { product, quantity: 1 }],
          });
        }
      },

      // Remove item from cart
      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
        });
      },

      // Update item quantity
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const items = get().items;
        const item = items.find((item) => item.product.id === productId);

        if (!item) return;

        // Check stock limit
        if (
          item.product.trackInventory &&
          quantity > item.product.quantity
        ) {
          return;
        }

        set({
          items: items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },

      // Update item note
      updateNote: (productId, note) => {
        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, note } : item
          ),
        });
      },

      // Clear all items
      clearCart: () => {
        set({ items: [] });
      },

      // Toggle cart drawer
      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },

      // Open cart drawer
      openCart: () => {
        set({ isOpen: true });
      },

      // Close cart drawer
      closeCart: () => {
        set({ isOpen: false });
      },

      // Get total item count
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Get subtotal (before tax)
      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + Number(item.product.price) * item.quantity,
          0
        );
      },

      // Get tax amount
      getTax: (taxRate = 0.1) => {
        const subtotal = get().getSubtotal();
        return subtotal * taxRate;
      },

      // Get total (with tax)
      getTotal: (taxRate = 0.1) => {
        const subtotal = get().getSubtotal();
        const tax = get().getTax(taxRate);
        return subtotal + tax;
      },

      // Get specific item
      getItem: (productId) => {
        return get().items.find((item) => item.product.id === productId);
      },
    }),
    {
      name: "ravora-cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);
