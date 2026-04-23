import { useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { Card, CardTitle, Badge, Button, EmptyState, Skeleton } from '@hashtap/ui';
import { useOrdersStore } from '../store/orders.js';
import { formatKurus, formatTime } from '../lib/format.js';

export function OrdersScreen() {
  const { items, loading, load, advance } = useOrdersStore();

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="Henüz sipariş yok"
        description="QR menüden ilk sipariş düştüğünde burada görünecek. Gateway'e bağlandığınızdan emin olun."
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {items.map((o) => (
        <Card key={o.id} padding="sm" radius="lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Masa {o.tableLabel}</CardTitle>
              <div className="mt-1 text-xs text-textc-muted">
                {o.lineCount} ürün · {formatTime(o.openedAt)}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge tone={o.status === 'paid' ? 'success' : o.status === 'ready' ? 'info' : 'warning'}>
                {o.status}
              </Badge>
              <div className="text-2xl font-bold tabular-nums">{formatKurus(o.totalKurus)}</div>
              <Button size="sm" onClick={() => advance(o.id)}>
                İlerlet
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
