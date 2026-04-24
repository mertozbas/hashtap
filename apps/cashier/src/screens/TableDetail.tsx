import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Wallet, CreditCard, ChefHat, CheckCircle2, X } from 'lucide-react';
import {
  Button,
  Card,
  CardTitle,
  CardDescription,
  Badge,
  Modal,
  Skeleton,
  EmptyState,
  useToast,
} from '@hashtap/ui';
import {
  advanceOrder,
  cancelOrder,
  fetchTableDetail,
  fireKitchen,
  payOffline,
  type PaymentMethodCode,
  type PosOrder,
  type TableDetailResponse,
} from '../lib/pos.js';
import { formatKurus } from '../lib/format.js';

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

const PAYMENT_LABEL: Record<PosOrder['payment_state'], string> = {
  unpaid: 'Ödenmedi',
  pending: 'Beklemede',
  paid: 'Ödendi',
  failed: 'Başarısız',
  refunded: 'İade',
};

function nextActionLabel(state: PosOrder['state']) {
  return state === 'kitchen_sent'
    ? 'Hazırlanıyor'
    : state === 'preparing'
      ? 'Hazır'
      : state === 'ready'
        ? 'Servis edildi'
        : null;
}

export function TableDetailScreen() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<TableDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<PosOrder | null>(null);

  const load = useCallback(() => {
    const id = Number(tableId);
    if (!Number.isFinite(id)) return;
    return fetchTableDetail(id)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'unknown'))
      .finally(() => setLoading(false));
  }, [tableId]);

  useEffect(() => {
    load();
    const iv = window.setInterval(load, 5000);
    return () => window.clearInterval(iv);
  }, [load]);

  async function onFire(order: PosOrder) {
    try {
      await fireKitchen(order.id);
      toast.show({ title: `#${order.reference} mutfağa gönderildi`, tone: 'success' });
      await load();
    } catch (err) {
      toast.show({
        title: 'Mutfağa gönderilemedi',
        description: err instanceof Error ? err.message : 'unknown',
        tone: 'error',
      });
    }
  }

  async function onAdvance(order: PosOrder) {
    try {
      await advanceOrder(order.id);
      toast.show({ title: 'Durum güncellendi', tone: 'success' });
      await load();
    } catch (err) {
      toast.show({
        title: 'Durum değiştirilemedi',
        description: err instanceof Error ? err.message : 'unknown',
        tone: 'error',
      });
    }
  }

  async function onCancel(order: PosOrder) {
    if (!window.confirm(`${order.reference} iptal edilsin mi?`)) return;
    try {
      await cancelOrder(order.id);
      toast.show({ title: 'Sipariş iptal edildi', tone: 'warning' });
      await load();
    } catch (err) {
      toast.show({
        title: 'İptal başarısız',
        description: err instanceof Error ? err.message : 'unknown',
        tone: 'error',
      });
    }
  }

  async function onPay(method: PaymentMethodCode) {
    if (!payingOrder) return;
    try {
      await payOffline(payingOrder.id, method);
      toast.show({ title: 'Ödeme alındı', tone: 'success' });
      setPayingOrder(null);
      await load();
    } catch (err) {
      toast.show({
        title: 'Ödeme alınamadı',
        description: err instanceof Error ? err.message : 'unknown',
        tone: 'error',
      });
    }
  }

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-16 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={<X />}
        title="Masa bulunamadı"
        description={error ?? 'Lütfen geri dönüp tekrar deneyin.'}
        action={<Button onClick={() => navigate('/')}>Salon</Button>}
      />
    );
  }

  const { table, orders } = data;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/')}
          aria-label="Salon"
          className="!h-10 !w-10 !p-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Masa {table.name}</h1>
          <div className="text-xs text-textc-muted">
            {table.floor} · {table.seats} kişilik · QR: {table.slug}
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          className="ml-auto"
          onClick={() => navigate(`/orders/new?table=${table.id}`)}
        >
          + Yeni sipariş
        </Button>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ChefHat />}
          title="Açık sipariş yok"
          description="Masa boş. Yeni sipariş başlatabilir veya QR menüden sipariş bekleyebilirsiniz."
        />
      ) : (
        orders.map((order) => {
          const nextLabel = nextActionLabel(order.state);
          return (
            <Card key={order.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="!text-lg">{order.reference}</CardTitle>
                    <Badge tone={STATE_TONE[order.state]}>{STATE_LABEL[order.state]}</Badge>
                    <Badge tone={order.payment_state === 'paid' ? 'success' : 'warning'}>
                      {PAYMENT_LABEL[order.payment_state]}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    {order.lines.length} kalem · {formatKurus(order.total_kurus)}
                    {order.customer_note ? ` · not: ${order.customer_note}` : ''}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold tabular-nums">
                    {formatKurus(order.total_kurus)}
                  </div>
                  {order.payment_state === 'paid' && order.paid_amount_kurus > 0 ? (
                    <div className="text-xs text-state-success">
                      ödendi: {formatKurus(order.paid_amount_kurus)}
                    </div>
                  ) : null}
                </div>
              </div>

              <ul className="mt-4 divide-y divide-white/6 rounded-lg bg-white/4 px-4">
                {order.lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <div className="flex-1">
                      <span className="font-semibold tabular-nums">{line.quantity}× </span>
                      <span>{line.item_name}</span>
                      {line.note ? (
                        <span className="ml-2 text-xs text-textc-muted">
                          (not: {line.note})
                        </span>
                      ) : null}
                    </div>
                    <div className="tabular-nums">{formatKurus(line.subtotal_kurus)}</div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
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
                {order.payment_state !== 'paid' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setPayingOrder(order)}
                    leftIcon={<Wallet className="h-4 w-4" />}
                  >
                    Ödeme al
                  </Button>
                ) : null}
                {order.state !== 'served' && order.state !== 'cancelled' ? (
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => onCancel(order)}
                  >
                    İptal
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })
      )}

      <Modal
        open={Boolean(payingOrder)}
        onClose={() => setPayingOrder(null)}
        title="Ödeme al"
        description={
          payingOrder
            ? `${payingOrder.reference} — ${formatKurus(payingOrder.total_kurus)}`
            : undefined
        }
        footer={
          <Button variant="secondary" onClick={() => setPayingOrder(null)}>
            Vazgeç
          </Button>
        }
      >
        <div className="grid gap-3">
          <Button
            size="lg"
            fullWidth
            leftIcon={<Wallet className="h-5 w-5" />}
            onClick={() => onPay('cash')}
          >
            Nakit
          </Button>
          <Button
            size="lg"
            fullWidth
            variant="secondary"
            leftIcon={<CreditCard className="h-5 w-5" />}
            onClick={() => onPay('card_manual')}
          >
            Kredi kartı (harici POS / SanalPOS)
          </Button>
          <Button
            size="md"
            fullWidth
            variant="tertiary"
            onClick={() => onPay('pay_at_counter')}
          >
            Diğer (kasada karma)
          </Button>
          <p className="text-xs text-textc-muted">
            SanalPOS canlı entegrasyonu Faz 4'te eklenir. Şu anda kart ödemesi
            manuel cihazdan alınıp buradan işaretlenir.
          </p>
        </div>
      </Modal>
    </div>
  );
}
