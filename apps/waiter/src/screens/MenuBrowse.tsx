import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Send } from 'lucide-react';
import {
  Card,
  CardTitle,
  Button,
  Skeleton,
  EmptyState,
  useToast,
  useHaptic,
} from '@hashtap/ui';
import { fetchPosMenu, submitOrder, type MenuItem, type MenuPayload } from '../lib/pos.js';
import { ModifierSheet, type ModifierSelection } from '../components/ModifierSheet.js';

interface CartLine {
  key: string;
  menuItemId: number;
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

const formatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 2,
});
function fmt(k: number) {
  return formatter.format(k / 100);
}

export function MenuBrowseScreen() {
  const { id } = useParams();
  const tableId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();
  const haptic = useHaptic();
  const [menu, setMenu] = useState<MenuPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPosMenu()
      .then((m) => {
        if (cancelled) return;
        setMenu(m);
        setCategoryId(m.categories[0]?.id ?? null);
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
  }, []);

  const visible = useMemo<MenuItem[]>(() => {
    if (!menu) return [];
    const active = menu.categories.find((c) => c.id === categoryId);
    return active?.items ?? [];
  }, [menu, categoryId]);

  const total = cart.reduce(
    (sum, l) => sum + l.qty * (l.priceKurus + l.modifierDeltaKurus),
    0,
  );

  function pushLine(item: MenuItem, sel: ModifierSelection | null) {
    haptic('light');
    const modifierIds = sel?.modifierIds ?? [];
    const modifierNames = sel?.modifierNames ?? [];
    const modifierDelta = sel?.modifierDeltaKurus ?? 0;
    const note = sel?.note;
    const key = lineKey(item.id, modifierIds);
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key && l.note === note);
      if (existing)
        return prev.map((l) =>
          l.key === existing.key && l.note === note ? { ...l, qty: l.qty + 1 } : l,
        );
      return [
        ...prev,
        {
          key,
          menuItemId: item.id,
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

  function add(item: MenuItem) {
    if (item.modifier_groups.length > 0) {
      setSheetItem(item);
    } else {
      pushLine(item, null);
    }
  }

  function dec(key: string) {
    setCart((prev) =>
      prev.flatMap((l) => {
        if (l.key !== key) return [l];
        const next = l.qty - 1;
        return next <= 0 ? [] : [{ ...l, qty: next }];
      }),
    );
  }

  async function send() {
    if (cart.length === 0) {
      toast.show({ title: 'Sepet boş', tone: 'warning' });
      return;
    }
    if (!Number.isFinite(tableId)) {
      toast.show({ title: 'Masa ID hatalı', tone: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const order = await submitOrder({
        table_id: tableId,
        items: cart.map((l) => ({
          item_id: l.menuItemId,
          quantity: l.qty,
          modifier_ids: l.modifierIds,
          note: l.note,
        })),
        require_receipt: false,
      });
      haptic('success');
      toast.show({
        title: `${order.reference} açıldı`,
        description: `Masa ${order.table_name} · ${fmt(order.total_kurus)}`,
        tone: 'success',
      });
      setCart([]);
      setTimeout(() => navigate(`/tables/${tableId}`), 600);
    } catch (err) {
      haptic('error');
      toast.show({
        title: 'Gönderilemedi',
        description: err instanceof Error ? err.message : 'unknown',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-40">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
          className="!h-10 !w-10 !p-0"
          aria-label="Geri"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Menü</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Menü yüklenemedi" description={error} />
      ) : !menu ? null : (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {menu.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  categoryId === c.id
                    ? 'bg-brand-500 text-white'
                    : 'ht-glass text-textc-secondary'
                }`}
              >
                {c.name.tr}
                <span className="ml-1.5 text-xs opacity-70">{c.items.length}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {visible.map((item) => {
              // Bu üründen sepette toplam adet (varyant farkına bakmaksızın)
              const totalQty = cart
                .filter((l) => l.menuItemId === item.id)
                .reduce((s, l) => s + l.qty, 0);
              // Modifier yoksa tek key var → kolay azalt
              const simpleLine = cart.find(
                (l) => l.menuItemId === item.id && l.modifierIds.length === 0,
              );
              return (
                <Card key={item.id} padding="sm" radius="md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="!text-base">{item.name.tr}</CardTitle>
                      <div className="mt-0.5 text-xs tabular-nums text-textc-muted">
                        {fmt(item.price_kurus)}
                        {item.modifier_groups.length > 0 ? ' · seçenekli' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {simpleLine ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => dec(simpleLine.key)}
                            className="!h-10 !w-10 !p-0"
                            aria-label="Azalt"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-6 text-center text-lg font-bold tabular-nums">
                            {totalQty}
                          </span>
                        </>
                      ) : totalQty > 0 ? (
                        <span className="w-6 text-center text-lg font-bold tabular-nums">
                          {totalQty}
                        </span>
                      ) : null}
                      <Button
                        size="sm"
                        onClick={() => add(item)}
                        className="!h-10 !w-10 !p-0"
                        aria-label={`${item.name.tr} ekle`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {cart.length > 0 ? (
        <div className="fixed inset-x-0 bottom-16 z-10 mx-auto max-w-[480px] px-4">
          <Button
            size="lg"
            fullWidth
            onClick={send}
            loading={submitting}
            leftIcon={<Send className="h-5 w-5" />}
          >
            Masayı aç · {fmt(total)}
          </Button>
        </div>
      ) : null}

      <ModifierSheet
        item={sheetItem}
        open={Boolean(sheetItem)}
        onClose={() => setSheetItem(null)}
        onConfirm={(sel) => {
          if (sheetItem) pushLine(sheetItem, sel);
        }}
      />
    </div>
  );
}
