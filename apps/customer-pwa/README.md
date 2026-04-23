# @hashtap/customer-pwa

Müşteri PWA'sı — QR okuyan müşterinin telefonda kullandığı uygulama. TS/React'te kalır (ADR-0008), `@hashtap/api` gateway üzerinden Odoo'ya konuşur.

## Akış

```
/r/t/:tableSlug            menü
/r/t/:tableSlug/cart       sepet
/r/t/:tableSlug/pay        ödeme (iyzico 3DS redirect)
/order/:orderId            sipariş durumu + e-Arşiv fişi
```

Gateway uç noktaları: `GET /v1/menu/:tableSlug`, `POST /v1/orders`, `POST /v1/payments/3ds/start`.

## Tasarım ilkeleri

- Tek elle kullanılır (telefon, dikey).
- Çoklu dil (TR, EN zorunlu; + pilot bölgeye göre RU/DE/AR).
- Offline sepet (service worker) — sahilde internet kararsız.
- Apple Pay / Google Pay birinci tercih, kart fallback.
- Bundle hedef: < 150 KB sıkıştırılmış (ADR-0008 §Review).

## Durum

İskele. Sayfalar placeholder. Menü API'si hazır olduğunda MenuPage doldurulacak (ROADMAP Faz 2).
