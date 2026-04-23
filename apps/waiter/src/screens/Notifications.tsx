import { Bell } from 'lucide-react';
import { Card, Button, EmptyState, Badge } from '@hashtap/ui';
import { useNotifStore } from '../store/notifications.js';

const kindLabel = {
  ready: 'Hazır',
  'needs-bill': 'Hesap',
  'kitchen-note': 'Not',
};

const kindTone = {
  ready: 'success' as const,
  'needs-bill': 'danger' as const,
  'kitchen-note': 'warning' as const,
};

export function NotificationsScreen() {
  const items = useNotifStore((s) => s.items);
  const markAllRead = useNotifStore((s) => s.markAllRead);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Bell />}
        title="Bildirim yok"
        description="Mutfak bir siparişi hazırladığında veya masa hesap istediğinde burada görünecek."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bildirimler</h1>
        <Button variant="tertiary" size="sm" onClick={markAllRead}>
          Hepsini okundu say
        </Button>
      </div>
      {items.map((n) => (
        <Card key={n.id} padding="sm" radius="md" interactive>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone={kindTone[n.kind]}>{kindLabel[n.kind]}</Badge>
                <span className="text-sm font-semibold">Masa {n.tableLabel}</span>
              </div>
              <p className="mt-1 text-sm text-textc-secondary">{n.message}</p>
              <p className="mt-1 text-xs text-textc-muted">
                {new Date(n.createdAt).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {!n.readAt ? (
              <span className="h-2 w-2 rounded-full bg-brand-500 mt-2" aria-label="okunmamış" />
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
