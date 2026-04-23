import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardTitle, CardDescription, Button, Input, useToast } from '@hashtap/ui';
import { ChevronLeft } from 'lucide-react';
import { formatKurus } from '../lib/format.js';

interface CartLine {
  id: string;
  name: string;
  priceKurus: number;
  qty: number;
}

// Demo menu — gerçek ortamda /v1/menu/:tableSlug proxy'den gelir.
const DEMO_ITEMS = [
  { id: '1', name: 'Köfte Porsiyon', priceKurus: 18500 },
  { id: '2', name: 'Lahmacun (tek)', priceKurus: 9000 },
  { id: '3', name: 'Adana Dürüm', priceKurus: 16000 },
  { id: '4', name: 'Ayran (küçük)', priceKurus: 3500 },
  { id: '5', name: 'Şalgam', priceKurus: 3000 },
  { id: '6', name: 'Künefe', priceKurus: 14500 },
];

export function NewOrderScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tableLabel, setTableLabel] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);

  const total = cart.reduce((sum, l) => sum + l.priceKurus * l.qty, 0);

  function addItem(item: (typeof DEMO_ITEMS)[number]) {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) {
        return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function removeItem(id: string) {
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
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_360px]">
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
          <CardTitle>Yeni sipariş</CardTitle>
        </div>

        <div className="mt-6">
          <Input
            label="Masa"
            placeholder="örn. 4"
            value={tableLabel}
            onChange={(e) => setTableLabel(e.currentTarget.value)}
          />
        </div>

        <h3 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-textc-secondary">
          Menü
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DEMO_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => addItem(item)}
              className="ht-glass rounded-xl p-4 text-left transition hover:bg-white/10 active:scale-[0.98]"
            >
              <div className="text-base font-semibold">{item.name}</div>
              <div className="mt-2 text-xs tabular-nums text-textc-secondary">
                {formatKurus(item.priceKurus)}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Sepet</CardTitle>
        <CardDescription>{cart.length} satır</CardDescription>
        <ul className="mt-4 space-y-2">
          {cart.length === 0 ? (
            <li className="text-sm text-textc-muted">Sepet boş — sol taraftan ürün ekleyin.</li>
          ) : (
            cart.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between rounded-lg bg-white/4 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-semibold">
                    {l.qty}× {l.name}
                  </div>
                  <div className="text-xs text-textc-muted">
                    {formatKurus(l.priceKurus * l.qty)}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(l.id)}
                  className="text-xs text-state-danger hover:underline"
                >
                  sil
                </button>
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
