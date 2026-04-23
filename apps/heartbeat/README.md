# @hashtap/heartbeat

Restoran kurulumunda çalışan küçük Node daemon — dakikada bir merkezi
`ops-api`'ya heartbeat atar.

Detay: [docs/OPERATIONS.md §3.1](../../docs/OPERATIONS.md).

## Ne yapar?
- Sistem metrikleri (uptime, disk %, memory %)
- Konfigüre edilmiş servislerin HTTP health-check durumu
  (`healthy` / `degraded` / `down`)
- Merkezi `POST /v1/ops/heartbeat` çağrısı, Bearer token ile

## Ortam değişkenleri

| Değişken | Varsayılan | Anlamı |
|---|---|---|
| `HASHTAP_INSTALLATION_ID` | `dev-install` | Kurulum kimliği |
| `HASHTAP_SLUG` | `dev-restoran` | Restoran slug'ı |
| `HASHTAP_VERSION` | `0.1.0` | Kurulu sürüm |
| `HASHTAP_OPS_URL` | `http://localhost:4100` | Merkezi ops-api URL |
| `HASHTAP_INSTALLATION_TOKEN` | `""` | Bearer token (ops-api kaydında verilen) |
| `HEARTBEAT_INTERVAL_SECONDS` | `60` | Yerel fallback aralık (ack içinde override edilir) |
| `HEARTBEAT_SERVICES` | `odoo=...,gateway=...` | CSV: `ad=url` HTTP check listesi |

## Çalıştırma

```bash
npm run dev
```

Üretimde `npm run build && npm run start` ve systemd unit veya Docker
container olarak çalışır (bkz `infra/docker-compose.yml`).
