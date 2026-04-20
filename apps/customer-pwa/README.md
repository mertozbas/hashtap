# @hashtap/customer-pwa

Müşteri PWA'sı — QR okuyan müşterinin telefonda kullandığı uygulama.

## Akış

```
/r/:tenantSlug/t/:tableId            menü
/r/:tenantSlug/t/:tableId/cart       sepet
/r/:tenantSlug/t/:tableId/pay        ödeme (iyzico 3DS redirect)
/order/:orderId                      sipariş durumu + e-Arşiv fişi
```

## Tasarım ilkeleri

- Tek elle kullanılır (telefon, dikey).
- Çoklu dil (TR, EN zorunlu; + pilot bölgeye göre RU/DE/AR).
- Offline sepet (service worker) — sahilde internet kararsız.
- Apple Pay / Google Pay birinci tercih, kart fallback.

## Durum

İskele. Sayfalar placeholder. Menü API'si (`GET /v1/menu/:tenantSlug`) hazır olduğunda MenuPage doldurulacak.
