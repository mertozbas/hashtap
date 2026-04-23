# HashTap — Mimari

Bu doküman HashTap'in teknik büyük resmini tanımlar: bileşenler, ağ
topolojisi, veri akışı, hata modları. **On-premise tek-kiracı** modeline
göre yazılmıştır (ADR-0011).

Son güncelleme: 2026-04-23.

İlgili dokümanlar:
- `adr/0011-on-premise-deployment.md` — karar
- `BUSINESS_MODEL.md` — iş modeli
- `INSTALLATION_PLAYBOOK.md` — IT ekibi kurulum adımları
- `OPERATIONS.md` — kurulum sonrası destek ve güncelleme
- `DESIGN_SYSTEM.md` — UI tasarım dili
- `apps/CASHIER.md`, `apps/WAITER.md` — yeni uygulama şartnameleri

## 1. Büyük resim

```
┌─────────────────────────────── RESTORAN (LOCAL) ───────────────────────────────┐
│                                                                                │
│    ┌──────────────────────────────────────────────────────────────────────┐    │
│    │  HashTap Kasa PC (Windows 10+/11 veya Ubuntu 22+)                    │    │
│    │  ┌──────────────────────────────────────────────────────────────┐    │    │
│    │  │  Docker Compose Stack                                        │    │    │
│    │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │    │    │
│    │  │  │  Odoo 17 │  │ Postgres │  │  Redis   │  │   Fastify    │  │    │    │
│    │  │  │ hashtap_ │  │    16    │  │ queue+   │  │   Gateway    │  │    │    │
│    │  │  │   pos    │  │          │  │ ratelim  │  │   (BFF)      │  │    │    │
│    │  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │    │    │
│    │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │    │    │
│    │  │  │  Cashier │  │  Waiter  │  │   KDS    │  │  Customer    │  │    │    │
│    │  │  │  App     │  │  App     │  │  (Odoo)  │  │  PWA         │  │    │    │
│    │  │  │  (React) │  │  (React) │  │          │  │  (React)     │  │    │    │
│    │  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │    │    │
│    │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │    │    │
│    │  │  │  Print   │  │ Backup   │  │Tailscale │                    │    │    │
│    │  │  │ Bridge   │  │ (restic) │  │  agent   │                    │    │    │
│    │  │  └──────────┘  └──────────┘  └──────────┘                    │    │    │
│    │  └──────────────────────────────────────────────────────────────┘    │    │
│    │                                                                      │    │
│    │  Caddy (reverse proxy + local TLS) — *.local yönlendirme             │    │
│    └──────────────────────────────────────────────────────────────────────┘    │
│                                                                                │
│        ▲       ▲         ▲            ▲                     ▲                  │
│        │       │         │            │                     │                  │
│    ┌──────┐ ┌──────┐ ┌────────┐ ┌──────────┐ ┌──────────────────────────┐     │
│    │Kasa  │ │Garson│ │Mutfak  │ │Termal    │ │ Müşteri (QR)             │     │
│    │Ekranı│ │Tablet│ │Ekranı  │ │Yazıcı    │ │ - Restoran Wi-Fi, veya   │     │
│    │dokunm│ │Android│ │dokunm │ │(Ethernet │ │ - 4G + Cloudflare Tunnel │     │
│    └──────┘ └──────┘ └────────┘ └──────────┘ └──────────────────────────┘     │
│                                                                                │
│                            Restoran LAN (ethernet + Wi-Fi)                     │
└────────────────────────────┬───────────────────────────────────────────────────┘
                             │
                             │ outbound HTTPS (internet)
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     ┌────────────┐   ┌────────────┐   ┌────────────┐
     │  iyzico    │   │  Foriba    │   │  Cloudflare│
     │  (ödeme)   │   │  (e-Arşiv) │   │  Tunnel    │
     └────────────┘   └────────────┘   └─────┬──────┘
                                             │ (müşteri QR erişimi)
                                             ▼
                                       ┌──────────────┐
                                       │ Müşteri 4G   │
                                       └──────────────┘

┌──────────────────────────────── HASHTAP CLOUD (OPS) ───────────────────────────┐
│                                                                                │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│    │  Docker      │  │  Monitoring  │  │  Tailscale   │  │  Backup      │     │
│    │  Registry    │  │  (Uptime     │  │  Headscale   │  │  (S3/B2)     │     │
│    │  (updates)   │  │   Kuma)      │  │  (VPN ctrl)  │  │  (restic dep)│     │
│    └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                                │
│  Bu bileşenler MÜŞTERİ VERİSİ içermez (sadece telemetri, yedek ciphertext,    │
│  image'lar, VPN metadata). Küçük bir VPS ile yürütülür (Hetzner ~€5-20/ay).   │
└────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Bileşenler ve sorumluluklar

### 2.1 Restoran-içi (local)

#### 2.1.1 HashTap Kasa PC (ana sunucu)

- **Donanım önerisi (minimum):**
  - CPU: 4 çekirdek x86_64 veya ARM64
  - RAM: 8 GB (16 GB önerilir)
  - Disk: 256 GB SSD (Odoo filestore + Postgres için)
  - Ağ: Ethernet (ana) + Wi-Fi (yedek)
  - UPS: önerilir (20+ dk)
- **İşletim sistemi:**
  - Birincil hedef: Ubuntu Server 22.04 LTS (tercihen)
  - Desteklenen: Windows 10/11 Pro (Docker Desktop gerekli)
  - Hedef donanım faz 2'de HashTap markalı fanless POS PC
- **Rol:** Tüm HashTap servislerinin Docker Compose ile çalıştığı tek
  makine.

#### 2.1.2 Docker Compose Stack

Tek `docker-compose.yml` — tüm servisler tek komutla ayağa kalkıyor.

| Servis | Image | Port (host) | Sorumluluğu |
|---|---|---|---|
| `odoo` | `hashtap/odoo:17-stable` | 8069, 8072 | Backend + admin UI |
| `postgres` | `postgres:16-alpine` | 5432 (localhost) | Tek DB: `hashtap` |
| `redis` | `redis:7-alpine` | 6379 (localhost) | queue_job, rate-limit |
| `gateway` | `hashtap/gateway:stable` | 4000 | Fastify BFF |
| `cashier` | `hashtap/cashier:stable` | 3001 | React kasa uygulaması |
| `waiter` | `hashtap/waiter:stable` | 3002 | React garson uygulaması |
| `customer-pwa` | `hashtap/customer-pwa:stable` | 3003 | Müşteri QR PWA |
| `print-bridge` | `hashtap/print-bridge:stable` | WS | Yazıcı köprüsü |
| `caddy` | `caddy:2` | 80, 443 | Reverse proxy + local TLS |
| `backup` | `hashtap/backup:stable` | — | restic gecelik yedek |
| `tailscale` | `tailscale/tailscale` | — | VPN ajanı |

Opsiyonel servisler:
- `mailpit` — dev/debug için SMTP yakalama
- `watchtower` — otomatik Docker image güncelleyici (alternatif: kendi daemon'umuz)

**Volume stratejisi:**
- `odoo-filestore` → `/var/lib/odoo/filestore` (attachment'lar, PDF'ler)
- `postgres-data` → `/var/lib/postgresql/data`
- `redis-data` → ephemeral (queue state yeniden kurulabilir)
- `backup-cache` → restic lokal snapshot cache

#### 2.1.3 Caddy reverse proxy

Tüm dış erişim Caddy üzerinden geçer:

```
http://kasa.hashtap.local       → cashier
http://garson.hashtap.local     → waiter
http://mutfak.hashtap.local     → Odoo (/hashtap/kds)
http://admin.hashtap.local      → Odoo (backend)
https://qr.<slug>.hashtap.app   → Cloudflare Tunnel → customer-pwa
```

- **Yerel TLS:** `mkcert` veya Caddy'nin yerel CA'sıyla `.local` alanında
  HTTPS. Tabletler/telefonlar root CA'yı güvenerek sertifika uyarısı
  almaz.
- **mDNS:** Avahi/Bonjour ile `*.hashtap.local` adları otomatik
  çözümlenir. Cashier PC sabit IP olsa da mDNS cihazlara kolaylık.
- **Cloudflare Tunnel:** Ana Caddy konfigürasyonunda outbound tunnel
  tanımı; public hostname → local customer-pwa servisine mapping.

#### 2.1.4 Çevre birimler (peripherals)

| Cihaz | Bağlantı | Konfigürasyon |
|---|---|---|
| Kasa ekranı (dokunmatik, 15-21") | HDMI + USB (PC'ye) veya fullscreen Chrome Kiosk | Cashier app |
| Garson tableti (Android 8"-10") | Wi-Fi | Chrome PWA veya Android WebView |
| KDS ekranı (21-27") | HDMI veya Ethernet Mini-PC | Odoo /hashtap/kds fullscreen |
| Termal yazıcı (80mm ESC/POS) | Ethernet (tercih) veya USB | Print-bridge |
| Müşteri telefonu | Restoran Wi-Fi veya 4G | Customer PWA (tarayıcıda) |

### 2.2 Cloud bileşenleri (HashTap-tarafı, küçük)

Bulutta tutulan bileşenler **operasyonel**, müşteri verisi değildir:

#### 2.2.1 Docker Registry

- Tüm `hashtap/*` image'ların depolandığı yer.
- Seçenekler: Docker Hub private repo, GitHub Container Registry, veya
  self-hosted Harbor.
- **Tag stratejisi:** `latest` (iç test), `canary` (1-2 restoran), `stable`
  (tüm flota). Her restoran sadece `stable`'dan pull eder.

#### 2.2.2 Monitoring Dashboard

- **Uptime Kuma** (self-hosted) veya custom dashboard.
- Her kurulum outbound heartbeat atar:
  - Endpoint: `POST https://ops.hashtap.app/v1/heartbeat`
  - Payload: kurulum ID, versiyon, uptime, disk %, son hata sayısı.
  - **Müşteri verisi yok** — sadece operasyon metrikleri.
- Uyarı: restoran 10 dk heartbeat atmazsa PagerDuty benzeri bir rotaya
  ping düşer.

#### 2.2.3 Tailscale / Headscale (VPN kontrol düzlemi)

- Her kurulum Tailscale node'u; HashTap destek ekibi ACL'e göre bağlanır.
- Self-hosted alternatif: Headscale, Hetzner VPS'te.
- Restoran onay olmadan shell açılmaz; açıldığında loglanır.

#### 2.2.4 Backup Depo

- Restic repository: S3-uyumlu (Backblaze B2 önerilir, maliyet düşük).
- Her kurulumun kendi repo'su; şifreleme anahtarı kurulum-başı
  (dual-custody: HashTap KMS + restoran kasası).
- Restoration runbook: `OPERATIONS.md` §5.

#### 2.2.5 Install Wizard Backend

- Installer CLI kurulum sırasında HashTap'a kayıt atar (kurulum ID,
  müşteri ismi, abonelik türü).
- Backend: küçük bir Fastify servis + Postgres (CRM benzeri).
- Veya: HashTap'in kendi Odoo'sunda müşteri kaydı (self-hosting).

## 3. Veri akışları

### 3.1 Müşteri QR akışı (happy path)

```
1. Müşteri masadaki QR'yi okutur
   → qr.<restoran-slug>.hashtap.app/t/<table-slug>
2. DNS Cloudflare'e; CF Tunnel restoranın PC'sine uzanır
3. Restoran PC'sinde Caddy → Customer PWA statik dosyaları
4. PWA yüklenir, GET /api/menu/<table-slug> → Gateway → Odoo → menu JSON
5. Müşteri sepet hazırlar, POST /api/order
6. Gateway → Odoo (/hashtap/order) → hashtap.order (state=placed)
7. Müşteri ödeme seçer, POST /api/payment/3ds/start
8. Gateway iyzico Checkout session açar, redirect URL döner
9. Müşteri iframe'de banka 3DS'i yapar
10. iyzico webhook: Gateway'e callback
11. Gateway HMAC doğrular, Odoo'ya /hashtap/payment/3ds/callback
12. Odoo: payment_state=captured, e-Arşiv queue_job tetikler
13. e-Arşiv success olursa order.state=kitchen_sent
14. KDS bu orderi görür, print-bridge yazıcıya basar
15. Müşteri PWA polling: order.state=ready → bildirim
```

Offline davranışı:
- Adım 2'deki tunnel kopuksa: müşteri Cloudflare 5xx görür. Eğer
  restoran Wi-Fi'sinde ise alternatif local URL çalışır.
- Adım 10'daki webhook geç gelirse: Gateway 5 dk sonra iyzico API'sini
  poll eder; yine pending ise order iptal.
- Adım 13'teki e-Arşiv fail: fail-close, order mutfağa gitmez; retry kuyrukta.

### 3.2 Kasa-içi akış (kasiyerin manuel siparişi)

```
1. Kasiyer Cashier app'inde "Yeni sipariş"
2. Cashier → Gateway /api/order (POST, staff token)
3. Gateway → Odoo → order (state=placed, source=cashier)
4. Ürünler seçilir, "Mutfağa gönder"
5. Order state=kitchen_sent (e-Arşiv akışı cashier modda ödeme sonrasına
   ertelenir; pay-at-counter senaryosu)
6. Müşteri ayrılırken ödeme: kart veya nakit
7. Cashier → Gateway /api/payment/offline (nakit için) veya
   /api/payment/3ds/start (kart için)
8. Odoo: payment_state=captured, earsiv sync
```

### 3.3 Garson akışı (waiter)

```
1. Garson tableti açar, table list görür
2. Bir masa seçer → waiter/table/<id>
3. Menüden ürün ekler → client-side sepet (IndexedDB)
4. "Mutfağa gönder" → POST /api/order (staff token)
5. Odoo: order.state=kitchen_sent (hemen; garson=onaylı akış)
6. Sipariş KDS'e düşer, yazıcıya basılır
7. Ödeme zamanı: garson "Adisyon al" → Cashier'a bildirim
8. Ödeme kasada yapılır (veya tableti ile iyzico Checkout)
```

### 3.4 Güncelleme akışı

```
1. HashTap ekibi yeni image build eder, Registry'ye push: canary tag
2. 1-2 canary restoranın Watchtower'ı 04:00'te canary:latest pull eder
3. 48 saat sorunsuz çalışırsa: tag stable'a taşınır
4. Tüm flota 04:00'te stable:latest pull eder
5. Sorun varsa: stable tag eski sürüme geri döndürülür, flota otomatik
   rollback
```

### 3.5 Yedekleme akışı

```
1. 03:00 — Postgres dump: `pg_dump -Fc hashtap > /backup/pg.dump`
2. 03:15 — Odoo filestore snapshot'ı
3. 03:30 — restic backup --exclude-caches /backup /odoo/filestore
4. 04:00 — restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 12
5. Outbound: B2'ye şifreli chunk'lar (restic halleder)
6. Başarı/hata telemetrisi HashTap monitoring'e
```

## 4. Ağ topolojisi

### 4.1 Restoran LAN

```
                 Internet
                    │
                 [Router]  ← restoran ISP'si
                    │
            192.168.1.0/24
        ┌───────────┼───────────┬──────────────┐
        │           │           │              │
   [Kasa PC]   [KDS Mini-PC] [Yazıcı]   [Wi-Fi AP]
   .1.10       .1.11          .1.20      .1.1
                                            │
                                     ┌──────┼──────┐
                                  [Tablet] [Müşteri] [Tablet]
                                  .1.51    .1.52      .1.53
```

### 4.2 Adres şeması (öneri)

| Cihaz | IP (sabit) | DNS (mDNS) |
|---|---|---|
| Kasa PC (ana sunucu) | 192.168.1.10 | `hashtap.local` |
| KDS Mini-PC | 192.168.1.11 | (sadece tarayıcı client, DNS gerek yok) |
| Termal yazıcı 1 | 192.168.1.20 | (print-bridge config'inde) |
| Termal yazıcı 2 (bar) | 192.168.1.21 | (print-bridge config'inde) |
| Wi-Fi AP | 192.168.1.1 | — |
| Tabletler | DHCP pool | — |

### 4.3 Firewall / port politikası

Kasa PC'de (ufw veya Windows Firewall):
- **Inbound (LAN'dan):**
  - 80, 443 → Caddy (cashier, waiter, KDS)
  - 8069, 8072 → Odoo (admin paneli — opsiyonel, LAN içinde yeterli)
- **Inbound (internet'ten):** Hiçbir şey. Port forwarding yok.
- **Outbound:**
  - 443 → iyzico, Foriba, Cloudflare, HashTap ops, update registry
  - Tailscale port 41641 (UDP)

### 4.4 Müşteri QR erişimi

İki seçenek; kurulumda biri aktif edilir:

**Seçenek 1: Cloudflare Tunnel (önerilen)**
```
Müşteri 4G/Wi-Fi → https://qr.<slug>.hashtap.app
                 → Cloudflare Edge
                 → Cloudflare Tunnel
                 → Restoran PC'si (Caddy)
                 → Customer PWA
```
- Avantaj: müşteri telefonu restoranın Wi-Fi'sine bağlanmak zorunda
  değil.
- Maliyet: Cloudflare Tunnel ücretsiz (plan sınırlarında).
- Ek DNS: `*.hashtap.app` alt alan.

**Seçenek 2: Yerel Wi-Fi**
```
Müşteri telefon → Restoran Wi-Fi (captive portal)
                → http://hashtap.local
                → Customer PWA
```
- Avantaj: internet olmasa da çalışır.
- Dezavantaj: müşteri Wi-Fi şifresi ister; bazı telefonlar captive
  portal'da sorun yaşar.
- **Mutlaka ikisi birden** kurulmaz — biri seçilir; restoranın koşullarına
  göre.

## 5. Veritabanı ve state yönetimi

### 5.1 Tek DB — `hashtap`

- Postgres 16, tek DB (`hashtap`).
- Odoo bağlandığı DB: `db_filter = ^hashtap$`.
- Multi-tenant filter'ları ve `tenant_id` sütunları yok.

### 5.2 Başlatma (ilk kurulum)

```
1. Postgres container ayağa kalkar (boş)
2. Odoo container başlar, "hashtap" DB yoksa oluşturur
3. Installer script:
   odoo -d hashtap -i hashtap_pos,hashtap_theme,account,stock,...
        --stop-after-init
4. Initial fixture: iyzico/foriba provider config'leri (boş, wizard'dan
   dolacak)
5. Admin user oluştur, şifresi kurulum sonunda teslim edilir
```

### 5.3 Migration stratejisi

- Odoo migration'ları standart: `odoo -d hashtap -u hashtap_pos
  --stop-after-init`
- Update Docker image'ı entrypoint'inde otomatik migration yapar.
- Schema değişiklikleri her zaman forward-compatible olur (stable tag
  rollback'i destekler).

## 6. Güvenlik

### 6.1 Tehdit modeli

- **İç ağ saldırganı** (restoran Wi-Fi'sinde kötü müşteri): Caddy
  sadece açık servisleri expose eder. Admin paneli firewall ile LAN'a
  kısıtlanmıştır. Tabletlerde staff token süreli.
- **Restoran çalışanı kötüye kullanımı:** Odoo'nun RBAC'i (`groups` +
  `ir.model.access.csv`) role-based erişim. Audit log.
- **Dış saldırgan (internet):** Sadece Cloudflare Tunnel + Tailscale
  dış yüzey. Port forwarding yok.
- **Fiziksel cihaz hırsızlığı:** Disk şifreleme (LUKS Linux'ta, BitLocker
  Windows'ta) önerilir; installer bunu setup sırasında teklif eder.

### 6.2 Secret yönetimi

- Kurulum başına secret'lar `.env` dosyasında (salt-shakered):
  - `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`
  - `EFATURA_USERNAME`, `EFATURA_PASSWORD`
  - `JWT_SECRET`, `SESSION_SECRET`
  - `RESTIC_PASSWORD` (yedek şifreleme anahtarı)
  - `CLOUDFLARE_TUNNEL_TOKEN`
  - `TAILSCALE_AUTHKEY`
- `.env` root:700, kök yetkili; Docker secret mount ile.
- HashTap KMS'te (cloud): secret backup'ı (zorunlu restore için).

### 6.3 Sertifika yönetimi

- Local `.local` alanında: Caddy'nin yerel CA'sı veya `mkcert`. İlk
  kurulumda CA kasa PC'sine ve tabletlere güvenilir olarak eklenir
  (installer script otomatize eder).
- Public alan (`qr.<slug>.hashtap.app`): Cloudflare yönetir.

### 6.4 PCI uyumu

- iyzico Checkout Form kullanılıyor → PCI SAQ-A (en hafif kategori).
- HashTap yazılımı kart PAN veya CVV görmez. `hashtap.payment.transaction`
  sadece masked PAN + provider ref saklar.
- Bu pozisyon pivot ile değişmedi; local kurulumda da aynı.

### 6.5 KVKK

- Müşteri verileri (sipariş, adı varsa, telefonu varsa) sadece
  restoran PC'sinde ve şifreli yedekte.
- HashTap cloud monitoring: **müşteri verisi yok**. Sadece operasyon
  metrikleri.
- Sözleşmede veri işleyen/sahibi ayrımı: restoran veri sahibi, HashTap
  veri işleyen (yedekleme kapsamında).
- Silme talebi: restoran kendi ORM'inde siler; yedekten çıkmasi için
  retention policy'e göre (12 ay sonra).

## 7. Hata modları

| Senaryo | Davranış |
|---|---|
| Kasa PC kapandı | KDS, tablet, kasa ekranı çalışmıyor → restart gerekir. Mümkünse UPS ve auto-start Docker Compose |
| Internet kesildi | Local sipariş akışı çalışır, KDS + yazıcı çalışır. Ödeme (kart) çalışmaz → nakit veya "internet gelince tahsil" |
| iyzico down | Ödeme başlatılamıyor → kullanıcıya "geçici hata" → alternatif ödeme yolu |
| Foriba down | order `paid_no_receipt`, mutfağa gitmez; retry kuyrukta; restoran alarmı |
| Yazıcı offline | Print-bridge kuyruğa alır; yazıcı online olunca basar |
| KDS ekranı crash | Kasa üzerinden mutfağa fiş basılmaya devam; ekran yenilendiğinde normal |
| Cloudflare Tunnel down | Müşteri QR dış erişim kopar; yerel Wi-Fi alternatif URL aktif ise çalışır |
| Tailscale bağlantısı kopar | Uzaktan destek geçici yok; restoran telefonla arar; Tailscale kendiliğinden yeniden bağlanır |
| Yedek başarısız | Monitoring uyarısı düşer; HashTap ekibi müdahale |
| Disk doldu | Monitoring uyarısı; installer'da auto-rotation yapılandırılmıştır |

## 8. Teknik kurallar

Bu kurallar pivot sonrası da aynen geçerli — bir kısmı pre-existing:

1. **Sunucu tarafı tek kaynaktır.** Cashier/Waiter/PWA'dan gelen veriye
   (fiyat, toplam) güvenme. Odoo yeniden hesaplar.
2. **Para `Kurus`.** Integer, TL cent. ADR-0003.
3. **Çok dilliyi baştan düşün.** TR + EN her form/string.
4. **Idempotency.** Ödeme, e-Arşiv, yazıcı — hepsi correlation_id ile.
5. **Fail-close e-Arşiv.** Regulatory gereklilik; esnetmiyoruz.
6. **Odoo core'una dokunma.** Inheritance + override. ADR-0005.
7. **Her kurulum tek kiracı.** `tenant_id` filter'ı yok. Tek DB.
8. **Cloud'daki her şey operasyonel.** Müşteri verisi cloud'a gitmez.
9. **Otomatik güncelleme varsayılan açık.** Müşteri kapatabilir ama
   önerilmez; SLA'da kapalı güncelleme riski belirtilir.
10. **Yedekleme zorunlu.** Installer olmadan kurulum kabul edilmez.

## 9. Gelecek düşünceler

- **HashTap markalı donanım bundle'ı** (faz 2 iş modeli)
- **Çoklu şube desteği** — aynı zincirdeki restoranların merkezi
  raporlama için HashTap bulutunda opsiyonel aggregation (yine müşteri
  verisi değil, denormalized rapor).
- **Yerel LLM entegrasyonu** — menü önerileri, müşteri yorumu analizi;
  local ONNX model, internet gerektirmeden.
- **SD kart/USB kurulum** — Raspberry Pi + SD imaj olarak ultra-basit
  kurulum.
- **Windows native uygulama** — Docker Desktop zorunluluğunu kaldırmak
  için Electron wrapper değerlendirme.
