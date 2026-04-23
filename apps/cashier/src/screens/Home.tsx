import { Link } from 'react-router-dom';
import { Card, CardTitle, CardDescription, Button, Badge } from '@hashtap/ui';
import { Plus, ListOrdered, Grid3x3, Wallet } from 'lucide-react';
import { useOrdersStore } from '../store/orders.js';
import { formatKurus } from '../lib/format.js';
import { useEffect } from 'react';

export function HomeScreen() {
  const items = useOrdersStore((s) => s.items);
  const load = useOrdersStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  const kitchenCount = items.filter((o) => o.status === 'kitchen').length;
  const readyCount = items.filter((o) => o.status === 'ready').length;
  const todayRevenue = items.reduce(
    (sum, o) => (o.status === 'paid' ? sum + o.totalKurus : sum),
    0,
  );

  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardTitle>Bugün</CardTitle>
        <CardDescription>Açık ve tamamlanmış siparişler özeti</CardDescription>
        <div className="mt-6 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-5xl font-black tabular-nums">{kitchenCount}</div>
            <div className="mt-2 text-xs uppercase tracking-wide text-textc-muted">Mutfakta</div>
          </div>
          <div>
            <div className="text-5xl font-black tabular-nums">{readyCount}</div>
            <div className="mt-2 text-xs uppercase tracking-wide text-textc-muted">Hazır</div>
          </div>
          <div>
            <div className="text-3xl font-bold tabular-nums">{formatKurus(todayRevenue)}</div>
            <div className="mt-2 text-xs uppercase tracking-wide text-textc-muted">Ciro</div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Hızlı aksiyon</CardTitle>
        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" fullWidth leftIcon={<Plus className="h-5 w-5" />}>
            <Link to="/orders/new">Yeni sipariş</Link>
          </Button>
          <Button variant="secondary" size="md" fullWidth leftIcon={<ListOrdered className="h-5 w-5" />}>
            <Link to="/orders">Sipariş listesi</Link>
          </Button>
          <Button variant="secondary" size="md" fullWidth leftIcon={<Grid3x3 className="h-5 w-5" />}>
            <Link to="/tables">Masalar</Link>
          </Button>
        </div>
      </Card>

      <Card className="md:col-span-3">
        <div className="flex items-center justify-between">
          <CardTitle>Son siparişler</CardTitle>
          <Badge tone="brand" dot pulsing>Canlı</Badge>
        </div>
        {items.length === 0 ? (
          <CardDescription className="mt-4">
            Henüz sipariş yok. İlk QR okunduğunda burada görünecek.
          </CardDescription>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {items.slice(0, 5).map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between rounded-lg bg-white/4 px-4 py-3"
              >
                <div>
                  <div className="text-lg font-semibold">Masa {o.tableLabel}</div>
                  <div className="text-xs text-textc-muted">{o.lineCount} ürün</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={o.status === 'paid' ? 'success' : o.status === 'ready' ? 'info' : 'warning'}>
                    {o.status}
                  </Badge>
                  <span className="text-lg font-bold tabular-nums">
                    {formatKurus(o.totalKurus)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
