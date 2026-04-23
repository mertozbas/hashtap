import { create } from 'zustand';

export type NotifKind = 'ready' | 'needs-bill' | 'kitchen-note';

export interface Notif {
  id: string;
  kind: NotifKind;
  tableLabel: string;
  message: string;
  createdAt: string;
  readAt?: string;
}

interface NotifState {
  items: Notif[];
  push: (n: Notif) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotifStore = create<NotifState>((set, get) => ({
  items: [],
  push: (n) => set({ items: [n, ...get().items].slice(0, 50) }),
  markRead: (id) =>
    set({
      items: get().items.map((n) =>
        n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n,
      ),
    }),
  markAllRead: () => {
    const now = new Date().toISOString();
    set({ items: get().items.map((n) => ({ ...n, readAt: n.readAt ?? now })) });
  },
}));
