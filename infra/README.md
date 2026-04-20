# infra

Lokal geliştirme için altyapı. İki ayrı Docker Compose dosyası:

## `infra/odoo/docker-compose.yml` — ana stack

Odoo + Postgres + Redis + MailHog. Ana dev ortamı; HashTap iş mantığı burada koşar.

```sh
docker compose -f infra/odoo/docker-compose.yml up -d
```

Portlar ve DB kurulumu: [`infra/odoo/README.md`](./odoo/README.md).

## `infra/docker-compose.yml` — eski/yardımcı stack

Faz 0'da gateway'in kendi DB'si için kurulan Postgres + Redis + Adminer. Odoo mimarisine geçişten sonra **gateway stateless** olduğu için zorunlu değil. Adminer'a Odoo DB'sine bakmak veya ayrı bir test DB'si ayağa kaldırmak isteyince kullanılır.

```sh
docker compose -f infra/docker-compose.yml up -d
```

- Postgres 16 — `localhost:5432`, db/user/pw: `hashtap`
- Redis 7 — `localhost:6379`
- Adminer — `http://localhost:8081`

## Prod

Hetzner + Docker Compose + systemd (MVP), K8s sonra. Detay: [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md). Prod infra-as-code `infra/prod/` altına ayrıca gelecek.
