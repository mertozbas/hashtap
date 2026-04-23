# ADR-0011 — On-premise tek-kiracı dağıtım modeli

- Durum: kabul
- Tarih: 2026-04-23
- Yerine geçer: **ADR-0006** (DB-per-tenant)
- Etkilenir: `ARCHITECTURE.md`, `PRODUCT.md`, `ROADMAP.md`
- İlgili yeni dokümanlar: `BUSINESS_MODEL.md`, `ARCHITECTURE.md`, `INSTALLATION_PLAYBOOK.md`, `OPERATIONS.md`, `DESIGN_SYSTEM.md`

## Bağlam

HashTap faz 0'da **çok-kiracılı bulut SaaS** olarak tasarlandı. ADR-0006
DB-per-tenant izolasyon modelini tanımladı; Faz 8 (ROADMAP) otomatik
provisioning'i içeriyordu. Mimari bu modele göre inşa edildi: Gateway
subdomain routing, Odoo multi-database kurulumu, cloud topolojisi
(Hetzner + Caddy + managed Postgres).

2026-04-23 tarihinde ürün/iş tarafı bir pivot yaptı:

- HashTap **SaaS aboneliği satmayacak**.
- Her restorana bir satış ekibi + IT ekibi fiziksel olarak gidecek,
  yazılım **restoranın kendi bilgisayarına** (veya ileride HashTap
  markalı donanıma) kurulacak, test edilecek, teslim edilecek.
- Sonraki aşamada donanım bundle'ı (POS PC + yazıcı + tablet + ekran)
  HashTap markasıyla satılacak.

Detaylı gerekçe: `BUSINESS_MODEL.md` §2.

Bu pivot, kiracı izolasyon modelini fiziksel olarak çözüyor (her restoran
kendi donanımı = kendi verisi = kendi DB'si). Cloud multi-tenant mimarisine
olan ihtiyaç **tamamen ortadan kalkıyor**.

## Alternatifler

### Seçenek A — SaaS modelinde kalmak (eski plan)

**Artıları:**
- Mimari zaten yazıldı, ekstra iş yok.
- Güncelleme push'u tek noktadan kolay.
- Global raporlama mümkün.

**Eksileri (pivot sonrası geçerli olmayan):**
- Bulut maliyeti HashTap'te; müşteri büyüdükçe sunucu faturası artıyor.
- Türkiye pazarının abonelik yatkınlığı düşük; satış direnci yüksek.
- Internet = hayat çizgisi; restoranın internetten düşmesi = dükkan
  kapalı.
- Müşteri verisi bulutta; KVKK ve "verim başkasının sunucusunda"
  algısı itiraza yol açıyor.
- Multi-tenant kodu bakım yükü yaratıyor (%20-25 kod tabanı).

### Seçenek B — Hybrid (her restoranın kendi cloud tenant'ı)

Örn: her restoran kendi VPS'inde HashTap koşuyor, HashTap sadece yönetim.

**Artıları:**
- İzolasyon fiziksel.
- Güncelleme merkezi.

**Eksileri:**
- Restoran sahibinin VPS kiralamaya zihinsel direnci yüksek.
- Yine internet kesintisinde dükkan duruyor.
- Pazarlanması zor ("neden VPS ödeyeyim ki?").
- On-premise'ın tüm avantajlarını kaybediyor, SaaS'ın maliyetlerini
  devralıyor.

### Seçenek C — On-premise tek-kiracı (yeni karar)

**Artıları:**
- Cloud maliyeti bizde değil.
- Offline dayanıklılık: internet olmasa da sipariş/KDS/garson çalışıyor.
- Veri egemenliği müşteride (satış argümanı + KVKK uyumu).
- Mimari sadeleşiyor: multi-tenant kodu tümüyle silinebilir.
- Yüksek marj (tek seferlik 25-80K TL vs. SaaS'ın 18 ay MRR'ı).
- Türk pazarının alıştığı "POS satın al + yıllık bakım" modeli.
- Sonraki aşamada donanım bundle'ı ek gelir kanalı.

**Eksileri:**
- Kurulum lineer ölçeklenir (SaaS otomatik değil).
- Güncelleme dağıtımı daha karmaşık (N donanımda Docker pull).
- Uzaktan destek altyapısı gerekli (Tailscale/Wireguard).
- Yedekleme zorunluluğu bizde (restoran donanımı çökerse veri gitmesin).
- Donanım sürümlülüğü (Windows/Linux, ARM/x86) — Docker azaltıyor
  ama tamamen yok etmiyor.

### Seçenek D — Hibrit (local runtime + cloud admin)

Her restoran local çalışır, ama HashTap ekibi bir cloud "dashboard"dan
tüm restoranları görür (uptime, hata logları, kurulu versiyon).

**Artıları:**
- On-premise avantajları korunuyor.
- Operasyonel gözetim merkezi.

**Eksileri:**
- Her restoran bir outbound telemetri hattı kurmak zorunda (kolay).
- Küçük cloud maliyeti (tahminle restoran başı aylık <$1).

**Not:** Bu aslında Seçenek C'nin uzantısı; ayrı seçenek değil. Seçenek
C'yi alıyoruz ve cloud monitoring'i içine dahil ediyoruz
(`OPERATIONS.md` §6).

## Karar

**Seçenek C: On-premise tek-kiracı dağıtım.**

Cloud monitoring ve uzaktan destek için küçük bir HashTap-tarafı cloud
bileşeni kalır (monitoring dashboard, update registry, Tailscale/VPN
kontrol düzlemi). Bu bileşenler müşteri verisi içermez; sadece operasyon
içindir.

## Uygulama kuralları

1. **Tek kurulum = tek kiracı.** Her restoran kendi donanımında, kendi
   Docker Compose stack'ini çalıştırır. `DATABASE_URL` → `localhost`.
2. **Multi-tenant mantığı kod tabanından çıkarılır:**
   - Gateway'in subdomain routing'i silinir.
   - Gateway'in tenant registry DB'si silinir.
   - Odoo `db_filter` — tek DB'ye bağlanır (`db_filter = ^hashtap$`).
   - Eski `MULTI_TENANCY.md` ve `DEPLOYMENT.md` dokümanları kaldırıldı
     (bilgiler `ARCHITECTURE.md` + `INSTALLATION_PLAYBOOK.md` +
     `OPERATIONS.md`'e dağıldı).
3. **Kurulum aracı zorunlu:** Installer CLI (`packages/installer/`)
   geliştirilir; IT ekibinin tek komutla (`npx @hashtap/installer` veya
   `curl | sh`) restoran PC'sine kurulum yapması mümkün olur.
4. **Her kurulum outbound telemetri gönderir** (opt-in):
   - Versiyon numarası, uptime, kritik hata sayısı.
   - Müşteri verisi (sipariş içeriği, müşteri bilgisi) **gönderilmez**.
   - Endpoint: HashTap'in monitoring dashboard'ı.
5. **Uzaktan destek Tailscale üzerinden:** Her kurulum bir Tailscale
   node'u olarak kaydolur; HashTap destek ekibi ACL'e göre bağlanır.
   Restoranın açık onayı olmadan shell açılmaz; erişim loglanır.
6. **Yedekleme zorunlu:** Installer, restic ile gecelik şifreli yedek
   kurar. Şifreleme anahtarı HashTap KMS'te tutulur, restoran da bir
   kopyayı kasada saklar (dual-custody).
7. **Güncelleme stratejisi:**
   - Watchtower veya kendi daemon'u gecelik 04:00'te yeni Docker
     image kontrolü yapar, `stable` tag'ını pull eder.
   - Bu tag'a çıkan her versiyon önce iç test → 1-2 gönüllü canary
     restoranda 48 saat → tüm flota açılır.
   - Rollback: eski image tag'ı korunur; sorun çıkarsa tek komutla
     downgrade.
8. **Cloud bileşenleri:**
   - **Monitoring:** Uptime Kuma veya custom dashboard. Her restoran
     heartbeat atar.
   - **Update registry:** Docker Hub private repo veya self-hosted
     registry. Versiyonlu image'lar.
   - **VPN kontrol düzlemi:** Tailscale Headscale (self-hosted) veya
     Tailscale SaaS.
   - **Install wizard'ın config backend'i:** Müşteri bilgilerini
     toplayan küçük bir Hashtap CRM — Odoo kendisi de kullanılabilir.
9. **Müşteri QR PWA erişilebilirliği:**
   - Varsayılan: **Cloudflare Tunnel** ile her restoran kendi public
     subdomain'ine kavuşur (`qr.restoranadi.hashtap.app`). Müşteri
     4G'den de erişebilir. Cloudflare ücretsiz sınırları içinde.
   - Alternatif (restoran tercih ederse): restoran Wi-Fi üzerinden
     yerel erişim + captive portal.

## Sonuçlar

**Olumlu:**
- Cloud maliyeti %95+ düşer (sadece operasyon bileşenleri kalır).
- Kod tabanı sadeleşir (multi-tenant kalıntıları silinir).
- Türk pazarı satış modeli doğal oturur.
- Satış başına gelir 10x artar (SaaS'ın 18 ay MRR'ı tek vuruşta).
- Veri egemenliği argümanı güçlenir.

**Olumsuz:**
- Kurulum lineer ölçeklenir: bayi ağı + installer otomasyonu kritik.
- Saha-destek altyapısı gerekli.
- Donanım sürümlülüğü riskini yönetmek gerek.
- Güncelleme push mekanizması karmaşıklığı yeniden düşünülmeli.

**Operasyonel riskler:** `BUSINESS_MODEL.md` §8'de tablolu.

## Değişen kod/doküman listesi

Silinen:
- `docs/MULTI_TENANCY.md` — içeriği `ARCHITECTURE.md` + kısmen `OPERATIONS.md`
  kapsamına alındı.
- `docs/DEPLOYMENT.md` — cloud Hetzner topolojisi; yerine
  `ARCHITECTURE.md` + `INSTALLATION_PLAYBOOK.md` + `OPERATIONS.md`.
- Eski `docs/ARCHITECTURE.md` — cloud multi-tenant versiyon silindi;
  yeni on-premise mimari canonical `ARCHITECTURE.md` olarak yeniden
  adlandırıldı.

Superseded:
- `docs/adr/0006-db-per-tenant.md` — "superseded by ADR-0011" başlığı
  eklendi, tarihsel kayıt olarak korunuyor.

Kod temizliği (Faz 8 işi):
- `apps/api/` — subdomain routing, tenant registry kısımları silinir.
- `odoo-addons/hashtap_pos/` — `tenant_id` filter'ları varsa silinir.

Eklenen:
- `docs/BUSINESS_MODEL.md`
- `docs/ARCHITECTURE.md`
- `docs/INSTALLATION_PLAYBOOK.md`
- `docs/OPERATIONS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/apps/CASHIER.md`
- `docs/apps/WAITER.md`
- `packages/installer/` (yeni)
- `apps/cashier/` (yeni)
- `apps/waiter/` (yeni)

Güncellenen:
- `docs/ARCHITECTURE.md` → On-premise versiyonu ana arşive, eski cloud
  mimari §-ek olarak "terk edilen alternatif" bölümüne.
- `docs/ROADMAP.md` → Faz 8 "Tenant provisioning" → "Installer CLI +
  saha kurulum automasyonu" olarak yeniden yazılır.
- `docs/STATUS.md` → Pivot notu en üstte.
- `docs/PRODUCT.md` §5 (Ticari model) ve ilgili bölümler.

## Review kriterleri

- İlk saha kurulumu 8 saati aşmıyor mu?
- Installer CLI hatasız 10 farklı Windows/Linux ortamında ayakta
  kalkıyor mu?
- İlk 10 kurulumdan en az 9'u teslim kriterlerini karşılıyor mu?
- Uzaktan destek ortalama müdahale süresi < 30 dakika (L3 vakalar)?
- Yedekleme RTO (recovery time objective) < 4 saat?
- Güncelleme rollout'u canary'den flot'a 48 saat içinde tamamlanıyor mu?
