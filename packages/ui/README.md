# @hashtap/ui

HashTap paylaşılan tasarım sistemi — Cashier, Waiter, Customer PWA ve
yönetici arayüzleri bu paketteki bileşen + token'ları kullanır.

Detay: [`docs/DESIGN_SYSTEM.md`](../../docs/DESIGN_SYSTEM.md).

## Kurulum (consumer uygulamada)

```ts
// app/package.json
"dependencies": {
  "@hashtap/ui": "*"
}
```

Tailwind config'ini preset ile genişlet:

```js
// app/tailwind.config.cjs
module.exports = {
  presets: [require('@hashtap/ui/tailwind.preset')],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};
```

CSS'i import et:

```ts
// app entry
import '@hashtap/ui/styles.css';
```

## Kullanım

```tsx
import { Button, Card, CardTitle, Badge, useToast } from '@hashtap/ui';

function MyScreen() {
  const { show } = useToast();
  return (
    <Card>
      <CardTitle>Masa 4</CardTitle>
      <Badge tone="success" dot pulsing>Hazır</Badge>
      <Button onClick={() => show({ title: 'Sipariş gönderildi' })}>
        Onayla
      </Button>
    </Card>
  );
}
```

## Bileşenler

- `Button` — primary / secondary / tertiary / danger, 3 boyut, loading state
- `Card` — glass card + header/title/description/content/footer subcomponents
- `Input` — label + hint + error + invalid state
- `Modal` — framer-motion animasyonlu, escape/backdrop kapatma
- `Toast` + `ToastProvider` + `useToast` — bounce-in, stackable, auto-dismiss
- `Badge` — neutral / brand / success / warning / danger / info + pulsing dot
- `Skeleton` — shimmer placeholder
- `EmptyState` — icon + title + description + action
- `LiveIndicator` — bağlantı durumu (connected/connecting/disconnected)

## Hook'lar

- `useTheme()` — dark/light/system, `localStorage` kalıcı
- `useHaptic()` — navigator.vibrate wrapper, intensity preset'leri

## Tasarım ilkeleri (özet)

1. **Dark-first**, opsiyonel light
2. **Glassmorphism** ana yüzeylerde
3. **Dokunmatik birinci** — 56px minimum, 72px primary
4. **Framer Motion** ile yumuşak geçişler
5. **`prefers-reduced-motion`** saygı

Detay: `docs/DESIGN_SYSTEM.md`.
