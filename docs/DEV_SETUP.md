# Geliştirici Kurulumu

Sıfırdan HashTap'i kendi makinenizde çalıştırmak için adım adım kılavuz. "Clone et, bir saatte ayakta olsun" hedefi.

## 1. Ön gereksinimler

| Araç | Sürüm | Not |
|---|---|---|
| Node.js | ≥ 20 | gateway + customer-pwa için |
| Docker | ≥ 24 | Postgres, Redis, Odoo |
| Docker Compose | ≥ 2.20 | |
| Python | 3.11 | Odoo 17 resmi olarak bu sürümü bekler; sadece modül debug için yerelde gerekebilir |
| git | ≥ 2.40 | |

macOS'ta `brew install node python@3.11 docker`. Linux'ta dağıtım paket yöneticisinden.

**Bellek:** En az 8 GB RAM tavsiye. Odoo + Postgres + gateway aynı anda ~2 GB tüketebilir.

## 2. Repo'yu klonla

```sh
git clone git@github.com:hashtap/hashtap.git  # ileride
cd hashtap
```

## 3. Gizli bilgiler

`.env` dosyasını `.env.example`'dan türet:

```sh
cp .env.example .env
```

İçindeki her `CHANGEME` değerini doldur. Dev için minimum:
- `IYZICO_API_KEY` / `IYZICO_SECRET` — iyzico sandbox panelinden.
- `EFATURA_PROVIDER=mock` — MVP öncesi gerçek sağlayıcıya bağlanma.
- `POSTGRES_PASSWORD` — güçlü rastgele.

Prod'daki secret'lar farklı kaynaktan gelir (vault). Dev'de `.env` git'e düşmez (`.gitignore`'da).

## 4. Altyapı servisleri

Postgres + Redis + Adminer + Odoo'yu tek docker-compose ile kaldır.

```sh
docker compose -f infra/docker-compose.yml up -d
```

İlk çalıştırma Odoo imajını çekerken 2-3 dk sürer. `docker compose ps` ile durumu gör.

Kontrol URL'leri:
- Odoo: `http://localhost:8069`
- Adminer: `http://localhost:8081`
- Postgres: `localhost:5432` (kullanıcı: `hashtap`, şifre: `hashtap`)

## 5. Odoo DB'sini ilk kez oluşturma

Dev için tek bir "demo kiracı" DB'si yeter.

```sh
# Odoo container'ına gir, DB oluştur ve modülleri yükle
docker compose -f infra/docker-compose.yml exec odoo \
  odoo -d demo -i hashtap_pos -i hashtap_theme --stop-after-init \
       --db_host=postgres --db_user=hashtap --db_password=hashtap
```

Veya tarayıcıdan `/web/database/manager` → "Create Database":
- Master password: `.env`'deki `ODOO_MASTER_PASSWORD`.
- Database name: `demo`.
- Email / password: istediğin.
- Language: Turkish.
- Country: Turkey.
- Demo data: evet (dev için).

Oluştuktan sonra Apps menüsünden `hashtap_pos` ve `hashtap_theme` modüllerini install et.

## 6. `hashtap_pos` modülünü canlı değiştirme

Modül kaynağı `odoo-addons/hashtap_pos/`. docker-compose'da bu dizin Odoo container'ına mount edilir. Kod değişikliğinden sonra:

```sh
# Sadece modülü yeniden yükle (hızlı)
docker compose exec odoo odoo -d demo -u hashtap_pos --stop-after-init
```

Dev modunda Odoo'yu `--dev=all` ile başlatıp otomatik reload kullanabilirsin (`docker-compose.override.yml`'de açılı). XML/view değişiklikleri otomatik algılanır.

## 7. Customer PWA

```sh
cd apps/customer-pwa
npm install
npm run dev
```

`http://localhost:5173`'te açılır. `http://localhost:5173/r/demo/t/t42` gibi bir URL ile menü sayfası test edilir (Odoo'da `demo` kiracısı ve t42 masa slug'ı ayarlıysa).

## 8. Gateway API

```sh
cd apps/api
npm install
npm run dev
```

`http://localhost:3000`'de Fastify. Customer PWA'nın `.env.development` dosyasında `VITE_API_BASE_URL=http://localhost:3000` olmalı.

## 9. Print-bridge

Dev'de print-bridge genelde gereksiz (yazıcı yok). Test için docker-compose'a bir "dummy" printer servisi ekleniyor (faz 6).

## 10. Typical dev loop

```sh
# Terminal 1: altyapı
docker compose -f infra/docker-compose.yml up

# Terminal 2: PWA
cd apps/customer-pwa && npm run dev

# Terminal 3: gateway
cd apps/api && npm run dev

# Terminal 4: Odoo modül iterasyonu
# kod değiştir → modül güncelle
watch -n 2 'docker compose exec -T odoo odoo -d demo -u hashtap_pos --stop-after-init' # dikkat: bu modun yerine dev=all öneriyoruz
```

## 11. Test koşma

### Modül testleri (Odoo TransactionCase)
```sh
docker compose exec odoo odoo -d demo_test \
    -i hashtap_pos --test-enable --stop-after-init --log-level=test
```

Ayrı bir `demo_test` DB'si kullan; demo DB'ni bozmasın.

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
# staged ortamı ayağa kaldır
npm run e2e
```

## 12. Odoo geliştirici modu

Giriş yaptıktan sonra URL'e `?debug=1` ekle (veya Ayarlar → Developer Mode). Model/view/domain inspector'ları açılır. Geliştirme esnasında zorunlu; prod'da kullanıcı görmez.

## 13. Yaygın sorunlar

### "Database does not exist"
Odoo container'ı Postgres'i bekliyor olabilir. `docker compose logs odoo` ile doğrula. Postgres `healthy` olduktan sonra Odoo başlar.

### "Module not found: hashtap_pos"
`addons_path` container'a yanlış mount edilmiş. `docker-compose.yml` içinde `odoo-addons:/mnt/extra-addons` volume'u kontrol et.

### Customer PWA Odoo'ya konuşamıyor
Gateway'in çalıştığından emin ol. Gateway Odoo'ya `http://odoo:8069` (docker network içinden) veya `http://localhost:8069` (host'tan) üzerinden konuşur — gateway dev modunda host'ta koştuğu için `localhost:8069` kullanır.

### Modül güncellemesi yansımıyor
`--dev=all` açık mı? Açık değilse `-u hashtap_pos --stop-after-init` ile manuel update gerekir.

### Odoo çok yavaş
Default 1 worker. `docker-compose.override.yml`'de `workers: 2` yapabilirsin. Dev'de performans kritik değil.

## 14. Dev verisi

Seed: `odoo-addons/hashtap_pos/data/demo_data.xml` içinde örnek menü, masa, kategoriler. Bu sadece demo data flag'iyle açık DB'de yüklenir.

## 15. Editör / IDE

- VS Code öneri: Python extension + ESLint + TypeScript + Odoo XML snippets.
- `.vscode/settings.json` repo'da (auto-format, line length).

## 16. Git hooks

Repo'da `.husky/` hook'ları:
- `pre-commit`: lint + typecheck.
- `commit-msg`: Conventional Commits formatı.

`npm install` sonrası otomatik kurulur.

## 17. Acil durum yeniden başlatma

Her şey kafayı yedi? Temiz slate:

```sh
docker compose -f infra/docker-compose.yml down -v   # -v volume'ları siler, tüm DB gider
docker compose -f infra/docker-compose.yml up -d
# DB'yi yeniden oluştur (§5)
```
