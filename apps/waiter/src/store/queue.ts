import { create } from 'zustand';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { submitOrder, type SubmitLine } from '../lib/pos.js';

const QUEUE_KEY = 'hashtap-waiter-queue';

export interface QueuedOrder {
  id: string; // client-side uuid (idempotency key)
  tableId: number;
  lines: SubmitLine[];
  customerNote?: string;
  enqueuedAt: string;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
}

interface QueueState {
  items: QueuedOrder[];
  hydrated: boolean;
  flushing: boolean;
  online: boolean;
  hydrate: () => Promise<void>;
  enqueue: (order: Omit<QueuedOrder, 'attempts' | 'enqueuedAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setOnline: (online: boolean) => void;
  flush: () => Promise<{ ok: number; fail: number }>;
}

async function persist(items: QueuedOrder[]) {
  if (items.length === 0) return idbDel(QUEUE_KEY);
  return idbSet(QUEUE_KEY, items);
}

const MAX_ATTEMPTS = 6;

export const useQueueStore = create<QueueState>((set, get) => ({
  items: [],
  hydrated: false,
  flushing: false,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  hydrate: async () => {
    const raw = await idbGet<QueuedOrder[]>(QUEUE_KEY);
    set({ items: raw ?? [], hydrated: true });
  },
  enqueue: async (order) => {
    const item: QueuedOrder = {
      ...order,
      attempts: 0,
      enqueuedAt: new Date().toISOString(),
    };
    const next = [...get().items, item];
    set({ items: next });
    await persist(next);
  },
  remove: async (id) => {
    const next = get().items.filter((o) => o.id !== id);
    set({ items: next });
    await persist(next);
  },
  setOnline: (online) => set({ online }),
  flush: async () => {
    if (get().flushing) return { ok: 0, fail: 0 };
    set({ flushing: true });
    let ok = 0;
    let fail = 0;
    try {
      const items = [...get().items];
      for (const item of items) {
        try {
          await submitOrder({
            table_id: item.tableId,
            items: item.lines,
            customer_note: item.customerNote,
            require_receipt: false,
          });
          ok += 1;
          const next = get().items.filter((x) => x.id !== item.id);
          set({ items: next });
          await persist(next);
        } catch (err) {
          fail += 1;
          const next = get().items.map((x) =>
            x.id === item.id
              ? {
                  ...x,
                  attempts: x.attempts + 1,
                  lastAttemptAt: new Date().toISOString(),
                  lastError: err instanceof Error ? err.message : 'unknown',
                }
              : x,
          );
          // Max retry'ı aşan kayıtları sakla — operatör manuel çözer
          set({ items: next });
          await persist(next);
          if (item.attempts + 1 >= MAX_ATTEMPTS) {
            // log only — don't auto-delete; user'ın görmesi gerekiyor
            console.warn(
              `[waiter-queue] max attempts reached for ${item.id}, keeping in queue for manual resolution`,
            );
          }
        }
      }
    } finally {
      set({ flushing: false });
    }
    return { ok, fail };
  },
}));

/**
 * Tarayıcıda çağrılır — online durumu izle ve queue varsa otomatik flush et.
 * App start'ta bir kere çağırılması yeterli.
 */
export function startQueueAutoFlush() {
  if (typeof window === 'undefined') return;
  const store = useQueueStore;

  function flushIfPending() {
    const { items, online, flushing } = store.getState();
    if (!online || flushing || items.length === 0) return;
    void store.getState().flush();
  }

  window.addEventListener('online', () => {
    store.getState().setOnline(true);
    flushIfPending();
  });
  window.addEventListener('offline', () => {
    store.getState().setOnline(false);
  });

  // periyodik retry (15 sn) — exponential backoff yerine sade
  window.setInterval(flushIfPending, 15_000);

  // sayfa açılışta hidrate olduktan sonra dene
  void store.getState().hydrate().then(flushIfPending);
}
