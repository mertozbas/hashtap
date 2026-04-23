# @hashtap/waiter

Garson tableti için mobile-first PWA — dikey tablet (8-10") odaklı.
React + Vite + `@hashtap/ui` + PWA (idb-keyval ile offline queue).

Detay: [`docs/apps/WAITER.md`](../../docs/apps/WAITER.md).

## Çalıştırma

```sh
npm run dev -w @hashtap/waiter    # port 5181
npm run build -w @hashtap/waiter
```

## Ekranlar (iskele)

- `/`                         Salon — masa kartı grid (boş/açık/hesap/al)
- `/tables/:id`               Masa detay — kişi, açılış, aksiyonlar
- `/tables/:id/menu`          Menü browse + sepet + mutfağa gönder
- `/notifications`            Bildirim geçmişi (ready / hesap / not)

## Özellikler

- **Offline queue:** mutfağa gönderilemeyen siparişler IndexedDB'de
  (`idb-keyval` ile) bekletilir; bağlantı dönünce otomatik flush
  (gateway tarafı sonraki iterasyon).
- **Haptic feedback:** `useHaptic()` — ekleme `light`, gönderme
  `success`, hesap `medium`.
- **Bildirim sistemi:** `useNotifStore` üzerinden kitchen→waiter
  push'ları (WS şu an stub — gateway tarafına bağlanacak).
- **PWA:** vite-plugin-pwa ile installable + offline.

## Yapı

```
src/
├── main.tsx
├── App.tsx
├── components/
│   └── AppShell.tsx
├── screens/
│   ├── Tables.tsx
│   ├── TableDetail.tsx
│   ├── MenuBrowse.tsx
│   └── Notifications.tsx
├── store/
│   ├── live.ts          # ws durumu
│   ├── notifications.ts # push geçmişi
│   └── queue.ts         # offline sipariş kuyruğu (IndexedDB)
└── lib/
    └── tables.ts        # demo masa seed + label/tone helpers
```

## Sıradaki işler (Faz 15 detayı)

- Login (Odoo user → waiter rolü)
- Gateway WS client (masa durumu + ready push)
- Offline queue auto-flush retry
- Edge/battery polish, reduced motion
- Multi-concept (çoklu salon) desteği
