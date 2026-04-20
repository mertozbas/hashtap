# HashTap

> Restoranlar için QR sipariş ve ödeme platformu.
> Müşteri QR'ı okutur, telefondan sipariş verir, öder. Sipariş mutfağa, para doğrudan restoranın hesabına gider.

## Ne yapıyoruz?

HashTap, restoranın mevcut iş akışını **değiştirmeden** çalışan bir sipariş kanalıdır. Garson hâlâ servisi yapar; biz yalnızca sipariş alma ve ödeme sürecini müşterinin telefonuna taşıyoruz.

- Müşteri: QR → menü → sepet → ödeme → fiş (e-posta)
- Restoran: sipariş mevcut mutfak/bar yazıcısından fiş olarak düşer, ödeme restoranın merchant hesabına gider
- Biz (HashTap): aradaki sipariş + ödeme + eşleştirme + e-Arşiv katmanı

Detaylı ürün ve iş planı: [docs/hashcash.md](./docs/hashcash.md)
Müşteri sunumu: [docs/hashtap-satisunumu.pdf](./docs/hashtap-satisunumu.pdf)

## Monorepo yapısı

```
hashtap/
├── apps/
│   ├── customer-pwa/          # Müşteri PWA (QR → menü → ödeme)
│   ├── restaurant-dashboard/  # Restoran yönetim paneli
│   ├── api/                   # Backend (Fastify + Postgres)
│   └── print-bridge/          # Raspberry Pi / ağ yazıcısı ajanı
├── packages/
│   ├── shared/                # Ortak tipler, şemalar, util
│   ├── pos-adapters/          # SambaPOS, Adisyo, Generic Printer vb.
│   ├── payment/               # iyzico / PayTR adapter'ları
│   └── efatura/               # e-Arşiv entegratörleri (Foriba, Uyumsoft)
├── infra/                     # Docker Compose, migration, CI
└── docs/                      # Mimari, ADR, sunumlar
```

## Geliştirme ortamı

**Gereklilikler:** Node.js ≥ 20, Docker, npm ≥ 10.

```bash
# Bağımlılıklar
npm install

# Docker ile geliştirme altyapısı (Postgres, Redis)
docker compose -f infra/docker-compose.yml up -d

# Tüm uygulamaları watch modda çalıştır
npm run dev

# Sadece bir uygulamayı çalıştır
npm run dev --workspace apps/api
```

## Mimari özeti

İki taraf:
- **Müşteri tarafı:** PWA — React + Vite. Service worker, offline sepet, Apple/Google Pay.
- **Restoran tarafı:** yönetim paneli (React) + backend (Fastify) + POS adapter'ları.

Üç entegrasyon:
- **POS/ERP:** `packages/pos-adapters` altında her POS için ayrı adapter. Hiçbiri tutmuyorsa `print-bridge` ile doğrudan ESC/POS yazıcısına basılır.
- **Ödeme:** `packages/payment` — iyzico subMerchant (para doğrudan restoranın hesabına).
- **e-Arşiv:** `packages/efatura` — restoranın mevcut entegratörüne ayak uyduran adapter seti.

Detay: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## Durum

Faz 0 (iskelet). MVP planı için [docs/hashcash.md](./docs/hashcash.md) bölüm 8.

## Lisans

Dahili proje. Tüm hakları saklıdır.
