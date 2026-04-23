import { create } from 'zustand';

export interface CashierOrder {
  id: string;
  tableLabel: string;
  status: 'kitchen' | 'ready' | 'served' | 'paid';
  totalKurus: number;
  lineCount: number;
  openedAt: string;
}

interface OrdersState {
  items: CashierOrder[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  setAll: (items: CashierOrder[]) => void;
  advance: (id: string) => void;
}

async function fetchOrders(): Promise<CashierOrder[]> {
  try {
    const res = await fetch('/v1/orders/active');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as CashierOrder[];
  } catch {
    // Gateway yoksa empty döndür — UI boş state gösterir.
    return [];
  }
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  load: async () => {
    set({ loading: true, error: null });
    try {
      const items = await fetchOrders();
      set({ items, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'bilinmeyen' });
    }
  },
  setAll: (items) => set({ items }),
  advance: (id) =>
    set({
      items: get().items.map((o) => {
        if (o.id !== id) return o;
        const next = o.status === 'kitchen' ? 'ready' : o.status === 'ready' ? 'served' : 'paid';
        return { ...o, status: next };
      }),
    }),
}));
