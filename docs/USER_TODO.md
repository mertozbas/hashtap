# HashTap — Senin Yapacakların

Bu doküman: yazılım pilot-ready durumda, ama **canlıya çıkarmadan önce
senin yapman gereken iş kalemleri**. Yazılım değil, hesap/sözleşme/donanım.

Son güncelleme: 2026-04-26.

İlgili: [`PILOT.md`](./PILOT.md), [`OPERATIONS.md`](./OPERATIONS.md),
[`INSTALLATION_PLAYBOOK.md`](./INSTALLATION_PLAYBOOK.md).

## 🔑 1. Üçüncü taraf hesaplar (sandbox + canlı)

### iyzico (kart ödeme)

- [ ] **iyzico merchant başvurusu** — https://merchant.iyzipay.com
  - Şirket bilgileri, vergi no, banka hesabı, IBAN
  - Tipik onay süresi: 3-7 iş günü
- [ ] **Sandbox API key + secret key** al — Geliştirme için
- [ ] **Production API key + secret key + subMerchantKey** — pilot canlıdayken
- [ ] (Opsiyonel) **Apple Pay / Google Pay merchant** etkinleştir
- [ ] iyzico sandbox 3DS test akışını doğrula:
  ```
  http://localhost:8069/web → HashTap → Ayarlar → Ödeme → Sağlayıcılar
  → iyzico Sandbox → API Key + Secret Key gir, "Aktif" işaretle
  → mock provider'ı pasif yap
  ```
  Sonra customer-pwa'dan sandbox kart numarasıyla ödeme dene.
- [ ] Production'a geçiş: `sandbox=False` + canlı key'ler

### e-Arşiv (Foriba veya Uyumsoft)

- [ ] **Foriba** (önerilen) veya **Uyumsoft** ile sözleşme
  - https://www.foriba.com / https://uyumsoft.com.tr
  - Restoranın **mali mührü (e-İmza)** gerekli
  - Aylık fiş hacmine göre paket seç
- [ ] **API kullanıcı adı + şifre** sandbox + canlı
- [ ] Sandbox testi:
  ```
  Odoo admin → HashTap → Ayarlar → e-Arşiv → API kredansiyellerini gir
  → mock provider'ı pasif, foriba (veya uyumsoft) aktif
  → bir QR siparişle test fiş kes
  ```
- [ ] Pilot canlıya geçtiğinde `sandbox=False` ve canlı kredansiyel

### Cloudflare (dış erişim için)

- [ ] **Cloudflare hesabı** (ücretsiz tier yeterli)
- [ ] **Domain al** (ör. `hashtap.com.tr`) ve Cloudflare DNS'e taşı
- [ ] **Zero Trust → Tunnels** menüsünden yeni tunnel oluştur:
  - Token al, installer'a ver
  - Ingress: `qr.<slug>.hashtap.com.tr` → `http://localhost:8069`

### Tailscale (uzaktan destek)

- [ ] **Tailscale ücretsiz hesap** (50 cihaz limit) veya
- [ ] **Headscale self-hosted** (pilot 50 restoran sonrası)
  - Hetzner CX21 €5/ay
- [ ] Auth key üret (ephemeral, 90 gün), installer'a ver

### Backblaze B2 (yedekleme)

- [ ] **B2 hesabı**: https://www.backblaze.com/b2/
- [ ] **Bucket oluştur**: `hashtap-backups` (private, eu-central)
- [ ] **Application Key**: bucket-scoped, read+write
- [ ] Restic şifresini **dual-custody**:
  - 1 kopya HashTap KMS (Vault / 1Password)
  - 1 kopya restoran kasasında zarfta
- [ ] Aylık maliyet tahmini: 1 restoran ~$0.05, 50 restoran ~$2-3

### Hetzner (HashTap merkezi)

- [ ] **Hetzner Cloud hesabı** (kurucuya ait)
- [ ] **CX21** (€5/ay) — ops-api + heartbeat dashboard için
- [ ] **CX31** (€10/ay) — Pilot 50 restoran sonrası
- [ ] DNS: `ops.hashtap.com.tr` → bu VPS

### GitHub Container Registry (image pipeline)

- [ ] **GitHub organizasyon** veya **kişisel hesap** OK
- [ ] **GHCR token** üret (read+write packages)
- [ ] Image build pipeline:
  ```
  hashtap/odoo:canary → 2 gönüllü restoran
  hashtap/odoo:stable → tüm filo
  ```

### Domain ve SSL

- [ ] **Ana domain** (ör. `hashtap.com.tr`) — Cloudflare'da
- [ ] **Subdomain pattern**: `qr.<restoran-slug>.hashtap.com.tr` (Cloudflare Tunnel CNAME)
- [ ] SSL: Cloudflare otomatik + restoran içi `caddy` mkcert (yerel HTTPS)

## 🖨️ 2. Donanım (her restoran için)

### Cashier PC (Paket C/D)

- [ ] Mini-PC veya Lenovo M serisi (CPU: i3, RAM: 8GB, SSD: 256GB)
- [ ] Ubuntu 22.04 LTS yüklü
- [ ] Veya Windows 11 + Docker Desktop (WSL2)
- [ ] 15" dokunmatik monitör

### Mutfak (KDS)

- [ ] 21-27" yatay duvar monteli ekran (HDMI)
- [ ] Mutfak için ucuz Android tablet veya mini-PC + Chromium
- [ ] (Opsiyonel) **Bump-bar** klavye (ESC/POS bump-bar)

### Garson tableti

- [ ] 8-10" Android tablet (Samsung A8 öneri)
- [ ] Kılıf + askı/çanta
- [ ] Şarj istasyonu

### Termal yazıcı (Paket B/C/D)

- [ ] **Epson TM-T20III** veya **Star TSP143** (network/Ethernet tercih)
- [ ] 80mm rulo termal kağıt
- [ ] Mutfak fişi için sabit IP (DHCP reservation)
- [ ] Ön testi:
  ```bash
  cd apps/print-bridge
  PRINTER_INTERFACE="tcp://192.168.1.100:9100" npm run dev
  # KDS'ten "test fiş bas" dene
  ```

### Ağ altyapısı

- [ ] Restoran çapında Wi-Fi (5 GHz tercih, 2 AP)
- [ ] Fiber internet (en az 25 Mbps yukarı)
- [ ] Ethernet: Cashier PC + KDS + termal yazıcı
- [ ] Backup: 4G/5G yedek modem (Cloudflare Tunnel için)

### QR kod basımı

- [ ] **PVC kart** (kredi kartı boyutu) veya **akrilik tabela**
- [ ] Her masa için tek slug (Odoo restaurant.table'dan al)
- [ ] Lamine + masaya yapışkan/zincirli

## 🏛️ 3. Yasal + iş tarafı

### Restoran adına

- [ ] **Şirket vergi numarası**, KVKK, mali mühür
- [ ] **iyzico subMerchant onboarding** — banka hesabı + IBAN
- [ ] **e-Arşiv başvurusu** (GİB)
- [ ] **Müşteri sözleşmesi** (HashTap → restoran)
  - Lisans bedeli, aylık bakım, SLA
  - Şablon: `~/hashtap-b2b-docs/PARTNER_PROGRAM.md` §11

### KVKK (gizlilik)

- [ ] **Veri işleme sözleşmesi** (DPA): Restoran ↔ HashTap
- [ ] **Aydınlatma metni**: müşterinin gördüğü QR menüde link
- [ ] (Faz 16) Partner için: 3 katmanlı DPA (Restoran ↔ Partner ↔ HashTap)

### Vergi

- [ ] Aylık bakım (1.500 ₺) için **fatura kesimi otomasyonu**
  - Odoo: Otomatik tekrar eden fatura (Recurring Invoices)
- [ ] Lisans bedeli **bir kerelik fatura** + sözleşme
- [ ] KDV: yazılım %20, donanım %20, hizmet %20 (2026 oranı)

## 🧪 4. Pilot öncesi son testler (yazılım tarafı)

### Sen yaparsın (HashTap canlıya gerçek hesaplarla)

- [ ] **iyzico sandbox 3DS testi** — gerçek API key ile bir QR sipariş
  - Test kartı: `5400360000000003` (3DS başarı)
  - 5 başarılı + 5 başarısız test
- [ ] **Foriba sandbox testi** — gerçek API ile bir fiş kes
  - ETTN ve PDF URL geliyor mu kontrol
- [ ] **Termal yazıcı testi** — gerçek Epson/Star ile mutfak fişi
- [ ] **Cloudflare Tunnel testi** — `qr.<slug>` dış URL'inden menü açılıyor mu
- [ ] **Tailscale enroll testi** — uzaktan SSH bağlantısı

### HashTap (yazılımdan kaynaklı) test

- [x] Customer PWA modifier seçimi → sepete ekleme + sipariş gönderimi
- [x] Cashier kalem ekle/sil/güncelle
- [x] Bill split (eşit + manuel) — birden fazla yöntemle
- [x] Day close + Z raporu (sayım farkı)
- [x] Modifier delta'lı fatura ve stok düşümü
- [x] POS endpoint Bearer token auth
- [x] Installer fresh Ubuntu Docker testi
- [x] CI: typecheck + Python syntax + manifest sanity
- [x] Backend: 35 Odoo testi geçiyor
- [x] Frontend: 32 Vitest test geçiyor (print-bridge 6, installer 12, pos-adapters 9, ui 5)

## 📋 5. Pilot kurulum — operasyonel (W1)

### Hafta -2: Sözleşme + altyapı

- [ ] Restoran seç (kriter: `PILOT.md` §2)
- [ ] Sözleşme imzala (lisans bedeli + bakım)
- [ ] iyzico subMerchant başvurusu başlat (paralel)
- [ ] e-Arşiv kredansiyel hazır

### Hafta -1: Donanım + menü

- [ ] Donanım siparişi (`USER_TODO.md` §2)
- [ ] Restoranın mevcut menüsünü Excel'den Odoo'ya import (opsiyonel: `data/seed_demo.py` referans)
- [ ] QR kod sticker basımı

### Hafta 0: Kurulum + dry run

- [ ] Cashier PC'ye Ubuntu kur
- [ ] `hashtap-installer` çalıştır:
  ```bash
  npx -p @hashtap/installer hashtap-installer
  # wizard:
  #   - Kurulum ID: rest-1
  #   - Slug: kafe-pilot
  #   - iyzico: live mode + canlı key
  #   - e-Arşiv: foriba + canlı kredansiyel
  #   - Cloudflare Tunnel: token + hostname
  #   - Tailscale: auth key
  ```
- [ ] Smoke test: `gateway /health` + `ops /health` + `KDS sayfası`
- [ ] **Personel eğitimi 4 saat** (kasa, garson, mutfak)
- [ ] **Aile/arkadaş dry run** — 2 saat sahte sipariş

### Hafta 1+: Canlı pilot

- [ ] **Canary**: %10 → %50 → %100 (3 gün)
- [ ] On-call: ilk 72 saat saha + Tailscale
- [ ] Günlük metrik review (uptime, hata, NPS)
- [ ] Haftalık review (Çarşamba 14:00)

## 🚀 6. Canlıya çıkış sonrası (Pilot 4. hafta sonu)

Başarı kriterleri (`PILOT.md` §4.5):

- [ ] Uptime > %99.5
- [ ] Kart ödeme başarı > %97
- [ ] P0 olay 4 haftada ≤ 2
- [ ] RTO < 4 saat (1 restore testi gerçek)
- [ ] Müşteri NPS ≥ 50
- [ ] Aylık bakım abonesi aktif

Başarılı pilot sonrası:

- [ ] **İkinci restoran satışına başla** (referans olarak pilot kullan)
- [ ] **Partner programı başlat** (`PARTNER_PROGRAM.md`)
- [ ] **HashTap markalı donanım bundle'ı** üretici görüşmesi (Faz 2 hedefi)
- [ ] **Pilot case study** yaz (sahip onayıyla)

## 🛠️ 7. Yazılım tarafı sürdürülen iş (yazılımcı sen değilsen)

### Aylık

- [ ] Backup restore testi (3 ayda bir)
- [ ] Sertifika rotasyonu (90 günde bir Tailscale auth key)
- [ ] iyzico API key check
- [ ] Stripe/iyzico üyelik aktif mi (bakım aboneliği)

### Yıllık

- [ ] Major version upgrade (v2 çıkarsa müşterilere %40 yenileme satışı)
- [ ] KVKK denetimi
- [ ] iyzico denetim raporu

## 📞 8. İletişim + destek

### Müşteri için

- [ ] Telefon: 7/24 destek hattı (kurucu cep şu an)
- [ ] WhatsApp: ticket aç + acil P0
- [ ] E-posta: `destek@hashtap.com.tr` (kurulum sonrası)

### HashTap iç ekip

- [ ] Slack/Discord workspace (5+ kişi olunca)
- [ ] PagerDuty / Linear (ticket sistemi) — Faz 16
- [ ] Postmortem template hazır (`docs/runbooks/postmortem-template.md`)

## 9. Maliyet özeti — pilot başlangıcı

| Kalem | Tutar (yaklaşık) |
|---|---|
| Hetzner VPS (CX21) | €60/yıl |
| B2 (50 GB başlangıç) | €0.30/ay → €4/yıl |
| Cloudflare (ücretsiz tier) | 0 ₺ |
| Tailscale (ücretsiz tier 50 cihaz) | 0 ₺ |
| GitHub Container Registry (ücretsiz tier 500MB) | 0 ₺ |
| iyzico komisyonu (sözleşmede) | %1.4-2.4 işlem başı |
| Foriba e-Arşiv | ~500 ₺/ay tipik |
| **Aylık sabit maliyet** | **~€10-15** |

Restoran tarafında: paket fiyatı + 1.500 ₺/ay bakım. (`PRICING.md` ↗︎)

## 10. Hızlı referans — şu anda hazır olan akışlar

| Akış | URL | Durum |
|---|---|---|
| Müşteri menü | `http://localhost:5173/r/t/<slug>` | ✅ modifier UI tamam |
| Cashier salon | `http://localhost:5180` | ✅ canlı + bill split + day close |
| Waiter tablet | `http://localhost:5181` | ✅ offline queue + auto-flush |
| KDS | `http://localhost:8069/hashtap/kds` | ✅ bump-bar + station filter |
| Odoo admin | `http://localhost:8069/web` | ✅ admin/admin, l10n_tr CoA |
| Gateway BFF | `http://localhost:4000/health` | ✅ /v1/menu, /v1/pos/* |
| Z raporu (Odoo) | `/web#action=action_hashtap_day_close` | ✅ |
| Faturalar | `/web#action=243` | ✅ 185+ posted (simülasyondan) |
| Stok | `/web#action=355` | ✅ TR CoA + l10n_tr |

Bu liste **bugün çalışıyor**. Üçüncü taraf hesapları + donanım gelince
yukarıdaki §1 ve §2'deki kalemler tamamlanmış olacak.
