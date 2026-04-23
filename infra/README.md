# infra

Lokal geliştirme için altyapı. Birden çok Docker Compose dosyası
ayrı ayrı yönetilir:

## `infra/odoo/docker-compose.yml` — ana stack (restoran)

Odoo + Postgres + Redis + MailHog. Ana dev ortamı; HashTap iş mantığı
burada koşar.

```sh
docker compose -f infra/odoo/docker-compose.yml up -d
```

Portlar ve DB kurulumu: [`infra/odoo/README.md`](./odoo/README.md).

### Opsiyonel ops profili (heartbeat + backup)

Restoran-tarafı operasyonel servisler (Faz 11) profile-gated — sadece
explicit talep edildiğinde ayağa kalkarlar:

```sh
docker compose -f infra/odoo/docker-compose.yml --profile ops up -d heartbeat backup
```

- `heartbeat` — `@hashtap/heartbeat` daemon, merkezi ops-api'ya 60 sn
  aralıkla telemetri yollar
- `backup` — `infra/backup/` runner, gecelik 03:00'te pg_dump + restic
  snapshot alır

### Opsiyonel updates profili (Watchtower)

Otomatik güncelleme için:

```sh
docker compose -f infra/odoo/docker-compose.yml --profile updates up -d watchtower
```

Watchtower, `com.centurylinklabs.watchtower.enable=true` label'ı olan
container'ları 04:00'te pull edip restart eder.

## `infra/ops/docker-compose.yml` — merkezi ops stack (HashTap cloud)

Restoran-dışı; HashTap'in kendi sunucusunda koşar. Heartbeat'leri
toplar, dashboard barındırır.

```sh
docker compose -f infra/ops/docker-compose.yml up -d
```

- `ops-db` — Postgres (`hashtap_ops` DB, port 5532)
- `ops-api` — Fastify `@hashtap/ops-api`, port 4100
- `uptime-kuma` (profil: `dashboard`) — opsiyonel dashboard, port 3001

```sh
docker compose -f infra/ops/docker-compose.yml --profile dashboard up -d
```

Migrations `apps/ops-api/migrations/` altından DB'ye otomatik initdb
olarak yüklenir.

## `infra/backup/` — backup runner image'ı

Alpine + restic + pg_client + cron. Kendi başına run edilmez; yukarıdaki
`--profile ops` ile `odoo/docker-compose.yml` içinden çağrılır.

Detay: [`infra/backup/README.md`](./backup/README.md).

## `infra/docker-compose.yml` — eski/yardımcı stack

Faz 0'da gateway'in kendi DB'si için kurulan Postgres + Redis + Adminer.
Odoo mimarisine geçişten sonra **gateway stateless** olduğu için
zorunlu değil. Ayrı test DB'si ayağa kaldırmak istendiğinde kullanılır.

```sh
docker compose -f infra/docker-compose.yml up -d
```

- Postgres 16 — `localhost:5432`, db/user/pw: `hashtap`
- Redis 7 — `localhost:6379`
- Adminer — `http://localhost:8081`

## Prod

Hetzner + Docker Compose + systemd (MVP), K8s sonra. Detay:
`docs/OPERATIONS.md`. Prod infra-as-code `infra/prod/` altına ayrıca
gelecek.
