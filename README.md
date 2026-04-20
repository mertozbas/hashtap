# HashTap

> Restoranlar için QR sipariş ve ödeme platformu.
> Müşteri QR'ı okutur, telefondan sipariş verir, öder. Sipariş mutfağa, para doğrudan restoranın hesabına gider.

## Ne yapıyoruz?

HashTap, restoranın mevcut iş akışını **değiştirmeden** çalışan bir sipariş kanalıdır. Garson hâlâ servisi yapar; biz yalnızca sipariş alma ve ödeme sürecini müşterinin telefonuna taşıyoruz.

- Müşteri: QR → menü → sepet → ödeme → fiş (e-posta)
- Restoran: sipariş mevcut mutfak/bar yazıcısından fiş olarak düşer, ödeme restoranın merchant hesabına gider
- Biz (HashTap): aradaki sipariş + ödeme + eşleştirme + e-Arşiv katmanı

Detaylı ürün ve iş planı: [docs/PRODUCT.md](./docs/PRODUCT.md)
Roadmap: [docs/ROADMAP.md](./docs/ROADMAP.md)
Mimari: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## Repo yapısı

```
hashtap/
├── odoo-addons/
│   ├── hashtap_pos/            # iş mantığı: menü, sipariş, iyzico, e-Arşiv
│   └── hashtap_theme/          # white-label (logo, renk, login, email)
├── apps/
│   ├── customer-pwa/           # Müşteri PWA (QR → menü → ödeme)
│   ├── api/                    # Gateway (Fastify thin BFF)
│   └── print-bridge/           # On-prem: Raspberry Pi / ağ yazıcısı ajanı
├── packages/
│   ├── shared/                 # Ortak TS tipleri, şemalar, util
│   └── pos-adapters/           # Segment B: SambaPOS, Adisyo, Local Agent vb.
├── infra/
│   ├── docker-compose.yml      # Dev: Postgres + Redis + Adminer
│   └── odoo/
│       └── docker-compose.yml  # Dev: Odoo 17 + Postgres + Redis
└── docs/                       # PRODUCT, ROADMAP, ARCHITECTURE, ADR, vb.
```

Restoran paneli **Odoo native** (ADR-0009). Müşteri PWA TS/React'te kalır (ADR-0008). İş mantığı Python tarafında (Odoo), gateway araya thin BFF olarak giriyor.

## Geliştirme

**Gereklilikler:** Node.js ≥ 20, Docker, npm ≥ 10, Python 3.11 (opsiyonel, modül debug için).

Tam akış: [docs/DEV_SETUP.md](./docs/DEV_SETUP.md).

```bash
npm install
docker compose -f infra/odoo/docker-compose.yml up -d
npm run dev -w @hashtap/api
npm run dev -w @hashtap/customer-pwa
```

## Durum

Faz 1 (Odoo + modül iskeleti). Detay: [docs/ROADMAP.md](./docs/ROADMAP.md).

## Lisans

Dahili proje. Odoo 17 Community Edition üzerinde inşa edilmiştir (LGPLv3).
