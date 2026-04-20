# infra

Lokal geliştirme için minimum altyapı.

```sh
docker compose -f infra/docker-compose.yml up -d
```

- Postgres 16 — `localhost:5432`, db/user/pw: `hashtap`
- Redis 7 — `localhost:6379` (pg-boss için)
- Adminer — `http://localhost:8081`

Prod altyapısı (Terraform / Fly.io / Hetzner) `infra/prod/` altına ayrıca gelecek.
