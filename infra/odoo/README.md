# infra/odoo — Odoo 17 dev stack

## İlk kurulum

```sh
docker compose up -d
# Odoo http://localhost:8069'da ayakta. DB seçim ekranı gelir.
```

## İlk DB oluştur

`demo` DB'si + `hashtap_pos` + `hashtap_theme` yüklü:

```sh
docker compose exec odoo odoo \
  -d demo \
  -i hashtap_pos,hashtap_theme \
  --stop-after-init \
  --without-demo=False
```

Sonra `docker compose restart odoo`, http://localhost:8069/web?db=demo.

## Modül değişikliği sonrası upgrade

```sh
docker compose exec odoo odoo -d demo -u hashtap_pos --stop-after-init
docker compose restart odoo
```

`--dev=all` ile Python/XML değişikliklerinde çoğu durumda restart gerekmez.

## MailHog (test mailleri)

- SMTP: `mailhog:1025`
- Web: http://localhost:8025

Odoo → Settings → General → Outgoing Email Servers: host `mailhog`, port `1025`.

## Portlar

- 8069 → Odoo web
- 8072 → longpolling (bus, livechat)
- 5432 → Postgres (container içinde, dış mapping yok — çakışmasın diye)
- 8025 → MailHog UI
- 1025 → MailHog SMTP
