# HashTap — Yol Haritası

Bu doküman fazları ve her fazın çıktı kriterlerini kayıt altına alır. Takvim tarihleri değil, **hafta sayıları** kullanılır; başlangıç "W1" = koda başlanan ilk hafta.

Her faz için üç bölüm: **hedef, çıktı kriterleri, riskler**. Bir fazın çıktı kriterleri karşılanmadan bir sonrakine geçilmez.

> **Anlık durum → `docs/STATUS.md`.** ROADMAP planı; STATUS gerçeği
> anlatır. Faz bitti işareti ✅ burada göstermelik tutulur; asıl
> güncellik STATUS'tadır.

> **🚨 2026-04-23 Pivot Notu:** HashTap SaaS → on-premise tek-kiracı
> modeline geçti (`adr/0011-on-premise-deployment.md`, `BUSINESS_MODEL.md`).
> Bu belgenin **Faz 8** bölümü yeniden tanımlandı (multi-tenant
> provisioning → mimari sadeleştirme + installer CLI). **Faz 11-15**
> yeni eklendi: remote support altyapısı, design system, KDS refresh,
> cashier uygulaması, waiter uygulaması. Faz 0-7.5 çıktıları aynen
> korunuyor.

## Faz 0 — İskele (W0, bitti)

Bu dokümantasyon hazırlanırken tamamlandı. `/home/hashtag/hashtap/` altında monorepo iskelesi, TS/Node tarafında `customer-pwa` + gateway API hazır. Odoo-öncesi plana göre yazıldı; dokümantasyon faz'ı bittikten sonra gateway ve PWA sadeleştirilecek.

## Faz 1 — Odoo temeli + `hashtap_pos` iskelesi (W1–W3) ✅

**Hedef:** Lokal bir Odoo 17 CE instance'ı ayakta, `hashtap_pos` modülü yüklü, "HashTap" markasıyla giriş ekranı görünüyor.

### İş paketleri

| İş | Tahmin |
|---|---|
| `infra/odoo/` altında docker-compose (Odoo + Postgres + Redis) | 2 gün |
| `hashtap_pos` modülü iskelesi (`__manifest__.py`, boş controller, menü kaydı) | 1 gün |
| `hashtap_theme` modülü (logo, renk, login ekranı white-label) | 3 gün |
| `pos_restaurant` modülünü incele, notlarını `docs/POS_RESTAURANT_NOTES.md`'ye düş | 2 gün |
| Developer setup dokümanı güncelle (`DEV_SETUP.md`'yi kod çalıştırılarak doğrula) | 1 gün |

### Çıktı kriterleri
- [ ] `docker compose -f infra/odoo/docker-compose.yml up` ile Odoo `localhost:8069`'da.
- [ ] Yeni veritabanı oluşturma ekranında "HashTap" logosu var, "Odoo" kelimesi görünmüyor.
- [ ] `hashtap_pos` modülü yüklenince Odoo menüsünde "HashTap POS" üst menüsü geliyor (altı boş olabilir).
- [ ] `hashtap_pos` için kabul edilir bir test iskeleti var (bir dummy unit test yeşil).

### Riskler
- Odoo theme sistemi 17'de değişmiş olabilir; beklenenden daha karmaşık.
- Docker image'lar (odoo:17) platformlarda (ARM64) farklı davranabilir — pilot ekip M1 Mac + Linux ARM çalıştırıyor.

## Faz 2 — Menü & masa veri modeli (W4–W5) ✅

**Hedef:** `hashtap_pos` içinde menü ve masa modelleri tanımlı, Odoo panelinden yönetilebilir. REST endpoint'i üzerinden `customer-pwa` menü çekebiliyor.

### İş paketleri

| İş | Tahmin |
|---|---|
| `hashtap.menu.category`, `hashtap.menu.item`, `hashtap.menu.modifier` modelleri | 2 gün |
| `pos_restaurant`'ın `restaurant.table` modelini extend et (QR slug, masa tipi) | 1 gün |
| Odoo panelinde menü editörü view'ları (form + tree + kanban) | 3 gün |
| i18n alanları (TR + EN birlikte tek formda) | 2 gün |
| Public REST endpoint: `GET /hashtap/menu/<tenant_slug>/<table_slug>` | 2 gün |
| `customer-pwa` MenuPage'i bu endpoint'ten doldur | 2 gün |

### Çıktı kriterleri
- [ ] Odoo panelinde menü ekleyip TR+EN içerikleri girebiliyorum.
- [ ] Bir masaya QR URL'si üretilebiliyor (`hashtap_pos` helper ile).
- [ ] `customer-pwa` menüyü gerçek Odoo'dan çekiyor, iki dilde gösteriyor.
- [ ] Integration test: menü endpoint'i tenant izolasyonuna uyuyor (başka kiracı menüsünü dönmüyor).

### Riskler
- Odoo i18n modeli "translations table" ile çalışır; tek formda iki dili birlikte düzenletmek custom view gerektirebilir.
- Public endpoint auth'suz; rate-limit gerekli (MVP sonrası nginx seviyesi, MVP'de controller'da).

## Faz 3 — Sipariş akışı (W6–W7) ✅

**Hedef:** Müşteri PWA'dan sepet oluşturup sipariş gönderiyor; Odoo'da bir `pos.order` açılıyor; restoran panelinde görünüyor.

### İş paketleri

| İş | Tahmin |
|---|---|
| `POST /hashtap/order` — sepet → `pos.order` (draft) çevirisi | 3 gün |
| Sepet validation (fiyat sunucu tarafında yeniden hesaplanır, PWA gönderdiğine güvenmeyiz) | 1 gün |
| `pos.order` state extension: `hashtap_paid`, `hashtap_kitchen_sent` alanları | 2 gün |
| Restoran panelinde "QR siparişleri" view'ı (Odoo native) | 2 gün |
| Customer PWA sipariş durumu sayfası (polling) | 2 gün |

### Çıktı kriterleri
- [ ] PWA'dan sipariş gönderildiğinde Odoo panelinde anında görünüyor.
- [ ] Panel "hazırlanıyor / hazır" durum değişikliği PWA'ya polling ile yansıyor.
- [ ] Aynı masaya aynı anda 2 sipariş gelirse iki ayrı `pos.order` oluşuyor (çakışma yok).
- [ ] Integration test: fiyat manipülasyonu (PWA'dan yanlış fiyat gönderilirse) sunucu reddediyor.

### Riskler
- Odoo'nun `pos.order` workflow'u opinionated; bizim "paid but not in kitchen" ara durumumuz standart Odoo akışına uymuyor → custom field + custom button.
- Polling yerine WebSocket/longpoll isteği çıkabilir — faz içinde karar, MVP için polling yeter.

## Faz 4 — iyzico ödeme (W8–W9) ✅ (mock + stub)

**Hedef:** Müşteri 3DS'le ödüyor, sipariş `paid` oluyor, restoran banka hesabına para akıyor (test ortamı).

### İş paketleri

| İş | Tahmin |
|---|---|
| iyzico sandbox hesabı + subMerchant kurulumu | 1 gün |
| `hashtap_pos.payment` — 3DS başlatma endpoint'i | 2 gün |
| 3DS callback + idempotency + siparişi `paid` yap | 2 gün |
| Webhook güvenliği (HMAC doğrulaması) | 1 gün |
| Apple Pay / Google Pay desteği (iyzico üzerinden) | 3 gün |
| Hata durumları: ödeme başarısız, timeout, duplicate callback | 2 gün |

### Çıktı kriterleri
- [ ] Sandbox'ta uçtan uca ödeme akışı çalışıyor.
- [ ] Callback imzası doğrulanmadan sipariş `paid` olmuyor (testle doğrulanmış).
- [ ] Aynı callback iki kez gelirse sipariş iki kez `paid` olmuyor.
- [ ] subMerchant hesabına test parası "yatmış" görünüyor.

### Riskler
- Apple Pay domain verification ve merchant kurulumu zaman alır; iş paketi 3 günden taşabilir.
- iyzico facilitator sözleşmesi için hukuki ön-adım gerekebilir (prod için; sandbox'ta değil).

## Faz 5 — e-Arşiv (W10–W11) ✅ (mock, Foriba iskelet)

**Hedef:** Sipariş ödendiğinde otomatik fiş kesiliyor; kesilemezse sipariş mutfağa **gönderilmiyor** (fail-close).

### İş paketleri

| İş | Tahmin |
|---|---|
| Sağlayıcı seçimi (Foriba vs Uyumsoft vs Logo) + test hesabı | 1 gün |
| `efatura_adapter` modülü: sağlayıcı-bağımsız arayüz | 2 gün |
| Sipariş `paid` → fiş kesme job'u (Odoo queue_job veya cron) | 3 gün |
| Fail-close: fiş başarısızsa sipariş durumu `paid_no_receipt`, mutfak tetiklenmez, panelde alarm | 2 gün |
| Müşteriye PWA'da PDF/QR fiş gösterimi | 2 gün |

### Çıktı kriterleri
- [ ] Test ortamında ödeme → fiş kesme → PWA'da fiş görünme akışı yeşil.
- [ ] Fiş sağlayıcı kasıtlı olarak düşürüldüğünde sipariş mutfağa gitmiyor, restoran paneline alarm düşüyor.
- [ ] Fiş yeniden kesildiğinde akış normale dönüyor.

### Riskler
- GİB'in e-Arşiv test ortamı pratikte istikrarsız; lokal mock tabanlı test iskelesi kur.
- Fail-close politikası pilot müşterinin hoşuna gitmeyebilir ("ödeme aldım, niye mutfağa gitmiyor?") — müşteri eğitimi gerekli.

## Faz 6a — KDS (Kitchen Display) ✅

**Hedef:** Mutfak için tam ekran, HashTap markalı canlı sipariş paneli.
Pilot restoranda tablet/TV üzerinde çalışır. Detay: `docs/KDS.md`.

### İş paketleri (yapıldı)

| İş | Çıktı |
|---|---|
| `hashtap.order` state eksenine `preparing` ve `kitchen_fired_at/ready_at` alanları | `models/hashtap_order.py` |
| `GET /hashtap/kds` sayfası + polling endpoint'i | `controllers/kds.py` |
| 3-kolon UI (Yeni / Hazırlanıyor / Hazır), dark theme, touch buttons | `static/src/css/kds.css` |
| 3sn polling + yeni sipariş beep'i + geri al | `static/src/js/kds.js` |
| Odoo menü link'i ("HashTap → Operasyon → Mutfak Ekranı") | `views/hashtap_kds_menu.xml` |

### Çıktı kriterleri (karşılandı)
- [x] Mutfağa düşen sipariş 3sn içinde KDS'te "Yeni" kolonunda görünüyor.
- [x] "Başla / Hazır / Servis edildi" butonlarıyla durum ilerliyor, KDS kartı kolonlar arası kayıyor.
- [x] Servis edilen sipariş KDS'ten düşüyor.
- [x] Bekleme süresine göre renk uyarısı (normal / 10dk / 20dk+).

### Gelecek iyileştirmeler (pilot bağımlı)
- Çoklu istasyon (soğuk/sıcak mutfak ayrı KDS).
- Longpolling (`bus.bus`) — 50+ masa/dk yükünde.
- Restorana göre süre eşiği (res.config.settings).

## Faz 6b — Print-bridge (pilot tetiklemeli) ⏳

**Hedef:** Termal (ESC/POS) yazıcıya fiziki fiş çıkışı. Pi veya local
agent köprü.

**Ne zaman başlatılır:** Pilot restoranda termal yazıcı kullanılacağı
kesinleştiğinde. Mutfak akışı şu an KDS ile tam çalışıyor; yazıcı
operasyonel tercih meselesi.

### İş paketleri

| İş | Tahmin |
|---|---|
| Print-bridge WS protokolü: Odoo'dan print-bridge'e event emitting | 2 gün |
| Print-bridge tarafında event al → ESC/POS yazıcıya bas | 2 gün |
| "Basıldı" onayının Odoo'ya dönüşü, retry mantığı | 2 gün |
| Local queue + offline dayanıklılık | 1 gün |

### Çıktı kriterleri
- [ ] Test masasında yazıcıdan gerçek fiş çıkıyor.
- [ ] Yazıcı offline'ken sipariş kuyrukta bekliyor; online olunca basılıyor.
- [ ] İki baskı önlemi: aynı siparişin fişi iki kez basılmıyor.

### Riskler
- Pi tarafında ağ kesintisi senaryoları restoranlarda yaygın — local queue dayanıklı olmalı.
- Termal yazıcı markaları uyum farkları (Epson TM-T20, Star TSP100...). Öncelikle pilotun aldığı modele odaklan.

## Faz 7.5 — `hashtap_theme` doldurma (white-label pass 1) ✅

**Hedef:** Restoran sahibi / personeli Odoo arayüzüne bakarken "HashTap
kullanıyorum" desin; ilk vuruşu CSS ile yap, XML inheritance'ı sadece
whitelist'in izin verdiği noktalarda kullan. Detay: `docs/WHITE_LABEL.md`.

### Yapıldı
- SCSS palet ve backend overrides (navbar, buton, form, odoo.com
  link'lerini gizle).
- Login / signup / reset şifre ekranları: cream arka plan, HashTap
  logosu CSS background-image ile, tagline `::before` ile.
- Tarayıcı sekme başlığı "HashTap".
- Odoo 17 view inheritance whitelist (sadece `@id/@name/@class/@string`)
  tuzağı tecrübe edildi ve dokümante edildi (WHITE_LABEL §4.1).

### Kalan white-label işi (Faz 8/9 içinde)
- App switcher ve `ir.ui.menu` temizliği (Discuss / Website gibi
  gereksiz root menüler gizlenmeli).
- PDF şablonları (fiş / fatura) — `report.internal.layout` override.
- Sistem mail şablonları.
- 404/500 hata sayfaları.
- Help → "HashTap Hakkında".

## Faz 7 — POS adapter (Segment B) (W13–W14)

**Hedef:** Kendi ERP'mizi istemeyen müşteri için SambaPOS veya Adisyo'ya bağlı mod çalışıyor.

### İş paketleri

| İş | Tahmin |
|---|---|
| SambaPOS Graph API adapter | 4 gün |
| Adisyo REST adapter | 3 gün |
| Adapter mode'unda `hashtap_pos` hangi modülleri kapatıyor dokümante et | 1 gün |
| İki pilotta test (bir SambaPOS'lu, bir Adisyo'lu) | 3 gün |

### Çıktı kriterleri
- [ ] SambaPOS'lu test restoranında sipariş HashTap → SambaPOS'a gidiyor, mutfak fişi SambaPOS'tan çıkıyor.
- [ ] Adisyo'da aynısı yeşil.

### Riskler
- SambaPOS API erişimi için lisans/anlaşma — pazarlama tarafı hızlı yürütmeli.

## Faz 8 — Mimari sadeleştirme + Installer CLI (W15–W17)

> **Pivot sonrası yeniden tanımlandı (2026-04-23).** Eski Faz 8 (multi-tenant
> provisioning) terk edildi; on-premise tek-kiracı modele geçiş için
> bu faz mimari sadeleştirme ve IT ekibinin saha kurulumunda kullanacağı
> Installer CLI'ı içeriyor.

**Hedef:** (1) Kod tabanından multi-tenant kalıntılarını temizlemek,
(2) IT ekibinin restoran PC'sine tek komutla kurulum yapabildiği
`packages/installer/` CLI aracını geliştirmek.

### İş paketleri

| İş | Tahmin |
|---|---|
| Gateway'deki subdomain routing, tenant registry DB, `tenant_id` filter'ları sil | 2 gün |
| `infra/odoo/docker-compose.yml` tek-kiracı mod (db_filter, volume basitleşme) | 1 gün |
| Docker image build + registry push pipeline (canary/stable tag stratejisi) | 2 gün |
| `packages/installer/` iskelet: Node CLI, inquirer wizard, docker compose up sarıcı | 3 gün |
| `.env` wizard adımları: restoran bilgisi, iyzico, e-Arşiv, admin, Cloudflare Tunnel, Tailscale | 2 gün |
| Caddy + local TLS (mkcert) + mDNS kurulum otomasyonu | 2 gün |
| Cloudflare Tunnel otomatik kayıt + DNS entegrasyonu | 2 gün |
| `smoke-test.sh` — kurulum sonrası E2E kabul testi | 2 gün |
| İnstaller Windows + Ubuntu üzerinde test | 3 gün |

### Çıktı kriterleri
- [ ] Multi-tenant kod kalıntıları sıfır (`grep -r "tenant_id\|db_filter" --include="*.ts" --include="*.py"` temiz).
- [ ] Temiz bir Ubuntu 22.04 makinasına `curl -sSL install.hashtap.app | bash` ile 30 dakikanın altında tam kurulum.
- [ ] Temiz bir Windows 11 + Docker Desktop makinasına aynı CLI ile kurulum.
- [ ] Wizard tüm gerekli bilgileri toplayıp `.env` oluşturur.
- [ ] Cloudflare Tunnel otomatik devreye alınır, `qr.<slug>.hashtap.app` dış erişimi ayakta.
- [ ] `smoke-test.sh` yeşil: menü GET, sipariş POST, iyzico sandbox ödeme, e-Arşiv mock akışı, KDS görünürlük.
- [ ] İlk heartbeat HashTap ops monitoring'e düşer.

### Riskler
- Windows'ta Docker Desktop bağımlılığı → bazı restoran PC'leri kurmamış olabilir; installer WSL2 + Docker Desktop kurulum rehberliği sağlar veya Linux'a geçmeyi önerir.
- Cloudflare Tunnel DNS propagation ilk kurulumda 5-10 dk; installer buna timeout tolerance bırakır.
- İnstaller hatası durumunda temiz rollback zor; idempotent tasarım ve log'lama kritik.

Detaylı kurulum adımları: `INSTALLATION_PLAYBOOK.md`.

## Faz 9 — Pilot hazırlık (W17–W18)

**Hedef:** Gerçek bir restoranda pilot için her şey hazır. Eğitim materyali, destek süreci, geri bildirim kanalı.

### İş paketleri

| İş | Tahmin |
|---|---|
| Pilot restoran menüsünü sisteme gir | 2 gün |
| Ekip eğitimi (sahip + garson + mutfak) | 1 gün |
| Uptime monitoring (Prometheus / Grafana basit setup) | 3 gün |
| Destek prosedürü, telefon numarası, günlük raporlama | 2 gün |
| Canary flags: gün içinde %10 siparişle başla, genişlet | 2 gün |

### Çıktı kriterleri
- [ ] Pilot restoran sahibi "sistem hazır" diyor.
- [ ] Destek hattı canlı, ilk 72 saatte bizden biri on-call.

## Faz 10 — Pilot (W19–W22)

**Hedef:** 4 hafta canlı pilot, MVP başarı kriterleri karşılanıyor.

İş paketleri: gözlem, bug fix, müşteri eğitimi. Yeni özellik yok.

### Çıktı kriterleri
- PRODUCT.md §8 kriterleri.

## Faz 11 — Remote support + backup + monitoring altyapısı (W18–W19)

> **Pivot sonrası eklendi (2026-04-23).** On-premise modelin operasyonel
> şartlarını karşılayan bulut altyapısı.

**Hedef:** Her HashTap kurulumunu uzaktan desteklenebilir, yedeklenebilir,
ve izlenebilir hale getirmek. Detay: `OPERATIONS.md`.

### İş paketleri

| İş | Tahmin |
|---|---|
| Tailscale (veya Headscale self-hosted) kurulumu + ACL yapısı | 2 gün |
| Installer içinde Tailscale otomatik kayıt + HashTap ops'a ping | 1 gün |
| `infra/backup/` — restic + gecelik cron, B2 bucket yapılandırması | 2 gün |
| Dual-custody şifre yönetimi (HashTap KMS + restoran zarfı workflow'u) | 1 gün |
| Restore runbook + otomatik test ortamı | 2 gün |
| Uptime Kuma (self-hosted) kurulum + dashboard | 1 gün |
| Restoranın heartbeat servisi (`/v1/heartbeat` endpoint + Docker client) | 2 gün |
| Update registry (Docker Hub private / GHCR) + canary/stable tag iş akışı | 2 gün |
| Watchtower veya kendi update daemon'u konfigürasyonu | 2 gün |
| Rollback runbook + testleri | 1 gün |
| Postmortem şablonu + incident playbook'ları | 1 gün |

### Çıktı kriterleri
- [ ] Rastgele bir kurulumda Tailscale ile destek ekibi SSH açabiliyor; tüm erişim loglanıyor.
- [ ] Gecelik yedek otomatik alınıyor, B2'ye push oluyor, restore test ortamında başarılı.
- [ ] Uptime Kuma dashboard'ta kurulumun canlı metrikleri (heartbeat, disk, servis durumları) görülüyor.
- [ ] Canary tag bir image'a push edildiğinde, 2 gönüllü restoran 04:00'te pull ediyor; 48 saat sonra stable'a taşınabiliyor.
- [ ] Rollback senaryosu bir kurulumda denendi ve başarılı.
- [ ] RTO < 4 saat (restore testi), RPO 24 saat (gecelik yedek).

### Riskler
- Tailscale SaaS sınırları (50 cihaz) ölçeğe yetmeyebilir → Headscale'e geçiş planı.
- B2 outbound trafik maliyeti öngörülmüş olmalı.
- Yedek şifre kayıp senaryosu için disaster recovery runbook.

## Faz 12 — Design System / packages/ui (W20–W21)

> **Pivot sonrası eklendi.** Cashier + Waiter + KDS için paylaşılan
> modern UI kütüphanesi.

**Hedef:** Tüm müşteri-yüzlü uygulamaların paylaşacağı tasarım sistemini
kodda kurmak. Detay: `DESIGN_SYSTEM.md`.

### İş paketleri

| İş | Tahmin |
|---|---|
| `packages/ui/` iskele + Tailwind + design token'lar | 2 gün |
| Temel bileşenler: Button, Card (glass), Input, Modal, Toast | 3 gün |
| Liste bileşenleri: Table, BentoGrid, Badge, EmptyState, Skeleton | 2 gün |
| Theme: dark (default) + light tokens, `useTheme` hook | 1 gün |
| Framer Motion entegrasyonu + preset animation'lar | 1 gün |
| `useHaptic` hook (waiter için titreşim) | 0.5 gün |
| Storybook kurulumu + tüm bileşenlerin story'si | 2 gün |
| Lucide ikonlar + HashTap custom ikonlar (varsa) | 1 gün |
| Figma senkronizasyonu (design tokens export) | 1 gün |
| Dokümantasyon + kullanım örnekleri | 1 gün |

### Çıktı kriterleri
- [ ] `packages/ui/` import edilip Cashier/Waiter'da kullanılabiliyor.
- [ ] Storybook tüm bileşenleri dark + light modda gösteriyor.
- [ ] Design token'lar Figma ile birebir.
- [ ] Reduced motion preference'e uyumlu.
- [ ] WCAG AA kontrast oranı tüm renk kombinasyonlarında.
- [ ] 60fps'te animasyonlar 3 yıllık tablette test edildi.

### Riskler
- Frontend ekibinin eş zamanlı UI geliştirmesi → bileşen API'si stabilleşmeden uygulamayı bloklama riski; Storybook'ta parallelise.

## Faz 13 — KDS dokunmatik iyileştirmeleri (W22)

> **Pivot sonrası eklendi.** Mevcut KDS'in yeni design system'e
> uyarlanması.

**Hedef:** Faz 6a'da yapılan KDS'i `packages/ui`'a migrate etmek, dokunmatik
ergonomisini iyileştirmek.

### İş paketleri

| İş | Tahmin |
|---|---|
| KDS CSS/QWeb → `packages/ui` bileşenleriyle migrate | 2 gün |
| Dokunma hedefi büyütme (60×60 minimum), ergonomik spacing | 1 gün |
| Bump-bar (fiziksel buton) opsiyonel desteği (keyboard event mapping) | 1 gün |
| Çoklu istasyon desteği (soğuk/sıcak mutfak ayrı KDS) | 2 gün |
| `bus.bus` ile WebSocket polling yerine push (opsiyonel, yük görüldüğünde) | 2 gün |

### Çıktı kriterleri
- [ ] KDS yeni tasarım sistemine geçmiş, aynı işlevsellik korunmuş.
- [ ] 21-27" dokunmatik ekranda kolay kullanım.
- [ ] Çoklu istasyon ayarlanabilir (restoran çok büyükse).

### Riskler
- Odoo'nun OWL framework'ü ile `packages/ui` (React) arasında köprü — KDS için React side render edip Odoo'da iframe etmek pragmatik alternatif.

## Faz 14 — Cashier uygulaması (W23–W30)

> **Pivot sonrası eklendi.** Kasa ekranı için yeni React uygulaması.

**Hedef:** Restoranın kasa tezgâhında çalışan modern, dokunmatik,
gerçek-zamanlı kasa uygulaması. Detay: `apps/CASHIER.md`.

### İş paketleri (yüksek seviye; detay `apps/CASHIER.md` §10)

| Hafta | Çıktı |
|---|---|
| W23 | Proje iskele, routing, design system entegrasyonu |
| W24 | Ana sayfa + aktif sipariş listesi + WebSocket |
| W25 | Yeni sipariş akışı + menü browse + sepet |
| W26 | Ödeme modal + iyzico entegrasyonu + nakit akışı |
| W27 | Salon haritası + masa yönetimi (birleştir/transfer) |
| W28 | Raporlar + gün açma/kapatma + Z raporu |
| W29 | Offline handling + edge case'ler + polish |
| W30 | Pilot kabul testi + iterasyon |

### Çıktı kriterleri
Detay: `apps/CASHIER.md` §8.

## Faz 15 — Waiter uygulaması (W28–W35)

> **Pivot sonrası eklendi.** Garson tableti için mobile-first React
> PWA. Faz 14 ile paralel başlayabilir (farklı geliştirici ile).

**Hedef:** Garsonun salonda taşıdığı tablette masadan sipariş alan,
mutfakla iletişim kuran PWA. Detay: `apps/WAITER.md`.

### İş paketleri (detay `apps/WAITER.md` §11)

| Hafta | Çıktı |
|---|---|
| W28 | İskele, PWA setup, routing, design system |
| W29 | Login + masa listesi + harita view |
| W30 | Menü browse + ürün detay + modifier |
| W31 | Sepet + mutfağa gönderme + WebSocket push |
| W32 | Offline queue + IndexedDB + retry logic |
| W33 | Bildirim sistemi (hazır, adisyon) |
| W34 | Edge case'ler, polish, battery optimization |
| W35 | Pilot kabul testi + iterasyon |

### Çıktı kriterleri
Detay: `apps/WAITER.md` §9.

## Faz 16 — Partner Programı launch (W36–W52, Faz 10 sonrası)

> **Pivot sonrası eklendi (2026-04-23).** B2B reseller kanalı —
> Türkiye geneline yaygınlaşmanın ana mekanizması. Detay:
> `PARTNER_PROGRAM.md`, `adr/0012-partner-channel.md`.

**Hedef:** 12 ay içinde 8-12 aktif sertifikalı partner, 10-15M TL
lisans cirosu. Doğrudan satış pilotu (Faz 10) referansıyla başlar.

### Ön koşullar (Faz 16 başlamadan önce tamamlanmalı)

- [x] Faz 10 (pilot restoran 4 hafta canlı, başarılı)
- [ ] Faz 12 (Design system) — partner portal için gerekli
- [ ] Yasal hukuki review (reseller agreement template)
- [ ] Pazarlama kit (broşür, deck, demo script)

### İş paketleri

| Hafta | İş |
|---|---|
| W36-W37 | Partner sözleşmesi + hukuki dokümantasyon (reseller agreement, DPA, NDA template) |
| W38-W39 | Pazarlama kit (broşür, pitch deck, demo script, fiyatlandırma kalkülatörü, case study pilot restoran) |
| W40-W43 | Eğitim materyalleri (4 modül sunumları, sınav hazırlığı, video dersleri, knowledge base seed) |
| W44-W47 | Partner Portal MVP (dashboard + lisans + kurulum + ticket + fatura + pazarlama kit) |
| W48-W49 | İlk 2-3 aday partnerle görüşme, anlaşma, sözleşme |
| W50-W51 | İlk kohort eğitim (3-5 gün) + sertifika sınavları |
| W52+ | Pilot partner faz — her biri 3 kurulum HashTap mentörlüğünde |

### Çıktı kriterleri (12. ay)

- [ ] 3+ aktif sertifikalı partner
- [ ] Partner Portal canlı, lisans aktivasyon akışı çalışıyor
- [ ] Reseller Agreement template imzalanmış ve aktif kullanımda
- [ ] En az 10 partner kaynaklı kurulum tamamlanmış
- [ ] Partner NPS > 40
- [ ] L2 eskalasyon oranı < %30
- [ ] Sertifika sınavı geçme oranı > %80

### Riskler

- Hukuki süreç uzar (template revize) → önceden paralel hazırlık
- İlk partner bulmak zor (pilot referansı olmadan) → Faz 10 pilotunu
  detaylı case study yap
- Partner Portal geliştirme Faz 12 (design system) bekler; yedek
  plan: basit Odoo-tabanlı portal
- Eğitim yükü (3-5 gün in-person) HashTap ekibini çok meşgul eder →
  e-learning portalı hızla kurulmalı

Detay: `PARTNER_PROGRAM.md` §17 + §15 (risk tablosu).

## Faz 17+ (hedefler, zamanlama yok)

- Çoklu konsept / zincir desteği.
- Yemeksepeti / Getir entegrasyonu.
- Sadakat programı.
- Dinamik fiyatlama (happy hour vb).
- AI menü önerisi.
- **HashTap markalı donanım bundle'ı** — iş modeli faz 2 hedefi
  (`BUSINESS_MODEL.md` §6).
- **White-label partner tier'ı** — Gold partner'lar kendi markası
  altında satabilir (`PARTNER_PROGRAM.md` §10.3).

## Özet çizelgesi

| Faz | Hafta | Başlık | Durum |
|---|---|---|---|
| 0 | W0 | İskele + doküman | ✅ |
| 1 | W1–W3 | Odoo + `hashtap_pos` iskele | ✅ |
| 2 | W4–W5 | Menü & masa modeli | ✅ |
| 3 | W6–W7 | Sipariş akışı | ✅ |
| 4 | W8–W9 | iyzico (mock + stub) | ✅ |
| 5 | W10–W11 | e-Arşiv (mock + Foriba iskelet) | ✅ |
| 6a | W12 | KDS (Kitchen Display) | ✅ |
| 7.5 | W12 | `hashtap_theme` doldurma (pass 1) | ✅ |
| — | W13 | **🚨 Stratejik pivot + dokümantasyon** | ✅ |
| 6b | pilot tetikli | Print-bridge (ESC/POS) | ⏳ |
| 7 | W14–W15 | POS adapter (Segment B) | ⏳ partnership bağımlı |
| 8 | W15–W17 | ~~Multi-tenant provisioning~~ **Mimari sadeleştirme + Installer CLI** | ⏳ |
| 11 | W18–W19 | **Remote support + backup + monitoring** | ⏳ |
| 12 | W20–W21 | **Design system / packages/ui** | ⏳ |
| 13 | W22 | **KDS dokunmatik iyileştirmeleri** | ⏳ |
| 14 | W23–W30 | **Cashier uygulaması** | ⏳ |
| 15 | W28–W35 (paralel) | **Waiter uygulaması** | ⏳ |
| 9 | W34–W35 | Pilot hazırlık | ⏳ |
| 10 | W36–W39 | Pilot (4 hafta canlı) | ⏳ |
| **16** | **W36–W52** | **Partner Programı launch** | ⏳ |

Pivot sonrası toplam tahmini yol: **~40 hafta** (Faz 14-15 paralel
çalışırsa ~35 hafta). Bu 1-2 geliştirici varsayımı; cashier + waiter
için frontend uzmanının (veya ek mühendisin) paralel çalışması kritik.
Faz 16 partner programı Faz 10 sonrası paralel başlar ve W52'ye
(12 aya) kadar 3-5 aktif partner hedefler.

Anlık yapılmış / sıradaki ince liste: `docs/STATUS.md`.
