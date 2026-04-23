# @hashtap/api — Gateway

Customer PWA ile local Odoo instance'ı arasındaki **thin BFF**.

On-premise tek-kiracı modelde (ADR-0011): tek kurulum = tek restoran = tek Odoo DB.

## Sorumluluklar

- PWA isteklerini Odoo controller'larına proxy'lemek
- Rate limit, CORS, helmet, request şema doğrulaması
- (İleride) JWT/QR token doğrulama, idempotency

## Sorumluluğu olmayan

- Sipariş state machine — Odoo içindeki `hashtap_pos` tutar
- DB şeması — gateway stateless, Odoo otoritedir
- iyzico / e-Arşiv çağrıları — Odoo modülünde (`adapters/iyzico.py`, `adapters/earsiv/foriba.py`)

## Ortam değişkenleri

| key | default | açıklama |
| --- | --- | --- |
| `API_PORT` | 4000 | Fastify dinleme portu |
| `ODOO_BASE_URL` | `http://localhost:8069` | Odoo upstream |
| `ODOO_DB` | `hashtap` | Tek kiracı Odoo DB adı |

## Dev

```sh
npm run dev -w @hashtap/api
```

`docs/DEV_SETUP.md` tam akış için.
