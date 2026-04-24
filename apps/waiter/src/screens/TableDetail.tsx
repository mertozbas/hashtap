import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, ChefHat, CheckCircle2 } from 'lucide-react';
import {
  Button,
  Card,
  CardTitle,
  CardDescription,
  Badge,
  Skeleton,
  EmptyState,
  useToast,
  useHaptic,
} from '@hashtap/ui';
import {
  advanceOrder,
  fetchTableDetail,
  fireKitchen,
  type PosOrder,
  type TableDetailResponse,
} from '../lib/pos.js';

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

function fmtKurus(k: number) {
  return `${(k / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

export function TableDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const haptic = useHaptic();
  const [data, setData] = useState<TableDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const n = Number(id);
    if (!Number.isFinite(n)) return;
    return fetchTableDetail(n)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'unknown'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    const iv = window.setInterval(load, 5000);
    return () => window.clearInterval(iv);
  }, [load]);

  async function onFire(order: PosOrder) {
    haptic('medium');
    try {
      await fireKitchen(order.id);
      toast.show({ title: 'Mutfağa gönderildi', tone: 'success' });
      await load();
    } catch (err) {
      toast.show({
        title: 'Gönderilemedi',
        description: err instanceof Error ? err.message : 'unknown',
        tone: 'error',
      });
    }
  }

  async function onAdvance(order: PosOrder) {
    haptic('success');
    try {
      await advanceOrder(order.id);
      toast.show({ title: 'Durum güncellendi', tone: 'success' });
      await load();
    } catch (err) {
      toast.show({
        title: 'Hata',
        description: err instanceof Error ? err.message : 'unknown',
        tone: 'error',
      });
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Masa bulunamadı"
        description={error ?? 'Lütfen geri dönüp tekrar deneyin.'}
        action={<Button onClick={() => navigate('/')}>Salon</Button>}
      />
    );
  }

  const { table, orders } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/')}
          className="!h-10 !w-10 !p-0"
          aria-label="Geri"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Masa {table.name}</h1>
        <span className="text-xs text-textc-muted">
          · {table.floor} · {table.seats} kişilik
        </span>
      </div>

      <Link to={`/tables/${table.id}/menu`}>
        <Button size="lg" fullWidth leftIcon={<Plus className="h-5 w-5" />}>
          Sipariş ekle
        </Button>
      </Link>

      {orders.length === 0 ? (
        <CardDescription>Açık sipariş yok. QR menüden veya menü ekranından başlatın.</CardDescription>
      ) : (
        orders.map((order) => {
          const nextLabel =
            order.state === 'kitchen_sent'
              ? 'Hazırlanıyor'
              : order.state === 'preparing'
                ? 'Hazır'
                : order.state === 'ready'
                  ? 'Servis edildi'
                  : null;
          return (
            <Card key={order.id} padding="sm" radius="lg">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="!text-base">{order.reference}</CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone={STATE_TONE[order.state]}>{STATE_LABEL[order.state]}</Badge>
                    <Badge tone={order.payment_state === 'paid' ? 'success' : 'warning'}>
                      {order.payment_state === 'paid' ? 'ödendi' : 'ödenmedi'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold tabular-nums">
                    {fmtKurus(order.total_kurus)}
                  </div>
                  <div className="text-xs text-textc-muted">{order.lines.length} kalem</div>
                </div>
              </div>

              <ul className="mt-3 divide-y divide-white/6 rounded-lg bg-white/4 px-3">
                {order.lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-center justify-between gap-2 py-2 text-sm"
                  >
                    <div>
                      <span className="font-semibold tabular-nums">{line.quantity}× </span>
                      <span>{line.item_name}</span>
                      {line.note ? (
                        <span className="ml-1 text-xs text-textc-muted">({line.note})</span>
                      ) : null}
                    </div>
                    <div className="text-xs tabular-nums">{fmtKurus(line.subtotal_kurus)}</div>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex gap-2">
                {order.state === 'placed' ? (
                  <Button
                    size="sm"
                    onClick={() => onFire(order)}
                    leftIcon={<ChefHat className="h-4 w-4" />}
                  >
                    Mutfağa gönder
                  </Button>
                ) : null}
                {nextLabel ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onAdvance(order)}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    {nextLabel}
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
