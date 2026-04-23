# @hashtap/ops-api

HashTap merkezi operasyon servisi — her restoran kurulumu bu servise
dakikada bir heartbeat atar.

Detay: [docs/OPERATIONS.md §3](../../docs/OPERATIONS.md).

## Endpoint'ler

- `POST /v1/ops/heartbeat` — restoran → ops, Bearer token auth
- `GET  /v1/ops/installations/:id/latest` — son heartbeat'i döner
- `GET  /health`

## Geliştirme

```bash
# Postgres (hashtap_ops DB) ayakta olmalı
createdb -h localhost -U hashtap hashtap_ops
psql -h localhost -U hashtap -d hashtap_ops -f migrations/001_heartbeats.sql

# Dev token üret (dev-only):
export OPS_INSTALLATION_TOKENS="rest-42:dev-token-abc"

npm run dev
```

Production'da token'lar `installations.token_hash` üzerinden doğrulanır
(hash karşılaştırmalı; MVP'de CSV env ile).
