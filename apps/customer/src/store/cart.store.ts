import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, CartItemOption } from '@tableflow/types'

interface CartStore {
  items: CartItem[]
  sessionCode: string | null
  tenantSlug: string | null
  tableId: string | null
  tableCode: string | null
  activeOrderId: string | null

  setSession: (data: { sessionCode: string; tenantSlug: string; tableId: string; tableCode: string }) => void
  setActiveOrder: (orderId: string | null) => void
  addItem: (item: CartItem) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  updateNotes: (index: number, notes: string) => void
  clearCart: () => void

  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      sessionCode: null,
      tenantSlug: null,
      tableId: null,
      tableCode: null,
      activeOrderId: null,

      setSession: (data) => set(data),
      setActiveOrder: (orderId) => set({ activeOrderId: orderId }),

      addItem: (newItem) =>
        set((state) => {
          // Try to merge with existing identical item
          const idx = state.items.findIndex(
            (i) =>
              i.menuItemId === newItem.menuItemId &&
              JSON.stringify(i.selectedOptions) === JSON.stringify(newItem.selectedOptions) &&
              i.notes === newItem.notes
          )
          if (idx !== -1) {
            const items = [...state.items]
            items[idx] = { ...items[idx], quantity: items[idx].quantity + newItem.quantity }
            return { items }
          }
          return { items: [...state.items, newItem] }
        }),

      removeItem: (index) =>
        set((state) => ({ items: state.items.filter((_, i) => i !== index) })),

      updateQuantity: (index, quantity) =>
        set((state) => {
          if (quantity <= 0) return { items: state.items.filter((_, i) => i !== index) }
          const items = [...state.items]
          items[index] = { ...items[index], quantity }
          return { items }
        }),

      updateNotes: (index, notes) =>
        set((state) => {
          const items = [...state.items]
          items[index] = { ...items[index], notes }
          return { items }
        }),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, item) => {
          const optionsTotal = item.selectedOptions.reduce((s, o) => s + o.priceAdjust, 0)
          return sum + (item.unitPrice + optionsTotal) * item.quantity
        }, 0),
    }),
    {
      name: 'tableflow-cart',
      partialize: (state) => ({
        items: state.items,
        sessionCode: state.sessionCode,
        tenantSlug: state.tenantSlug,
        tableId: state.tableId,
        tableCode: state.tableCode,
        activeOrderId: state.activeOrderId,
      }),
    }
  )
)
