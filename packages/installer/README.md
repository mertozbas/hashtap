# @hashtap/installer

HashTap restoran kurulum sihirbazı. IT ekibi veya partner saha kurulumunda
tek komutla çalıştırır; wizard eksik bilgiyi toplar, `.env` yazar, Docker
compose stack'i ayağa kaldırır, Tailscale + Cloudflare Tunnel kaydeder,
smoke test çalıştırır.

Detay: [`docs/INSTALLATION_PLAYBOOK.md`](../../docs/INSTALLATION_PLAYBOOK.md).

## Kullanım

```sh
# İnteraktif wizard
npx -p @hashtap/installer hashtap-installer

# Dosyadan config
npx -p @hashtap/installer hashtap-installer --config hashtap.json

# Sadece plan göster, eylem yok
npx -p @hashtap/installer hashtap-installer --dry-run

# Disaster recovery (ayrı runbook)
npx -p @hashtap/installer hashtap-installer --restore rest-42
```

Prod'da `curl -sSL install.hashtap.app | bash` sarıcısı bu CLI'ı indirip
çağırır (ayrı wrapper script).

## Wizard adımları

1. Kurulum ID + slug + restoran adı + paket
2. Yönetici e-posta + şifre
3. iyzico API/secret (sandbox veya live)
4. e-Arşiv sağlayıcı (Foriba / Uyumsoft / mock)
5. HashTap ops URL + installation token
6. Cloudflare Tunnel (opsiyonel) + hostname
7. Tailscale auth key (opsiyonel)

## Uygulama adımları (wizard sonrası)

1. `/opt/hashtap/.env` yaz
2. `docker compose -f infra/odoo/docker-compose.yml --profile ops up -d`
3. Tailscale enroll (eğer auth key verildiyse)
4. Cloudflared tunnel container başlat
5. Gateway + ops `/health` smoke test
6. Özet çıktısı

Her adım başarısız olursa net hata mesajı verir ve kurulum yarım kalır —
idempotent: tekrar çalıştırıldığında kaldığı yerden devam edebilir.

## Config schema

`src/config.ts` içinde tam Zod şeması. Örnek:

```json
{
  "installationId": "rest-42",
  "slug": "kafe-cumhuriyet",
  "restaurantName": "Kafe Cumhuriyet",
  "tenantId": "00000000-0000-0000-0000-000000000001",
  "package": "pro",
  "admin": { "email": "admin@example.com", "password": "secure-pw-123" },
  "iyzico": { "mode": "sandbox", "apiKey": "...", "secretKey": "..." },
  "earsiv": { "provider": "foriba", "username": "...", "password": "..." },
  "ops": { "opsUrl": "https://ops.hashtap.app", "installationToken": "..." },
  "cloudflare": { "enabled": true, "tunnelToken": "...", "hostname": "qr.kafe-cumhuriyet.hashtap.app" },
  "tailscale": { "enabled": true, "authKey": "tskey-..." },
  "network": { "caddyHttpPort": 80, "caddyHttpsPort": 443 }
}
```

## Gereksinimler (host makine)

- Ubuntu 22.04+ veya Windows 11 + Docker Desktop
- Docker Engine 24+ ve Docker Compose v2
- İnternet bağlantısı (ilk kurulum image pull için)
- Tailscale binary (eğer Tailscale seçildiyse)

## Güvenlik

- `.env` permissions 0600 (installer otomatik ayarlar).
- Kurulum tamamlandıktan sonra admin şifresi + installation token bir
  kez görünür; dual-custody kasaya kaydet.
- Restic şifresi (backup) ayrı wizard adımı (faz 2 — şimdilik ops-api
  otomatik bootstrap).
