# HashTap — Operations Rehberi

Bu doküman, kurulum sonrası HashTap'i canlı tutmak için gereken
operasyonel süreçleri tanımlar: uzaktan destek, izleme, yedekleme,
güncelleme, olay müdahalesi.

Hedef kitle: HashTap destek/ops ekibi, on-call mühendisler.

İlgili:
- `INSTALLATION_PLAYBOOK.md` — kurulum
- `ARCHITECTURE.md` — mimari
- `SECURITY.md` — güvenlik
- `BUSINESS_MODEL.md` §5 — destek seviyeleri

Son güncelleme: 2026-04-23.

## 1. Yönetici özeti

HashTap her restorana kurulduğunda, onunla birlikte şu operasyonel
altyapı devreye girer:

1. **Telemetri** — her restoran HashTap ops'a dakikalık heartbeat atar.
2. **Uzaktan erişim** — Tailscale ile destek ekibi bağlanabilir.
3. **Yedekleme** — gecelik şifreli restic → B2.
4. **Otomatik güncelleme** — Watchtower veya kendi daemon, gecelik.
5. **Olay yönetimi** — sınıflandırma, müdahale süresi, postmortem.

Her restoran için SLA:
- L3 (kritik, dükkan çalışmıyor) — 30 dk içinde ilk müdahale, 2 saat
  çözüm hedefi.
- L2 (ciddi, dükkan çalışıyor ama bir bileşen bozuk) — aynı iş günü
  içinde müdahale.
- L1 (kullanıcı hatası, iyileştirme) — 3 iş günü içinde.

## 2. Uzaktan destek (Tailscale)

### 2.1 Mimari

- Her restoran PC'sinde Tailscale ajanı çalışıyor.
- HashTap **Headscale** self-hosted VPN koordinatörü (Hetzner VPS'te)
  veya Tailscale SaaS business planı.
- Destek ekibi üyeleri kendi cihazlarından Tailscale'e bağlanır.
- ACL:
  - Destek ekibinin sadece port 22 (SSH) ve 8069 (Odoo) erişimi.
  - Restoran PC'si başka restoranı göremez (tag-based ACL).

### 2.2 Bağlanma akışı

```bash
# Destek mühendisi:
tailscale status                   # bağlı restoranları listele
ssh hashtap-ops@restaurant-<slug>  # kurulum-ID'si ile SSH

# Restoranda çalışan:
cd /opt/hashtap
docker-compose logs odoo --tail=100
docker-compose restart gateway
```

### 2.3 Erişim etiği

- **Müşteri onayı zorunluluğu:** Sözleşmede "arıza durumunda ön-onay"
  maddesi; kritik anda restoran sahibinden WhatsApp ile tek satır onay
  yeterli ("tamam, bağlan").
- **Her SSH oturumu loglanır:** `/var/log/hashtap/remote-access.log`
  → HashTap ops'a senkron.
- **Asla şifre değiştirme, sessiz sedasız eylem yapma.** Müşteriye
  bilgi ver, sonra aksiyon al.
- **PII görme minimizasyonu:** Müşteri siparişlerine gerekmedikçe
  bakma; log'larda müşteri telefonları maskele.

### 2.4 Acil durum erişimi

Tailscale tümüyle down ise:
1. Restoran sahibine telefonla ulaş, screen-share (AnyDesk/TeamViewer)
   iste.
2. Kurulumda AnyDesk fallback olarak yüklü — restoran sahibi başlatır,
   anahtarı paylaşır.
3. Son çare: saha ziyareti.

## 3. Monitoring ve telemetri

### 3.1 Heartbeat protokolü

Her restoran PC'si dakikada bir HTTP POST atar:

```
POST https://ops.hashtap.app/v1/heartbeat
Authorization: Bearer <installation-token>

{
  "installation_id": "rest-42",
  "slug": "kafe-cumhuriyet",
  "version": "1.3.2",
  "uptime_seconds": 86400,
  "disk_used_pct": 47,
  "memory_used_pct": 62,
  "services": {
    "odoo": "healthy",
    "postgres": "healthy",
    "redis": "healthy",
    "gateway": "healthy",
    "cashier": "healthy",
    "waiter": "healthy",
    "customer_pwa": "healthy",
    "print_bridge": "healthy",
    "caddy": "healthy"
  },
  "metrics_24h": {
    "orders_count": 142,
    "errors_count": 3,
    "avg_latency_ms": 87,
    "payment_success_rate": 0.98
  }
}
```

**Müşteri verisi yok** — sadece sayaçlar. Müşteri ismi, sipariş içeriği,
kart bilgisi kesinlikle gönderilmez.

### 3.2 Dashboard

- **Uptime Kuma** (self-hosted) veya custom Grafana.
- Her restoran için:
  - Son heartbeat ne zaman? (>10 dk ise kırmızı)
  - Hizmet durumları (11 servisten kaçı yeşil?)
  - Son 24 saat hata oranı
  - Ödeme başarı oranı
  - Disk doluluk (>%85 uyarı, >%95 kritik)
  - Son yedekleme durumu

- **Kritik uyarı kuralları:**
  - Heartbeat 10 dk yok → PagerDuty'ye
  - Hata oranı > %5 → Slack #ops kanalı
  - Disk > %90 → e-mail + Slack
  - Payment success < %95 → Slack + telefon
  - Yedekleme 2 gece üstüste fail → kritik uyarı

### 3.3 Log toplama

- Her Docker servisinin log'u local'de `/var/log/hashtap/` altında
  rotated (14 gün).
- Ciddi hatalar (`ERROR` seviyesi ve üstü) heartbeat'in yanında bir
  özet alanı olarak gönderilir.
- Canlı log stream Tailscale üstünden `ssh ... docker logs -f <svc>`.
- Alternatif: Loki/Grafana ile merkezi log aggregation (faz 2, eğer
  ölçek ihtiyacı doğarsa).

### 3.4 On-call rotası

İlk 3 pilot restoran dönemi:
- 1 mühendis 7/24 (kendisi biri).
- WhatsApp + telefon + PagerDuty.

Ölçek büyüyünce (10+ restoran):
- Hafta bazlı primary on-call + secondary backup.
- Mesai saatleri (09-18): tüm ekip müdahale eder.
- Gece (18-09): primary on-call.
- Hafta sonu: 24 saatlik vardiya rotasyonu.

## 4. Güncelleme stratejisi

### 4.1 Sürüm kategorileri

| Kategori | Ne içerir | Sıklık | Rollout süresi |
|---|---|---|---|
| **Patch** | Bug fix | Haftalık | 48 saat canary → flota |
| **Minor** | Küçük özellik | Aylık | 1 hafta canary → flota |
| **Major** | Büyük değişiklik, breaking | Yılda 1-2 | Her müşteri ile randevulu |

### 4.2 Image tag stratejisi

- `:dev` — iç geliştirme; restoranlarda ASLA.
- `:canary` — iç QA geçmiş, 1-2 gönüllü restoran test ediyor.
- `:stable` — tüm flota çeker.
- `:<version>` — semver (`1.3.2`) — audit için.

Her restoran `.env` içinde `HASHTAP_UPDATE_CHANNEL=stable` (default)
veya `canary` (gönüllü).

### 4.3 Rollout akışı

```
Gün 0: Build + iç test
  Image:1.3.3 → registry (canary tag)

Gün 0-2: Canary
  2 gönüllü restoran: gecelik 04:00'te canary:latest pull
  48 saat boyunca izleme
  Hata oranı < %1 ve regression yoksa → onayla

Gün 2: Onay
  Image:1.3.3 tagrlenir :stable olarak

Gün 3-4: Flota
  Tüm restoranlar gecelik 04:00'te stable:latest pull
  Her restoran migration'ları otomatik çalıştırır

Gün 3+: İzleme
  Hata oranı, performans dashboard'da izlenir
  Gerekirse rollback (bkz §4.5)
```

### 4.4 Migration dayanıklılığı

Her sürüm **forward + backward** compatibility'yi desteklemelidir:
- Schema değişikliklerinde: önce nullable sütun ekle, sonraki release'de
  not-null yap (iki aşamalı).
- API değişikliklerinde: eski endpoint'i en az bir minor boyunca tut.
- Odoo migration script'leri idempotent olmalı (iki kez çalıştırılabilir).

### 4.5 Rollback

Sorun tespit edilirse:

```bash
# HashTap ops tarafında:
# Stable tag'ı önceki sürüme geri döndür
docker pull hashtap/odoo:1.3.2
docker tag hashtap/odoo:1.3.2 hashtap/odoo:stable
docker push hashtap/odoo:stable

# Sonraki gece tüm restoranlar eski sürümü çeker (veya manuel forced
# restart)
```

Acil rollback (bir restoran tek başına):
```bash
# Tailscale ile restoran PC'sine bağlan:
ssh hashtap-ops@restaurant-<slug>
cd /opt/hashtap
docker-compose pull odoo:1.3.2
docker-compose up -d odoo
# log kontrol
docker logs odoo --tail=50
```

**Veri migration geri çevrilemezse:** restic'ten restore (bkz §5.4).
Bu nedenle her major release'ten önce ekstra snapshot alınır.

### 4.6 "Güncelleme yapma" modu

Restoran bakımı / yoğun sezon durumunda:
```
# .env:
HASHTAP_UPDATE_CHANNEL=manual
```
Bu mode'da otomatik pull yok; HashTap ops manual komutla güncellemeyi
tetikler. Restoran ile yazılı onay.

## 5. Yedekleme ve felaket kurtarma

### 5.1 Neyi yedekliyoruz

| Veri | Konum | Önemi | Yedekleme |
|---|---|---|---|
| Postgres DB | `/var/lib/postgresql/data` | Kritik | pg_dump + restic |
| Odoo filestore | `/var/lib/odoo/filestore` | Kritik | restic |
| Konfigürasyon | `/opt/hashtap/.env`, compose files | Orta | restic |
| Docker volumes | (yukarıda) | Kritik | restic |
| Uygulama kodu | — | Düşük | Image registry'de hazır |
| Müşteri Wi-Fi şifresi, sözleşme | HashTap CRM | Orta | CRM backup |

### 5.2 restic repository yapısı

Her restoran için ayrı repo (B2'de):
```
s3:s3.eu-central-003.backblazeb2.com/hashtap-backups/rest-42/
```

Şifreleme anahtarı:
- Birincil: HashTap KMS (AWS KMS veya Vault)
- Yedek: restoran kasasında kapalı zarfta (dual-custody)

Retention politikası:
- `--keep-daily 7`   — son 7 gün
- `--keep-weekly 4`  — son 4 hafta
- `--keep-monthly 12` — son 12 ay
- `--keep-yearly 3`   — son 3 yıl

Ortalama restoran: ~2-5 GB toplam, günlük incremental ~20-50 MB.
Aylık maliyet (B2): restoran başı ~$0.02-0.05.

### 5.3 Yedekleme zamanlaması (gece 03:00)

```
03:00 → pg_dump hashtap > /backup/pg-$(date +%F).dump
03:05 → restic backup /backup /var/lib/odoo/filestore /opt/hashtap/.env
03:30 → restic forget --prune (retention policy)
03:45 → heartbeat + başarı raporu HashTap ops'a
```

### 5.4 Restore runbook

**Senaryo: Kasa PC'sinin diski ölmüş.**

Hedef: 4 saatten kısa sürede yeni donanımda canlı.

```bash
# 1. Yeni PC'yi al, Ubuntu LTS kur
# 2. HashTap installer koş, aynı slug + token ile "restore" modu:
curl -sSL https://install.hashtap.app | bash --restore rest-42

# Installer şunları yapar:
#   - Docker Compose ayağa kaldırır
#   - restic ile son snapshot'ı indirir
#   - Postgres'e pg_restore
#   - Filestore'u yerine koyar
#   - .env'yi restore eder
#   - Tailscale'e yeni cihaz olarak kaydolur
#   - Odoo'yu başlatır, smoke test çalıştırır

# 3. Restoran personeli ile sanity check
#    - Son sipariş görünüyor mu?
#    - Menü güncel mi?
#    - Kasa, KDS, garson çalışıyor mu?

# 4. Eski cihaz (disk ölü) kayıttan düşür (Tailscale + ops dashboard)
```

**RTO (Recovery Time Objective):** 4 saat.
**RPO (Recovery Point Objective):** 24 saat (gecelik yedek frekansı).

Daha sıkı RPO gereksinimi doğarsa (örn. yoğun restoranlar):
- Saatlik pg_dump → local volume (retaining 24 saat)
- Gecelik restic'e genel yedek
- RPO 1 saate iner

### 5.5 Periyodik restore testleri

Her 3 ayda bir:
- Rastgele bir restoran seçilir.
- Test ortamında (dev lab) restore denenir.
- Başarı / süre / sorun dokümante edilir.
- Bu test olmadan yedekleme "çalışıyor" sayılmaz.

## 6. Olay müdahalesi

### 6.1 Sınıflandırma

| Seviye | Tanım | Örnek | Müdahale |
|---|---|---|---|
| **P0** | Toplam kesinti, müşteri iş yapamıyor | Kasa PC'si boot olmuyor | 15 dk ilk müdahale, saha ziyaret olası |
| **P1** | Ciddi, ama yön değiştirme mümkün | Kart ödeme down ama nakit var | 30 dk müdahale |
| **P2** | Belirgin bozuk, iş devam ediyor | Yazıcı ara sıra boş basıyor | Aynı gün müdahale |
| **P3** | Minor, iyileştirme | Rapor biraz yavaş | 1 hafta |

### 6.2 Müdahale akışı (P0/P1 örneği)

```
1. Uyarı (monitoring veya restoran WhatsApp) gelir
2. On-call mühendis kabul eder, WhatsApp'a "ilgileniyoruz"
3. Tailscale ile restoran PC'sine bağlan
4. Logs + docker ps + disk/mem kontrolü
5. Hızlı fix dene (docker restart, config düzeltme)
6. 15 dk içinde çözüm yoksa → secondary on-call'u çağır
7. 30 dk'da yok hala → saha ziyareti planla
8. Her 15 dakikada bir müşteri WhatsApp'a güncelleme
9. Çözüm sonrası "tamamlandı" mesajı + kısa açıklama
```

### 6.3 Postmortem

P0 ve P1 olaylarında zorunlu postmortem (72 saat içinde):
- Zaman çizelgesi (olay → tespit → müdahale → çözüm)
- Kök neden analizi
- Olay süresince etkilenen sipariş sayısı
- Önleyici aksiyonlar (kod değişikliği, runbook güncelleme, monitoring
  iyileştirme)

Postmortem template: `docs/runbooks/postmortem-template.md` (yazılacak).

### 6.4 Runbook koleksiyonu

`docs/runbooks/` altında:
- `p0-cash-pc-unbootable.md`
- `p0-postgres-corrupt.md`
- `p1-payment-gateway-down.md`
- `p1-printer-queue-stuck.md`
- `p2-kds-slow.md`
- `p2-backup-failure.md`
- `periyodic-restore-test.md`

Her runbook: tanım, tespit işaretleri, adım adım çözüm, eskalasyon
kriteri.

## 7. Güvenlik operasyonları

### 7.1 Secret rotation

- **iyzico/e-Arşiv API key'leri:** yılda bir veya ihlal şüphesinde.
- **JWT_SECRET / SESSION_SECRET:** her major release'te.
- **Tailscale auth key:** cihaz-başı, 90 günde yenilenir.
- **Restic password:** değiştirilmez (repo'nun içindedir; değiştirmek
  için yeniden init gerek). Kasada kapalı zarfta saklı.

### 7.2 Audit trail

Her restoran PC'sinde:
- SSH erişim log'u → HashTap ops'a senkron (günlük)
- Odoo'nun audit log modülü aktif (kullanıcı aksiyonları)
- `/var/log/hashtap/` rotated, 90 gün saklı

Erişim denetimi (quarter'lık):
- Kim SSH açtı, ne yaptı?
- Hangi restoranlara HashTap ekibi bağlandı?
- Abnormal pattern var mı?

### 7.3 Güvenlik ihlali senaryosu

Restoran PC'si ele geçirildiği şüphesi:
1. **İzolasyon:** Tailscale node'u offline yap (HashTap ops paneli).
2. **Analiz:** Disk imajı al (mümkünse), log'ları incele.
3. **Kredansiyel rotation:** API key'ler, şifreler değiştirilir.
4. **Müşteri bildirimi:** KVKK gereği 72 saat içinde sahibine bildir.
5. **Restore veya yeniden kur:** temiz snapshot'a geri dön.
6. **Postmortem + KVKK raporu.**

### 7.4 KVKK kapsamında işleyen yükümlülükleri

- Yılda bir "işlenen verilerin türü, süresi, amacı" rapor.
- Silme talebine 30 gün içinde yanıt (yedek retention sonrası silme
  dahil).
- KVKK denetleme isteğinde 7 gün içinde yanıt.

## 8. Kapasite ve ölçek

### 8.1 Restoran-başı kaynak kullanımı (beklenen)

| Metrik | Küçük restoran (10 masa) | Orta (30 masa) | Büyük (80 masa) |
|---|---|---|---|
| Günlük sipariş | 50-150 | 200-500 | 800-1500 |
| DB büyüme / ay | ~50 MB | ~200 MB | ~800 MB |
| Filestore büyüme / ay | ~100 MB | ~300 MB | ~1 GB |
| Peak CPU | %30 | %60 | %85 |
| Peak RAM | 4 GB | 6 GB | 12 GB |

**Öneri:** 10-30 masa için 8 GB RAM, 256 GB SSD. 80+ masa için 16 GB
RAM, 512 GB SSD. Kurulum öncesi donanım değerlendirmesinde not düşülür.

### 8.2 HashTap-tarafı cloud kapasitesi

| Restoran sayısı | Ops VPS | Backup depo | Aylık maliyet |
|---|---|---|---|
| 10 | 1 × Hetzner CX21 (€5) | B2 50 GB (~$0.5) | €6 |
| 50 | 1 × CX31 (€10) | B2 250 GB (~$1.5) | €13 |
| 200 | 2 × CX31 (€20) + LB | B2 1 TB (~$6) | €35 |
| 1000 | 4 × CX41 (€60) | B2 5 TB (~$30) | €110 |

**Karşılaştırma:** SaaS olsaydık 1000 restoran için aylık €5.000+ cloud
faturası gelecekti. On-premise modelde ~€110. Bu pivot'un temel
ekonomik avantajı.

## 9. Eğitim ve dokümantasyon

### 9.1 IT ekibi eğitimi

Yeni bir IT personeli için onboarding (2 hafta):
- Hafta 1: Shadow 2 kurulumda (deneyimli kişi ile).
- Hafta 2: Kontrollü kurulum (deneyimli kişi gözlem altında).
- Sonrası: bağımsız kurulum, ilk 3'ü post-install review ile.

### 9.2 Destek ekibi eğitimi

- Runbook'ları okuma (tüm P0/P1'ler).
- Mock incident drill'leri (ayda bir).
- Tailscale + monitoring dashboard practice.
- WhatsApp/telefon tonlaması + incident communication.

### 9.3 Müşteri eğitim materyalleri

`docs/training/` altında (yazılacak):
- `cashier-quick-guide.md` (+ video)
- `waiter-quick-guide.md` (+ video)
- `kitchen-quick-guide.md` (+ video)
- `manager-quick-guide.md`
- `troubleshooting-faq.md`

## 10. Geliştirme süreci etkileri

### 10.1 Deploy = release

- Feature branch → merge → image build → registry canary tag.
- QA: iç test ortamında smoke + E2E.
- Canary: 1-2 restoranda 48 saat.
- Stable: flota.

### 10.2 Hotfix

Kritik bug için:
- Branch: `hotfix/1.3.3`
- Direct build → canary atlama opsiyonu (mühendis imzasıyla) → stable
- İlgili olayın postmortem'ine hotfix not düşülür.

### 10.3 Feature flag'ler

Restoran-başı feature flag'ler `hashtap.settings` tablosunda:
- Yeni özellikleri ölçek riskine göre aç/kapa.
- A/B test amacı değil (her restoran tek kiracı); kademeli rollout için.

## 11. KPI'lar

Her ay gözden geçirilen metrikler:

| KPI | Hedef | Ölçüm |
|---|---|---|
| Uptime (tüm restoranlar ort) | > %99.5 | Monitoring |
| P0 olay sayısı / ay | < 2 | Olay kayıtları |
| Ortalama P0 çözüm süresi | < 2 saat | Olay kayıtları |
| Yedekleme başarı oranı | > %99 | Monitoring |
| Güncelleme rollout başarı | %100 | Deploy log |
| Müşteri memnuniyet (NPS) | > 50 | Çeyrek anket |

## 12. Açık konular

- **Uptime Kuma mı, custom dashboard mı?** Pilot döneminde Kuma yeter;
  ölçek geldikçe custom.
- **Tailscale SaaS mı Headscale mi?** İlk 50 restorana kadar SaaS (maliyet
  düşük + operasyonel basit); ölçek büyüyünce Headscale.
- **B2 mi S3 mi?** B2 maliyet avantajlı; KVKK için AB/TR bölgesi. `eu-central`.
- **On-call nasıl ödüyoruz?** Ekip büyüdüğünde HR modeli gerekli;
  şu anda kurucu + 1 mühendis.
- **SLA sözleşmede ne?** P0 müdahale süresi, saha ziyaret hakkı,
  yedekleme garantisi, uptime taahhüdü — hukuki review.
