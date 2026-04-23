export interface WaiterTable {
  id: string;
  label: string;
  status: 'free' | 'open' | 'needs-bill' | 'ready-pickup';
  activeOrderId?: string;
  openedAt?: string;
  guestCount?: number;
}

export const DEMO_TABLES: WaiterTable[] = [
  { id: 't-1', label: '1', status: 'open', openedAt: '2026-04-23T18:30:00Z', guestCount: 4 },
  { id: 't-2', label: '2', status: 'free' },
  { id: 't-3', label: '3', status: 'ready-pickup', openedAt: '2026-04-23T18:12:00Z', guestCount: 2 },
  { id: 't-4', label: '4', status: 'needs-bill', openedAt: '2026-04-23T18:00:00Z', guestCount: 6 },
  { id: 't-5', label: '5', status: 'free' },
  { id: 't-6', label: '6', status: 'open', openedAt: '2026-04-23T18:45:00Z', guestCount: 2 },
  { id: 't-7', label: '7', status: 'free' },
  { id: 't-8', label: '8', status: 'open', openedAt: '2026-04-23T18:40:00Z', guestCount: 3 },
];

export function statusLabel(s: WaiterTable['status']): string {
  return {
    free: 'boş',
    open: 'açık',
    'needs-bill': 'hesap',
    'ready-pickup': 'al!',
  }[s];
}

export function statusTone(s: WaiterTable['status']) {
  return {
    free: 'neutral' as const,
    open: 'warning' as const,
    'needs-bill': 'danger' as const,
    'ready-pickup': 'success' as const,
  }[s];
}
