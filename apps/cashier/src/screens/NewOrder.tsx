import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Badge,
  Skeleton,
  EmptyState,
  useToast,
} from '@hashtap/ui';
import { ChevronLeft, UtensilsCrossed, Send } from 'lucide-react';
import { formatKurus } from '../lib/format.js';
import { fetchPosMenu, type MenuItem, type MenuPayload } from '../lib/menu.js';
import { fetchTables, submitOrder, type PosTable } from '../lib/pos.js';
import { ModifierModal, type ModifierSelection } from '../components/ModifierModal.js';

interface CartLine {
  // Aynı item + aynı modifier kombinasyonu için tek satır
  key: string;
  itemId: number;
  name: string;
  priceKurus: number;
  modifierIds: number[];
  modifierNames: string[];
  modifierDeltaKurus: number;
  qty: number;
  note?: string;
}

function lineKey(itemId: number, modifierIds: number[]): string {
  return `${itemId}:${[...modifierIds].sort((a, b) => a - b).join(',')}`;
}

export function NewOrderScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [search] = useSearchParams();
  const prefillTableId = Number(search.get('table')) || null;

  const [tables, setTables] = useState<PosTable[]>([]);
  const [tableId, setTableId] = useState<number | null>(prefillTableId);
  const [menu, setMenu] = useState<MenuPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerNote, setCustomerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchPosMenu(), fetchTables()])
      .then(([m, t]) => {
        if (cancelled) return;
        setMenu(m);
        setTables(t);
        setCategoryId(m.categories[0]?.id ?? null);
        if (!prefillTableId && t.length > 0) {
          const firstFree = t.find((x) => x.status === 'free') ?? t[0];
          if (firstFree) setTableId(firstFree.id);
        }
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'unknown');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [prefillTableId]);

  const activeItems = useMemo<MenuItem[]>(() => {
    if (!menu) return [];
    const q = query.trim().toLowerCase();
    if (q) {
      return menu.categories.flatMap((c) =>
        c.items.filter((i) => i.name.tr.toLowerCase().includes(q)),
      );
    }
    const active = menu.categories.find((c) => c.id === categoryId);
    return active?.items ?? [];
  }, [menu, categoryId, query]);

  const total = cart.reduce(
    (sum, l) => sum + l.qty * (l.priceKurus + l.modifierDeltaKurus),
    0,
  );
  const selectedTable = tables.find((t) => t.id === tableId);

  function pushLine(item: MenuItem, sel: ModifierSelection | null) {
    const modifierIds = sel?.modifierIds ?? [];
    const modifierNames = sel?.modifierNames ?? [];
    const modifierDelta = sel?.modifierDeltaKurus ?? 0;
    const note = sel?.note;
    const key = lineKey(item.id, modifierIds);

    setCart((prev) => {
      const existing = prev.find((l) => l.key === key && l.note === note);
      if (existing) {
        return prev.map((l) =>
          l.key === existing.key && l.note === note ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          key,
          itemId: item.id,
          name: item.name.tr,
          priceKurus: item.price_kurus,
          modifierIds,
          modifierNames,
          modifierDeltaKurus: modifierDelta,
          qty: 1,
          note,
        },
      ];
    });
  }

  function addItem(item: MenuItem) {
    if (item.modifier_groups.length > 0) {
      setModalItem(item);
    } else {
      pushLine(item, null);
    }
  }

  function decItem(key: string) {
    setCart((prev) =>
      prev.flatMap((l) => {
        if (l.key !== key) return [l];
        const next = l.qty - 1;
        return next <= 0 ? [] : [{ ...l, qty: next }];
      }),
    );
  }

  function removeItem(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  async function sendToKitchen() {
    if (!tableId) {
      toast.show({ title: 'Masa seçin', tone: 'warning' });
      return;
    }
    if (cart.length === 0) {
      toast.show({ title: 'Sepet boş', tone: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const order = await submitOrder({
        table_id: tableId,
        items: cart.map((l) => ({
          item_id: l.itemId,
          quantity: l.qty,
          modifier_ids: l.modifierIds,
          note: l.note,
        })),
        customer_note: customerNote || undefined,
        require_receipt: false,
      });
      toast.show({
        title: `${order.reference} açıldı`,
        description: `Masa ${order.table_name} · ${formatKurus(order.total_kurus)}`,
        tone: 'success',
      });
      setCart([]);
      setCustomerNote('');
      setTimeout(() => navigate(`/tables/${order.table_id}`), 500);
    } catch (err) {
      toast.show({
        title: 'Sipariş gönderilemedi',
        description: err instanceof Error ? err.message : 'unknown',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_360px]">
      <Card>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
            aria-label="Geri"
            className="!h-10 !w-10 !p-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle>Yeni sipariş</CardTitle>
            {menu ? (
              <div className="mt-1 text-xs text-textc-muted">
                {menu.restaurant.name} · {menu.restaurant.currency}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr]">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-textc-secondary">Masa</span>
            <select
              value={tableId ?? ''}
              onChange={(e) => setTableId(Number(e.currentTarget.value) || null)}
              className="ht-glass h-touch rounded-lg border border-white/14 px-3 text-base text-textc-primary focus-visible:outline-none focus-visible:border-brand-500"
            >
              <option value="">— Seçin —</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.floor} · {t.name} ({t.seats} kişilik) —{' '}
                  {t.status === 'free' ? 'boş' : 'açık'}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Menüde ara"
            placeholder="örn. levrek"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<UtensilsCrossed />}
            title="Menü yüklenemedi"
            description={`Gateway'e ulaşılamadı: ${error}. Odoo + gateway çalışıyor mu?`}
          />
        ) : !menu || menu.categories.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed />}
            title="Menü boş"
            description="Odoo → HashTap → Menü Katalogu → Menü Kalemleri altından ürün ekleyin."
          />
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {menu.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCategoryId(c.id);
                    setQuery('');
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    categoryId === c.id && !query
                      ? 'bg-brand-500 text-white'
                      : 'ht-glass text-textc-secondary hover:bg-white/8'
                  }`}
                >
                  {c.name.tr}
                  <span className="ml-2 text-xs opacity-70">{c.items.length}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {activeItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="ht-glass rounded-xl p-4 text-left transition hover:bg-white/10 active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-base font-semibold leading-tight">{item.name.tr}</div>
                    {item.is_featured ? <Badge tone="brand">★</Badge> : null}
                  </div>
                  {item.description.tr ? (
                    <div className="mt-1 line-clamp-2 text-xs text-textc-secondary">
                      {item.description.tr}
                    </div>
                  ) : null}
                  <div className="mt-2 text-sm font-bold tabular-nums text-brand-400">
                    {formatKurus(item.price_kurus)}
                  </div>
                </button>
              ))}
              {activeItems.length === 0 ? (
                <div className="col-span-full py-8 text-center text-sm text-textc-muted">
                  Eşleşen ürün yok.
                </div>
              ) : null}
            </div>
          </>
        )}
      </Card>

      <Card>
        <CardTitle>Sepet</CardTitle>
        <CardDescription>
          {cart.length} satır{selectedTable ? ` · Masa ${selectedTable.name}` : ''}
        </CardDescription>
        <ul className="mt-4 space-y-2">
          {cart.length === 0 ? (
            <li className="text-sm text-textc-muted">Sepet boş — soldan ürün ekleyin.</li>
          ) : (
            cart.map((l) => (
              <li
                key={l.key}
                className="flex items-start justify-between gap-2 rounded-lg bg-white/4 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{l.name}</div>
                  {l.modifierNames.length > 0 ? (
                    <div className="truncate text-xs text-textc-muted">
                      {l.modifierNames.join(', ')}
                    </div>
                  ) : null}
                  {l.note ? (
                    <div className="truncate text-xs italic text-textc-muted">
                      not: {l.note}
                    </div>
                  ) : null}
                  <div className="mt-0.5 text-xs text-textc-muted tabular-nums">
                    {l.qty} × {formatKurus(l.priceKurus + l.modifierDeltaKurus)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decItem(l.key)}
                    className="h-8 w-8 rounded-full ht-glass text-sm font-semibold hover:bg-white/10"
                    aria-label="Azalt"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                  <button
                    onClick={() => removeItem(l.key)}
                    className="text-xs text-state-danger hover:underline"
                  >
                    sil
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="mt-4">
          <Input
            label="Müşteri notu (opsiyonel)"
            placeholder="Alerji, pişirme isteği vs."
            value={customerNote}
            onChange={(e) => setCustomerNote(e.currentTarget.value)}
          />
        </div>

        <div className="mt-6 border-t border-white/8 pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-textc-muted">Toplam</span>
            <span className="text-3xl font-bold tabular-nums">{formatKurus(total)}</span>
          </div>
          <Button
            size="lg"
            fullWidth
            className="mt-4"
            onClick={sendToKitchen}
            loading={submitting}
            leftIcon={<Send className="h-5 w-5" />}
          >
            Masayı aç
          </Button>
          <p className="mt-2 text-xs text-textc-muted">
            Sipariş açıldıktan sonra masa detayında mutfağa gönderip ödeme alabilirsiniz.
          </p>
        </div>
      </Card>

      <ModifierModal
        item={modalItem}
        open={Boolean(modalItem)}
        onClose={() => setModalItem(null)}
        onConfirm={(sel) => {
          if (modalItem) pushLine(modalItem, sel);
        }}
      />
    </div>
  );
}
