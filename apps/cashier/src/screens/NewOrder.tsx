import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardTitle, CardDescription, Button, Input, Badge, Skeleton, EmptyState, useToast } from '@hashtap/ui';
import { ChevronLeft, UtensilsCrossed } from 'lucide-react';
import { formatKurus } from '../lib/format.js';
import { fetchPosMenu, type MenuItem, type MenuPayload } from '../lib/menu.js';

interface CartLine {
  id: number;
  name: string;
  priceKurus: number;
  qty: number;
}

export function NewOrderScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tableLabel, setTableLabel] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [menu, setMenu] = useState<MenuPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPosMenu()
      .then((data) => {
        if (cancelled) return;
        setMenu(data);
        setCategoryId(data.categories[0]?.id ?? null);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'bilinmeyen hata');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const total = cart.reduce((sum, l) => sum + l.priceKurus * l.qty, 0);

  function addItem(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) {
        return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { id: item.id, name: item.name.tr, priceKurus: item.price_kurus, qty: 1 }];
    });
  }

  function decItem(id: number) {
    setCart((prev) =>
      prev.flatMap((l) => {
        if (l.id !== id) return [l];
        const next = l.qty - 1;
        return next <= 0 ? [] : [{ ...l, qty: next }];
      }),
    );
  }

  function removeItem(id: number) {
    setCart((prev) => prev.filter((l) => l.id !== id));
  }

  async function submitOrder() {
    if (!tableLabel.trim()) {
      toast.show({ title: 'Masa seçin', tone: 'warning' });
      return;
    }
    if (cart.length === 0) {
      toast.show({ title: 'Sepet boş', tone: 'warning' });
      return;
    }
    toast.show({
      title: 'Sipariş gönderildi',
      description: `Masa ${tableLabel} · ${formatKurus(total)}`,
      tone: 'success',
    });
    setCart([]);
    setTimeout(() => navigate('/orders'), 800);
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

        <div className="mt-6 grid grid-cols-[160px_1fr] gap-3">
          <Input
            label="Masa"
            placeholder="örn. A1"
            value={tableLabel}
            onChange={(e) => setTableLabel(e.currentTarget.value)}
          />
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
        <CardDescription>{cart.length} satır</CardDescription>
        <ul className="mt-4 space-y-2">
          {cart.length === 0 ? (
            <li className="text-sm text-textc-muted">Sepet boş — soldan ürün ekleyin.</li>
          ) : (
            cart.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between rounded-lg bg-white/4 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{l.name}</div>
                  <div className="text-xs text-textc-muted tabular-nums">
                    {l.qty} × {formatKurus(l.priceKurus)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decItem(l.id)}
                    className="h-8 w-8 rounded-full ht-glass text-sm font-semibold hover:bg-white/10"
                    aria-label="Azalt"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                  <button
                    onClick={() => removeItem(l.id)}
                    className="text-xs text-state-danger hover:underline"
                  >
                    sil
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
        <div className="mt-6 border-t border-white/8 pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-textc-muted">Toplam</span>
            <span className="text-3xl font-bold tabular-nums">{formatKurus(total)}</span>
          </div>
          <Button size="lg" fullWidth className="mt-4" onClick={submitOrder}>
            Mutfağa gönder
          </Button>
        </div>
      </Card>
    </div>
  );
}
