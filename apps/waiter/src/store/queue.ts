import { create } from 'zustand';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

const QUEUE_KEY = 'hashtap-waiter-queue';

export interface QueuedOrder {
  id: string;               // client-side uuid
  tableId: string;
  lines: Array<{ menuItemId: string; qty: number; note?: string }>;
  enqueuedAt: string;
  attempts: number;
}

interface QueueState {
  items: QueuedOrder[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  enqueue: (order: QueuedOrder) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

async function persist(items: QueuedOrder[]) {
  if (items.length === 0) return idbDel(QUEUE_KEY);
  return idbSet(QUEUE_KEY, items);
}

export const useQueueStore = create<QueueState>((set, get) => ({
  items: [],
  hydrated: false,
  hydrate: async () => {
    const raw = await idbGet<QueuedOrder[]>(QUEUE_KEY);
    set({ items: raw ?? [], hydrated: true });
  },
  enqueue: async (order) => {
    const next = [...get().items, order];
    set({ items: next });
    await persist(next);
  },
  remove: async (id) => {
    const next = get().items.filter((o) => o.id !== id);
    set({ items: next });
    await persist(next);
  },
}));
