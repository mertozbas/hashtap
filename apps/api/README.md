# @hashtap/api — Gateway

Customer PWA ile per-tenant Odoo arasındaki **thin BFF**.

## Sorumluluklar

- Tenant slug → Odoo DB resolution
- PWA isteklerini Odoo controller'larına proxy'lemek
- Rate limit, CORS, helmet, request şema doğrulaması
- (İleride) JWT/QR token doğrulama, idempotency

## Sorumluluğu olmayan

- Sipariş state machine — Odoo içindeki `hashtap_pos` tutar
- DB şeması — gateway stateless, Odoo otoritedir
- iyzico / e-Arşiv çağrıları — Odoo modülünde (`services/iyzico_client.py`, `services/earsiv_client.py`)

## Ortam değişkenleri

| key | default | açıklama |
| --- | --- | --- |
| `API_PORT` | 4000 | Fastify dinleme portu |
| `ODOO_BASE_URL` | `http://localhost:8069` | Odoo upstream |
| `ODOO_TENANT_RESOLVER` | `static` | `static` (dev) \| `registry` (prod) |
| `ODOO_STATIC_DB` | `demo` | resolver=static iken kullanılan DB |

## Dev

```sh
npm run dev -w @hashtap/api
```

`docs/DEV_SETUP.md` tam akış için.
