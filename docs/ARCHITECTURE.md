# HashTap — Mimari (Faz 0)

Bu doküman iskelenin neden bu şekilde kurulduğunu ve parçaların birbiriyle ilişkisini özetler. Detaylı ürün/iş dokümanı için `hashcash.md`'ye bakın.

## Sistem haritası

```
         ┌────────────────┐
         │ Müşteri (PWA)  │  QR → menü → sepet → iyzico 3DS
         └──────┬─────────┘
                │ HTTPS / WSS
                ▼
      ┌────────────────────┐      ┌────────────────────┐
      │  HashTap API        │◄────┤ Restoran Paneli    │
      │  (Fastify+Drizzle)  │     │ (React SPA)        │
      └───┬────────┬────────┘      └────────────────────┘
          │        │
          │        └─────────────┐
          │                      ▼
          │              ┌────────────────┐
          │              │  POS Adapter   │  SambaPOS / Adisyo / Local Agent /
          │              │  (pluggable)   │  DB Connector / Print Bridge / Network Printer
          │              └───────┬────────┘
          │                      ▼
          │            Restoran'ın POS/ERP veya
          │            doğrudan mutfak yazıcısı
          │
          ├─► iyzico (subMerchant — facilitator modeli)
          ├─► e-Arşiv sağlayıcı (Foriba / Uyumsoft / Logo)
          └─► Pg-boss kuyruğu (retry + idempotent sipariş itme)
```

## Katmanlar

- **apps/** — çalışan uygulamalar (customer-pwa, restaurant-dashboard, api, print-bridge).
- **packages/** — paylaşılan kütüphaneler (shared tipler, pos-adapters, payment, efatura).
- **infra/** — local docker-compose, ileride prod IaC.

## Temel kararlar

1. **Monorepo + npm workspaces.** Paylaşılan tipleri düşük sürtünmeyle birden fazla uygulamaya dağıtmak için. Ayrıntı: `docs/adr/0001-monorepo.md`.
2. **Fastify + Drizzle.** Hızlı başlangıç, TypeScript-first, SQL'e yakın kontrol.
3. **POS adapter pattern.** Tek bir `PosAdapter` arayüzü, her entegrasyon altında ayrı implementation. Yeni POS eklemek = yeni bir dosya.
4. **Para `Kurus` (int).** Float yok; gösterim `packages/shared/money.ts` içinde.
5. **Sipariş state machine.** `src/domain/order-lifecycle.ts` saf fonksiyon; framework'ten bağımsız, test edilebilir.
6. **e-Arşiv fail-close.** Fiş kesilemezse sipariş mutfağa gitmez — vergi riskini azaltır. `packages/efatura` içinde.
7. **Row-level tenant isolation.** Her tabloda `tenant_id`; ileride Postgres RLS.

## Olay akışı (mutlu yol)

1. Müşteri QR okur → PWA `/r/:tenantSlug/t/:tableId` açılır, menü yüklenir.
2. Sepet dolar → `/pay` → API sipariş kaydı (`created`) + iyzico 3DS başlatır.
3. 3DS `paid` callback → sipariş `paid` olur → **e-Arşiv kesilir** → başarılıysa POS adapter'a `pushOrder` job kuyruklanır.
4. Adapter POS'a siparişi iletir → `sent_to_pos` → POS mutfağa gönderir → restoran paneli `in_kitchen / ready / served` günceller.
5. Sipariş durumu ekranında müşteri fişi görür.

## Hata modları

- POS offline → kuyrukta idempotent retry (aynı `order.id` → aynı `PosOrderId`).
- e-Arşiv fail → sipariş `paid` kalır, mutfak **tetiklenmez**, restoran paneline alarm düşer.
- iyzico fail → sipariş hiç `paid` olmaz; kullanıcıya hata döner.
- Print Bridge offline → API `order.printed` onayı gelmezse panelde "basılmadı" rozeti.

## Gelecek iş (faz 1+)

- Postgres RLS politikaları.
- Gerçek iyzico subMerchant CRUD.
- SambaPOS ve Adisyo adapter implementasyonları.
- Observability (OpenTelemetry trace, Prometheus metric).
- E2E (Playwright) pipeline.
