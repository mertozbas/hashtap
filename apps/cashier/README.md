# @hashtap/cashier

Restoran kasa tezgâhındaki modern, dokunmatik, gerçek-zamanlı kasa
uygulaması. React + Vite + `@hashtap/ui` tasarım sistemi.

Detay: [`docs/apps/CASHIER.md`](../../docs/apps/CASHIER.md).

## Çalıştırma

```sh
# dev (port 5180)
npm run dev -w @hashtap/cashier

# build
npm run build -w @hashtap/cashier
```

`vite.config.ts` içindeki proxy gateway'e yönlendirir: `/v1/*` →
`http://localhost:4000`.

## Ekranlar (iskele)

- `/`        Ana — açık siparişler + bugün özeti
- `/orders`  Sipariş listesi
- `/orders/new` Yeni sipariş — menü browse + sepet
- `/tables`  Salon haritası
- `/settings` Tema + kurulum bilgisi

## Yapı

```
src/
├── main.tsx           # BrowserRouter + ToastProvider + App
├── App.tsx            # Route tablosu
├── components/
│   └── AppShell.tsx   # header + bottom-nav + LiveIndicator
├── screens/
│   ├── Home.tsx
│   ├── Orders.tsx
│   ├── NewOrder.tsx   # demo menü + sepet
│   ├── Tables.tsx     # salon haritası
│   └── Settings.tsx
├── store/
│   ├── orders.ts      # zustand store
│   └── live.ts        # ws bağlantı durumu
└── lib/
    └── format.ts      # kuruş ve saat formatlayıcıları
```

## Sıradaki işler (Faz 14 detayı)

- Canlı sipariş WebSocket client (gateway → `/ws/cashier`)
- Ödeme modal (iyzico entegrasyon) — `docs/apps/CASHIER.md` §10
- Masa birleştir/transfer akışı
- Gün açma/kapatma + Z raporu
- Offline handling (service worker + IndexedDB queue)
