# @hashtap/api

Backend — Fastify + TypeScript + Postgres (Drizzle ORM).

## Sorumluluklar

- Müşteri PWA ve restoran paneline HTTP + WebSocket arayüzü
- Tenant (restoran) yönetimi, multi-tenant veri izolasyonu
- Sipariş yaşam döngüsü orkestrasyonu (`src/domain/order-lifecycle.ts`)
- POS adapter'larını çağırma (`@hashtap/pos-adapters`)
- Ödeme başlatma + webhook doğrulama (`@hashtap/payment`)
- e-Arşiv fiş tetikleme (`@hashtap/efatura`)

## Çalıştırma

```bash
# İlk kurulum
cp ../../.env.example .env
docker compose -f ../../infra/docker-compose.yml up -d
npm run db:migrate

# Geliştirme
npm run dev
```

## Klasörler

```
src/
├── config/         # env, logger
├── routes/         # HTTP handler'ları, prefix başına tek dosya
├── domain/         # saf iş mantığı, tarafsız (framework'süz)
├── db/             # Drizzle schema + migration'lar
├── adapters/       # dış sistem entegrasyonları wrapper'ları
└── index.ts        # bootstrap
```

## Test

Unit testler domain katmanında (framework'süz). Entegrasyon testleri testcontainer ile gerçek Postgres.
