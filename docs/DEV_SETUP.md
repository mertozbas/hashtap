# Geliştirici Kurulumu

Sıfırdan HashTap'i kendi makinende çalıştırmak için adım adım kılavuz.
"Clone et, bir saatte ayakta olsun" hedefi.

**Not:** Bu doküman **geliştirici** içindir. Restoran kurulumu
(IT ekibinin yaptığı) farklıdır — bkz `INSTALLATION_PLAYBOOK.md`.
Geliştirici ortamı tek kiracılı on-premise modelin birebir aynısıdır
(pivot sonrası), sadece local makinende.

Son güncelleme: 2026-04-23.

## 1. Ön gereksinimler

| Araç | Sürüm | Not |
|---|---|---|
| Node.js | ≥ 20 | gateway + customer-pwa + cashier + waiter |
| Docker | ≥ 24 | Postgres, Redis, Odoo |
| Docker Compose | ≥ 2.20 | |
| Python | 3.11 | Odoo 17 bu sürümü bekler; modül debug için yerelde |
| git | ≥ 2.40 | |

macOS'ta `brew install node python@3.11 docker`. Linux'ta dağıtım paket
yöneticisinden.

**Bellek:** En az 8 GB RAM tavsiye. Odoo + Postgres + gateway + React
dev server'lar aynı anda ~3 GB tüketebilir.

## 2. Repo'yu klonla

```sh
git clone git@github.com:hashtap/hashtap.git
cd hashtap
```

## 3. `.env` dosyası

`.env.example`'dan türet:

```sh
cp .env.example .env
```

Dev için minimum ayarlar:
- `IYZICO_API_KEY` / `IYZICO_SECRET` — iyzico sandbox panelinden (veya
  `mock` provider kullan, aşağıda açıklandı).
- `EFATURA_PROVIDER=mock` — dev'de gerçek Foriba yok.
- `POSTGRES_PASSWORD` — güçlü rastgele.

Prod'daki secret'lar installer wizard tarafından toplanır; dev'de `.env`
git'e düşmez (`.gitignore`'da).

## 4. Altyapı servisleri

Tek docker-compose ile Postgres + Redis + Odoo + Mailpit ayağa kalkar:

```sh
docker compose -f infra/odoo/docker-compose.yml up -d
```

İlk çalıştırma Odoo imajını çekerken 2-3 dk sürer. `docker compose ps`
ile durumu gör.

Kontrol URL'leri:
- Odoo: `http://localhost:8069`
- Mailpit: `http://localhost:8025`
- Postgres: `localhost:5432` (user: `hashtap`, password: `hashtap`)

## 5. Odoo DB'sini ilk kez oluşturma

Dev için tek DB (`hashtap`):

```sh
docker compose -f infra/odoo/docker-compose.yml exec odoo \
  odoo -d hashtap \
       -i hashtap_pos,hashtap_theme \
       --stop-after-init \
       --db_host=odoo-db --db_user=hashtap --db_password=hashtap
```

Veya Odoo'nun `/web/database/manager` arayüzünden:
- Master password: `.env`'deki `ODOO_MASTER_PASSWORD`
- Database name: `hashtap`
- Email / password: istediğin
- Language: Turkish
- Country: Turkey
- Demo data: evet (dev için faydalı)

Sonra Apps menüsünden `hashtap_pos` ve `hashtap_theme` modüllerini
install et.

## 6. `hashtap_pos` modülünü canlı değiştirme

Modül kaynağı `odoo-addons/hashtap_pos/`. Docker compose bu dizini
Odoo container'ına mount eder. Kod değişikliğinden sonra:

```sh
# Hızlı yol: sadece modülü güncelle
docker compose exec odoo odoo -d hashtap -u hashtap_pos --stop-after-init
```

Dev modunda Odoo'yu `--dev=all` ile başlatıp otomatik reload
kullanabilirsin (`docker-compose.override.yml`'de açık). XML/view
değişiklikleri otomatik algılanır.

## 7. Customer PWA

```sh
cd apps/customer-pwa
npm install
npm run dev
```

`http://localhost:5173`'te açılır. Bir test masası için QR slug'ı ile:
`http://localhost:5173/t/<table_slug>` (Odoo'da masa oluşturunca
QR slug görünür).

## 8. Gateway API

```sh
cd apps/api
npm install
npm run dev
```

`http://localhost:4000`'de Fastify. Customer PWA'nın
`.env.development`'ında `VITE_API_BASE_URL=http://localhost:4000` olmalı.

## 9. Cashier uygulaması (faz 14 geldikten sonra)

```sh
cd apps/cashier
npm install
npm run dev
```

`http://localhost:3001`. Bir staff kullanıcıyla login olunur.

## 10. Waiter uygulaması (faz 15 geldikten sonra)

```sh
cd apps/waiter
npm install
npm run dev
```

`http://localhost:3002`. Tablet simülasyonu için Chrome DevTools'ta
cihaz mobile mode.

## 11. Print-bridge

Dev'de genelde gereksiz (yazıcı yok). Test için docker-compose'a "dummy"
printer servisi eklenir (faz 6b geldiğinde).

## 12. Tipik dev döngüsü

Her terminali açık tut:

```sh
# Terminal 1: altyapı (Odoo + Postgres + Redis)
docker compose -f infra/odoo/docker-compose.yml up

# Terminal 2: customer PWA
cd apps/customer-pwa && npm run dev

# Terminal 3: gateway
cd apps/api && npm run dev

# Terminal 4: Odoo modül iterasyonu (dev=all modunda çalışıyorsa gerek yok)
docker compose exec odoo odoo -d hashtap -u hashtap_pos --stop-after-init
```

## 13. Test koşma

### Odoo modül testleri

```sh
docker compose exec odoo odoo -d hashtap_test \
    -i hashtap_pos --test-enable --stop-after-init --log-level=test
```

Ayrı bir `hashtap_test` DB'si — dev DB'yi bozmasın.

### Gateway testleri

```sh
cd apps/api
npm test
```

### PWA testleri

```sh
cd apps/customer-pwa
npm test
```

### E2E

```sh
npm run e2e
```

## 14. Odoo developer mode

Login sonrası URL'e `?debug=1` ekle veya Ayarlar → Developer Mode.
Model / view / domain inspector'ları açılır. Geliştirme esnasında
zorunlu; restoranda kapalı tutulur.

## 15. Yaygın sorunlar

### "Database does not exist"
Odoo container'ı Postgres'i bekliyor olabilir. `docker compose logs odoo`
kontrol et. Postgres `healthy` olduktan sonra Odoo başlar.

### "Module not found: hashtap_pos"
`addons_path` container'a yanlış mount edilmiş.
`infra/odoo/docker-compose.yml`'de `odoo-addons:/mnt/extra-addons` volume'u
kontrol et.

### Customer PWA gateway'e ulaşamıyor
Gateway çalışıyor mu? Gateway Odoo'ya container network içinden
`http://odoo:8069`, host'tan `http://localhost:8069`.

### Modül güncellemesi yansımıyor
`--dev=all` açık mı? Açık değilse `-u hashtap_pos --stop-after-init` ile
manuel update gerekir.

### Odoo çok yavaş
Default 1 worker. `docker-compose.override.yml`'de `workers: 2`
yapabilirsin. Dev'de performans kritik değil.

## 16. Dev seed verisi

Seed: `odoo-addons/hashtap_pos/data/demo_data.xml` — örnek menü, masa,
kategoriler. Sadece `--load-demo-data` flag'iyle açık DB'de yüklenir.

Mock provider seed'i:
```sh
docker compose exec odoo python /mnt/extra-addons/hashtap_pos/scripts/seed_earsiv_mock.py
```

## 17. Editor / IDE

- VS Code önerisi: Python extension + ESLint + TypeScript + Odoo XML
  snippets.
- `.vscode/settings.json` repo'da (auto-format, line length).

## 18. Git hooks

Repo'da `.husky/` hook'ları:
- `pre-commit`: lint + typecheck.
- `commit-msg`: Conventional Commits.

`npm install` sonrası otomatik kurulur.

## 19. Temiz slate (her şeyi sıfırla)

```sh
docker compose -f infra/odoo/docker-compose.yml down -v
# -v tüm volume'ları siler (DB, filestore dahil)
docker compose -f infra/odoo/docker-compose.yml up -d
# DB'yi yeniden oluştur (§5)
```

## 20. Restoran kurulumu ile farkları

Dev ortam restoran kurulumu ile **mimari olarak aynı** (tek kiracı,
tek DB, local Docker). Farklar:

| Boyut | Dev | Restoran kurulumu |
|---|---|---|
| Erişim | localhost | `*.hashtap.local` (mDNS) + `qr.<slug>.hashtap.app` |
| TLS | yok | Caddy yerel CA + Cloudflare Tunnel |
| Uzaktan destek | yok | Tailscale |
| Yedekleme | yok | restic gecelik → B2 |
| Monitoring | yok | HashTap ops heartbeat |
| Güncelleme | manuel | Watchtower gece 04:00 |
| Kullanıcı sayısı | dev kendisi | 5-20 (restoran personeli) |

Dev'in amacı kod yazmak; prod'un amacı restoran işletmek. Kod aynı,
altyapı farklı.
