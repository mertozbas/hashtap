import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { Card, CardTitle, Badge, EmptyState, Skeleton } from '@hashtap/ui';
import { fetchActiveOrders, type PosOrder } from '../lib/pos.js';
import { formatKurus, formatTime } from '../lib/format.js';

const STATE_LABEL: Record<PosOrder['state'], string> = {
  placed: 'Alındı',
  paid: 'Ödendi',
  kitchen_sent: 'Mutfakta',
  preparing: 'Hazırlanıyor',
  ready: 'Hazır',
  served: 'Servis edildi',
  cancelled: 'İptal',
};

const STATE_TONE: Record<
  PosOrder['state'],
  'warning' | 'info' | 'success' | 'danger' | 'neutral'
> = {
  placed: 'warning',
  paid: 'info',
  kitchen_sent: 'warning',
  preparing: 'warning',
  ready: 'success',
  served: 'neutral',
  cancelled: 'danger',
};

export function OrdersScreen() {
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      fetchActiveOrders()
        .then((data) => {
          if (!cancelled) {
            setOrders(data);
            setError(null);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'unknown');
            setLoading(false);
          }
        });
    }
    load();
    const iv = window.setInterval(load, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, []);

  if (loading && orders.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="Siparişler yüklenemedi"
        description={error}
      />
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="Aktif sipariş yok"
        description="QR menüden veya kasa/garson arayüzünden sipariş alınınca burada görünecek."
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {orders.map((o) => (
        <Link key={o.id} to={`/tables/${o.table_id}`} className="block">
          <Card padding="sm" radius="lg" interactive>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>
                  Masa {o.table_name}{' '}
                  <span className="text-sm font-normal text-textc-muted">
                    · {o.reference}
                  </span>
                </CardTitle>
                <div className="mt-1 text-xs text-textc-muted">
                  {o.lines.length} ürün · {formatTime(o.created_at ?? '')}
                  {o.customer_note ? ` · "${o.customer_note}"` : ''}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={o.payment_state === 'paid' ? 'success' : 'warning'}>
                  {o.payment_state === 'paid' ? 'ödendi' : 'ödenmedi'}
                </Badge>
                <Badge tone={STATE_TONE[o.state]}>{STATE_LABEL[o.state]}</Badge>
                <div className="text-2xl font-bold tabular-nums">
                  {formatKurus(o.total_kurus)}
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
