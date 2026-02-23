import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
  addItem: (item) => set((state) => {
    const existing = state.items.find((i) => i.id === item.id);
    if (existing) {
      return {
        items: state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        ),
        isOpen: true,
      };
    }
    return { items: [...state.items, item], isOpen: true };
  }),
  removeItem: (id) => set((state) => ({
    items: state.items.filter((i) => i.id !== id),
  })),
  updateQuantity: (id, quantity) => set((state) => ({
    items: quantity <= 0
      ? state.items.filter((i) => i.id !== id)
      : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
  })),
  clearCart: () => set({ items: [] }),
  getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
