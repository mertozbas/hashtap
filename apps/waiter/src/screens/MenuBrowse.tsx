import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { Card, CardTitle, Button, useToast, useHaptic } from '@hashtap/ui';
import { useQueueStore } from '../store/queue.js';

interface CartLine {
  menuItemId: string;
  name: string;
  priceKurus: number;
  qty: number;
}

const DEMO_ITEMS = [
  { id: 'm-1', name: 'Köfte Porsiyon', priceKurus: 18500, category: 'Ana' },
  { id: 'm-2', name: 'Lahmacun', priceKurus: 9000, category: 'Ana' },
  { id: 'm-3', name: 'Adana Dürüm', priceKurus: 16000, category: 'Ana' },
  { id: 'm-4', name: 'Ayran', priceKurus: 3500, category: 'İçecek' },
  { id: 'm-5', name: 'Şalgam', priceKurus: 3000, category: 'İçecek' },
  { id: 'm-6', name: 'Künefe', priceKurus: 14500, category: 'Tatlı' },
];

const CATEGORIES = ['Ana', 'İçecek', 'Tatlı'];

const formatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 2,
});

function formatKurus(k: number) {
  return formatter.format(k / 100);
}

export function MenuBrowseScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const haptic = useHaptic();
  const enqueue = useQueueStore((s) => s.enqueue);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [cart, setCart] = useState<CartLine[]>([]);

  const total = cart.reduce((sum, l) => sum + l.priceKurus * l.qty, 0);
  const visible = DEMO_ITEMS.filter((i) => i.category === category);

  function add(item: (typeof DEMO_ITEMS)[number]) {
    haptic('light');
    setCart((prev) => {
      const line = prev.find((l) => l.menuItemId === item.id);
      if (line) return prev.map((l) => (l === line ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { menuItemId: item.id, name: item.name, priceKurus: item.priceKurus, qty: 1 }];
    });
  }

  function dec(menuItemId: string) {
    setCart((prev) =>
      prev.flatMap((l) => {
        if (l.menuItemId !== menuItemId) return [l];
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
    await enqueue({
      id: `q-${Date.now()}`,
      tableId: id ?? 'unknown',
      lines: cart.map((l) => ({ menuItemId: l.menuItemId, qty: l.qty })),
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
    });
    haptic('success');
    toast.show({
      title: 'Sipariş gönderildi',
      description: cart.length > 1 ? `${cart.length} ürün` : '1 ürün',
      tone: 'success',
    });
    setCart([]);
    setTimeout(() => navigate(`/tables/${id}`), 600);
  }

  return (
    <div className="flex flex-col gap-4 pb-36">
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

      <div className="flex gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              category === c ? 'bg-brand-500 text-white' : 'ht-glass text-textc-secondary'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {visible.map((item) => {
          const line = cart.find((l) => l.menuItemId === item.id);
          return (
            <Card key={item.id} padding="sm" radius="md">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="!text-base">{item.name}</CardTitle>
                  <div className="mt-0.5 text-xs tabular-nums text-textc-muted">
                    {formatKurus(item.priceKurus)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {line ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => dec(item.id)}
                        className="!h-10 !w-10 !p-0"
                        aria-label={`${item.name} azalt`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center text-lg font-bold tabular-nums">
                        {line.qty}
                      </span>
                    </>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={() => add(item)}
                    className="!h-10 !w-10 !p-0"
                    aria-label={`${item.name} ekle`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {cart.length > 0 ? (
        <div className="fixed inset-x-0 bottom-16 z-10 mx-auto max-w-[480px] px-4">
          <Button size="lg" fullWidth onClick={send}>
            Mutfağa gönder · {formatKurus(total)}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
