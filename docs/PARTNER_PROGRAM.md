# HashTap — Partner Programı (B2B Reseller Kanalı)

Bu doküman HashTap'in yerel yazılım şirketleriyle kurduğu B2B partner
ilişkisinin tüm boyutlarını tanımlar: kimi hedeflediğimiz, lisans
modelimiz, eğitim programımız, destek/güncelleme zincirimiz, marka
kullanımı, yasal çerçeve, partner yaşam döngüsü.

Son güncelleme: 2026-04-23.

İlgili:
- `adr/0012-partner-channel.md` — kanal stratejisi kararı
- `BUSINESS_MODEL.md` — doğrudan satış iş modeli (ikinci kanal)
- `INSTALLATION_PLAYBOOK.md` — IT ekibi kurulum rehberi (partner'ların
  takip edeceği aynı playbook)
- `OPERATIONS.md` — destek ve güncelleme altyapısı

## 1. Yönetici özeti

HashTap **iki paralel satış kanalı** yürütür:

1. **Doğrudan satış** (`BUSINESS_MODEL.md`) — HashTap kendi satış + IT
   ekibiyle 1-2 büyük şehirde restoranlara satış yapar. Öğrenme, referans
   toplama, marka bilinirliği.
2. **Partner kanalı** (bu doküman) — yerel yazılım şirketleri
   ("partner"lar) HashTap'in çekirdek ürününü satın alır, kendi
   bölgelerinde restoranlara satar, kurulumu kendileri yapar,
   L1 desteği kendileri verir.

HashTap'in partner modelindeki rolü:
- **Ürün sahibi**: yazılım geliştirme, güncelleme, çekirdek mimari
- **Lisans satıcısı**: partner'a lisans satıyor (tier bazlı)
- **Eğitmen**: partner ekiplerini sertifikalandırıyor
- **L2 destek**: partner'ın çözemediği sorunlar HashTap'e eskalatör
- **Altyapı sağlayıcısı**: Docker registry, uzaktan destek VPN,
  yedekleme depo, güncelleme pipeline

Partner'ın rolü:
- **Satış**: kendi bölgesinde restoran sahipleriyle müzakere
- **Kurulum**: saha ziyareti + Installer CLI + kabul testi
- **Birincil destek (L1)**: restoran sorunlarına ilk müdahale
- **Eğitim**: restoran personelini eğitme
- **İlişki yönetimi**: müşteri memnuniyeti

## 2. Neden partner kanalı?

### 2.1 Doğrudan satışın ölçek sorunu

`BUSINESS_MODEL.md` §2.3'te belirtildi: doğrudan satış lineer ölçekleniyor.
Her restorana IT ekibi gidiyor. 100 restoran = 100 kurulum + 100 destek
ilişkisi + 100 eğitim. HashTap küçük bir ekip olarak bu yükü
Türkiye genelinde yürütemez.

### 2.2 Yerel yazılım şirketlerinin güçlü yönleri

Türkiye'nin her ilinde kurumsal müşterilere IT hizmeti veren yerel
şirketler var:
- **Saha ekibi kurulu** — zaten kurulum/destek yapıyorlar
- **Müşteri ilişkileri var** — restoranlar onlara güveniyor (POS, muhasebe,
  ağ işleri tarihçesi)
- **Satış ağı var** — referans, bayi, ücretli satış danışmanı
- **Yasal altyapı kurulu** — fatura, KDV, sözleşme, muhasebe

HashTap'in sıfırdan inşa etmesi gereken satış ve kurulum infrastrüktürü
bu partner'larda hazır.

### 2.3 Ekonomik mantık

Partner başına ciro projeksiyonu (tier bazlı):

| Partner Tipi | Yıllık Kurulum | Lisans Geliri (HashTap'e) |
|---|---|---|
| Küçük partner (Bronze) | 10 | 800.000 TL |
| Orta partner (Silver) | 30 | 1.950.000 TL |
| Büyük partner (Gold) | 50+ | 2.500.000 TL+ |

10 aktif partner ile yıllık 10-25 milyon TL lisans cirosu makul hedef —
doğrudan satışın 3-5x katına ulaşır, ek saha ekibi gerektirmez.

### 2.4 Win-win dinamiği

- **Partner kazanır**: mevcut müşterisine ekleme satış + margin (istediği
  fiyattan satıyor, örn. 100K aldığı ürünü 200K'ya satıyor)
- **HashTap kazanır**: lineer olmayan ölçek + stabil lisans geliri + yerel
  bilgi avantajı
- **Restoran kazanır**: yerel ve tanıdık destek (partner'la aynı şehirde)

## 3. Hedef partner profili

### 3.1 İdeal partner özellikleri

Aradığımız yazılım şirketi:

- **Yerel IT hizmeti** vermiş **5+ yıl** tecrübe (kurumsal yazılım, POS,
  muhasebe entegrasyonu)
- **Saha ekibi ≥ 3 kişi** (IT/teknik personel, kurulum yapabilen)
- **Satış odağı kurumsal** (B2B; restoran sektörü tecrübesi artı)
- **Mevcut müşteri tabanı** 50+ aktif işletme müşterisi
- **Bölgesel yoğunluk** — bir il veya bölgeye odaklı (biz il-exclusive
  veriyoruz)
- **Finansal sağlam** — Silver/Gold tier için milyon TL peşin ödeme
  kapasitesi
- **Eğitilebilir** — HashTap sertifikasyonunu alacak zihniyette

### 3.2 Olmayan partner özellikleri (red flag)

- Sadece online satış (saha ekibi yok)
- Fazla rakipli pazarda agresif fiyat savaşçısı (margin'i sıfırlar,
  HashTap ürün imajı zedelenir)
- Başka POS markalarının münhasır bayisi (çıkar çatışması)
- Hukuki/finansal problem geçmişi
- Çok geniş coğrafya (tek il exclusive alamaz → bölge çakışması)

### 3.3 İdeal coğrafi dağılım

Türkiye'de ~40 il için aktif partner hedefi:
- **Tier 1 iller** (İstanbul, Ankara, İzmir, Bursa, Antalya): 2-3 partner
  ile paylaşımlı (çoğu ilçe ayrı)
- **Tier 2 iller** (20-25 orta büyüklük): il-exclusive 1 partner
- **Tier 3 iller** (10-15 küçük): bölgesel partner (komşu 2-3 il kapsar)

Doğrudan satışın tam çalıştığı 1-2 şehirde partner yok (pilot/referans
bölgesi).

## 4. Lisans modeli ve fiyatlandırma

### 4.1 Tier tablosu

Temel lisans fiyatları (**partner HashTap'e öder**):

| Tier | Paket Boyutu | Paket Başı Fiyat | Toplam Peşin | Efektif Birim | Ödeme |
|---|---|---|---|---|---|
| **Tekil** | 1 lisans | 100.000 TL | 100.000 TL | 100.000 TL | Satıştan önce |
| **Bronze** | 10 lisans | 80.000 TL | 800.000 TL | 80.000 TL | Sözleşme imzalandığında peşin |
| **Silver** | 30 lisans | 65.000 TL | 1.950.000 TL | 65.000 TL | Peşin veya 2 taksitte (6 ay) |
| **Gold (Enterprise)** | 50+ lisans | 50.000 TL | 2.500.000 TL (50 peşin) | 50.000 TL | 50 lisans peşin; 51+ ek alım aynı fiyatla |

**Fiyatlar görüşmeye açık** — hacim, bölge, taahhüt süresi gibi
faktörler için nihai rakam sözleşme müzakeresinde belirlenir. Yukarıdaki
rakamlar **baz liste fiyatı**dır.

### 4.2 Tier detayları

#### 4.2.1 Tekil Lisans
- Partner ihtiyaç bazlı 1 adet lisans satın alır
- Belli bir restoran için tahsis edilir (aktivasyonda restoran adı
  kilitlenir)
- **Kimin için:** yeni partner'ın test amaçlı ilk satışı, veya tier
  paketini tüketmiş partner'ın ara alımı
- **Kısıtlama:** yıllık 5 adet üstü tekil alımlarda partner Bronze'a
  yönlendirilir (idari maliyet)

#### 4.2.2 Bronze (10-Lisans Paketi)
- 10 lisans peşin ödenir, 12 ay içinde kullanılabilir
- Kullanılmayan lisans **1 yıl ek geçerli** (total 24 ay), sonra geçersiz
- **Kimin için:** yeni partner, küçük il, orta ölçekli hedefleme
- Paket başı %20 indirim (tekil fiyatına göre)

#### 4.2.3 Silver (30-Lisans Paketi)
- 30 lisans peşin veya 2 taksitte (sözleşme + 6 ay)
- 24 ay içinde kullanılabilir, 12 ay ek geçerli
- **Kimin için:** orta ölçekli il, 2+ yıllık partner, aktif satış ekibi
- Paket başı %35 indirim

#### 4.2.4 Gold / Enterprise (50+ Lisans)
- 50 lisans peşin ödeme (2.500.000 TL)
- 51. lisanstan itibaren aynı 50.000 TL birim fiyatla ek alım hakkı
  (aylık faturalanır, cari aytından ayın sonunda ödenir)
- 36 ay geçerlilik
- **Münhasır bölge** garantisi (il bazlı)
- **Kimin için:** büyük il exclusive partner, zincir restoran müşterisi
  olan şirket
- Paket başı %50 indirim (baz fiyatın yarısı)

### 4.3 Lisans neyi içerir / neyi içermez

**1 lisans = 1 restoran kurulumu** için gerekli her şey:
- ✅ HashTap yazılımının indirilmesi (Docker images)
- ✅ Installer CLI kullanım hakkı
- ✅ 12 ay boyunca otomatik güncellemeler
- ✅ Partner'ın kendi restoran müşterisine sınırsız destek verme hakkı
  (HashTap'in partner'a verdiği ücretsiz eğitim + portal dahil)
- ✅ Cloudflare Tunnel + Tailscale bağlantısı (HashTap altyapısı kullanımı)
- ✅ Gecelik yedekleme hizmeti (B2 deposu HashTap tarafında)

**Kapsam dışı (ayrı fiyatlandırılır):**
- ❌ Restoran'ın iyzico subMerchant onboarding ücreti (iyzico'nun kendi
  kesintisi, HashTap araya girmez)
- ❌ Restoran'ın e-Arşiv sağlayıcı aboneliği (Foriba/Uyumsoft kendi
  ücretleri)
- ❌ Donanım (kasa PC, yazıcı, tablet) — partner ayrı tedarik eder
- ❌ HashTap'in L2 saha ziyareti (müşteri ödemeli veya yıllık L2 paketi)
- ❌ Özel geliştirme istekleri (custom modül, özel rapor)

### 4.4 Yenileme (renewal) modeli

Lisans 12 ay geçerli (bronze/silver) veya 36 ay (gold). Geçerlilik
süresi sonunda:

- **Yenileme ücreti:** ilk yıl lisans bedelinin **%20'si/yıl**
  - Tekil: 20.000 TL/yıl
  - Bronze: 16.000 TL/yıl/lisans
  - Silver: 13.000 TL/yıl/lisans
  - Gold: 10.000 TL/yıl/lisans
- Yenileme bedeli, o restoran için güncellemeler + destek + backup
  servislerinin sürmesi için gerekli
- Yenilenmeyen lisans → restoran eski sürümde kalır, güncelleme almaz,
  uzaktan destek erişimi kesilir (ama yazılım çalışmaya devam eder —
  partner/restoran kendi başına yönetir)

### 4.5 Margin kurguları (partner'a gösterim)

Partner margin önerisi (son müşteriye satış fiyatı):

| Tier | Partner HashTap'e Öder | Önerilen Son Müşteri Fiyat | Partner Margin |
|---|---|---|---|
| Tekil | 100K | 150-200K | 50-100K (%33-50) |
| Bronze birim | 80K | 130-180K | 50-100K (%38-56) |
| Silver birim | 65K | 110-160K | 45-95K (%41-59) |
| Gold birim | 50K | 100-150K | 50-100K (%50-67) |

**Partner'a verdiğimiz fiyatlandırma özgürlüğü:** son müşteri fiyatını
kendisi belirler. HashTap MSRP (suggested retail price) önerisi verir
ama uygulamaz.

## 5. Bölge ve münhasırlık (exclusivity)

### 5.1 İl-exclusive model

**Kural:** Bir partner sözleşme imzaladığı il(ler)de tek HashTap resmi
partnerdir. Başka partner o ilde sözleşme alamaz (HashTap söz verir).

**İstisna:** HashTap'in doğrudan satış yaptığı 1-2 pilot şehir
(İstanbul, Ankara gibi) — partner olsa da HashTap direkt satışı paralel
sürer. Sözleşmede bu şehirler açıkça belirtilir.

### 5.2 Bölge atama kriterleri

Partner'ın alabileceği il sayısı tier'ına bağlı:

| Tier | Alabileceği İl Kapsamı |
|---|---|
| Tekil (tek satış bazında) | Bölge yok; sadece o satış için onay |
| Bronze | 1 il (küçük/orta) VEYA 1 ilçe (büyük il) |
| Silver | 1-2 il (orta ölçek) |
| Gold | 2-4 il (bölgesel, örn. Ege Bölgesi alt-grup) |

**Bölge genişletme:** Yıllık performans göstergesi (minimum kurulum
adedi) aşılırsa partner yeni il/bölge talep edebilir. HashTap onayı
gerekir.

### 5.3 Rekabet yasağı ve çakışma

- Partner başka QR sipariş / restoran POS ürününün resmi bayisi
  **olamaz** (ör: SambaPOS bayisi de HashTap partner olamaz).
- Hariç: kendi ERP veya muhasebe ürünleri satabilir — HashTap'le
  çakışmıyorsa.
- Partner bir müşterisini başka partner'ın bölgesinde bulursa satış
  yapamaz (iade edilmiş lead gibi işler).

### 5.4 Paralel doğrudan satış

- **Pilot şehirler:** İstanbul + 1 büyük şehir (Ankara/İzmir)
- Bu şehirlerde HashTap direkt satış da yapar
- Bir süre sonra (5-10 pilot restoran sonrası) bu şehirler partner'a
  geçirilebilir — ama pilot kurulumlar HashTap'in yönetiminde kalır
- İlk partner İstanbul'u alırsa, HashTap'in pilot kurulumlarının destek
  zinciri partnere devredilmez (ayrı idari)

## 6. Eğitim programı — HashTap Certified Partner

### 6.1 Eğitim yolculuğu

```
Sözleşme imzası
     ↓
1. Hafta: Hazırlık + ön okuma (online)
     ↓
2. Hafta: HASHTAP CERTIFIED PARTNER (HCP) PROGRAMI
     ↓
  3-5 günlük yüz yüze eğitim (HashTap merkez ofis)
     ├── İş modeli + satış (1 gün)
     ├── Teknik kurulum + Installer CLI (2 gün)
     ├── Destek + troubleshooting (1 gün)
     └── Pilot kurulum (gerçek bir restoranda, mentör eşliğinde) (1 gün)
     ↓
Sertifika sınavı (teorik + uygulamalı)
     ↓
Pasif olsun — ilk 3 satış HashTap mentörlüğünde yapılır
     ↓
Aktif partner statüsü
```

### 6.2 Eğitim içerikleri

**Modül 1 — İş ve Ürün (1 gün)**
- HashTap'in ürün pozisyonlandırması, rakipler, değer önerisi
- Satış konuşması (pitch deck) + demo senaryoları
- Fiyatlandırma argümanları, itiraz yanıtları
- Restoran segmentasyonu (Segment A/B/C)
- iyzico facilitator modeli + kart komisyonu anlatımı
- e-Arşiv fail-close kuralının müşteriye açıklanması

**Modül 2 — Teknik Kurulum (2 gün)**
- HashTap mimarisi (Odoo + Docker + customer PWA + print-bridge)
- Kurulum öncesi tespit (ön ziyaret checklist'i)
- Installer CLI kullanımı (tam akış, her wizard adımı)
- Menü import (Excel template + manuel düzeltme)
- Masa QR kodu üretimi + laminasyon
- Çevre birimleri: yazıcı, tablet, KDS ekranı kurulumu
- iyzico sandbox + Foriba/Uyumsoft test entegrasyon
- Caddy yerel TLS + mDNS + Cloudflare Tunnel
- Tailscale kayıt ve uzaktan destek akışı

**Modül 3 — Destek (1 gün)**
- Sık karşılaşılan sorunlar (runbook'lar)
- Log okuma (Odoo, Postgres, gateway, Caddy)
- Tailscale ile uzaktan bağlanma
- Watchtower + güncelleme akışı
- Yedekleme kontrolü ve restore (simülasyon)
- HashTap'e eskalasyon süreci (ne zaman, nasıl)
- Olay müdahalesi + postmortem (`OPERATIONS.md` §6 referans)

**Modül 4 — Canlı pilot kurulum (1 gün)**
- Gerçek bir restoranda HashTap mentör + partner IT ekibi birlikte
  tam bir kurulum yapar
- Partner yapıyor, mentör denetliyor ve müdahale ediyor
- Kurulum sonrası debrief — ne iyi gitti, ne iyileştirilmeli

### 6.3 Eğitim katılımcıları

Partner'dan zorunlu 3 rol:
- **1 Satış yöneticisi veya sahibi** (iş modeli + pazarlama)
- **1 Baş IT personeli** (tüm modüller)
- **1 Destek personeli** (teknik + destek modülleri)

Opsiyonel 1-2 ek teknik personel partner tercihine göre katılabilir.

### 6.4 Sertifika sınavı

- **Teorik** — 50 soru çoktan seçmeli + açık uçlu (1 saat)
- **Uygulamalı** — canlı simülasyonda sıfırdan kurulum yapılır (2 saat)
- **Geçme notu** — %80 teorik + uygulamalı tam başarı

Başarısızlık → 1 ay hazırlık + yeniden sınav (partner ücret ödemez ilk
tekrarda, ikincisi 10.000 TL).

### 6.5 Sertifika geçerliliği ve yenileme

- Sertifika **12 ay geçerli**
- Yıllık yenileme: 1 günlük güncelleme eğitimi + mini sınav (5.000 TL)
- 2 sürümü aşan major güncelleme olursa zorunlu yenileme
- Sertifikası düşmüş personel kurulum yapamaz (partner başka sertifikalı
  kişiyle devam eder)

### 6.6 Eğitim ücreti

- **İlk eğitim paketi** lisans paketine dahildir (Bronze ve üstü
  tier'larda)
- **Tekil lisans alan partner için** ayrı ücretli: 50.000 TL kişi başı,
  3 kişilik ekip 120.000 TL
- **Sonraki eğitimler** (yeni personel eklendiğinde) 30.000 TL/kişi

## 7. Destek yapısı (L1 / L2 zinciri)

### 7.1 Çağrı akışı

```
Restoran sorunu → Partner (L1 — 7/24)
    ├── %85 oranında burada çözülür
    └── Çözemezse:
        ↓
        Partner'dan HashTap L2'ye ticket
        (Partner Portal üzerinden + WhatsApp acil durumlar)
            ├── HashTap destek ekibi müdahale eder
            └── SLA süreleri (altta)
```

### 7.2 SLA — HashTap'ten partner'a

| Seviye | Tanım | İlk müdahale | Çözüm hedefi |
|---|---|---|---|
| P0 | Restoran tamamen durdu, çalışmıyor | 15 dk | 2 saat |
| P1 | Kritik özellik çalışmıyor (ödeme, KDS, sipariş) | 30 dk | 4 saat |
| P2 | Orta düzey bug, iş devam ediyor | 4 saat | 2 iş günü |
| P3 | Minor, iyileştirme | 1 iş günü | 5 iş günü |

**HashTap → partner SLA** (partner'ın müşterisine daha geniş SLA
vermesinde partner serbesttir — kendi marjı).

### 7.3 Destek kanalları

- **Partner Portal** — ticket açma (asıl kanal)
- **Slack Connect / dedicated channel** (Gold tier partner'lar için)
- **WhatsApp destek grubu** (acil P0/P1)
- **E-posta** (yedek)
- **Saha ziyareti** — HashTap L2 gerekirse gelir (faturalanır — partner
  veya müşteri öder; sözleşmede tanımlı)

### 7.4 Bilgi tabanı (Knowledge Base)

HashTap Partner Portal'da:
- Sık karşılaşılan sorunlar + çözümleri (runbook)
- Troubleshooting ağaçları (karar akışı)
- Video eğitimler (15-30 dk'lık konu başı)
- Makale arşivi (güncelleme notları, yeni özellikler)
- Forum (partner'lar arası bilgi paylaşımı, moderasyonlu)

## 8. Güncelleme stratejisi

### 8.1 Kim ne zaman günceller

Pivot sonrası `OPERATIONS.md` §4'teki canary → stable akışının partner
varyantı:

```
HashTap iç test ortamı (dev)
    ↓
HashTap direkt-satış kurulumları (1-2 şehir canary)
    ↓  48 saat + 0 regression
Partner Bronze/Silver kurulumları (stable tag) — otomatik Watchtower
    ↓  48 saat + izleme
Gold tier partner kurulumları (opsiyonel 30 gün delay hakkı)
```

Gold tier partner için **güncelleme erteleme hakkı**: 30 güne kadar
ertelerse, o zaman içinde kendi test ortamında doğrular.

### 8.2 Güncelleme onay hakkı

- **Tekil/Bronze** partner: otomatik (HashTap stable tag'ine bağlı)
- **Silver** partner: opsiyonel 7 gün delay (onay penceresi)
- **Gold** partner: opsiyonel 30 gün delay + partner onay akışı

### 8.3 Partner-specific build var mı?

MVP'de **hayır** — tüm partner'lar aynı stable image'ı kullanır.
İleride Faz 2+'da:
- White-label asset'lar (logo, renk) partner başına Docker layer
- Partner-özel özellikler request üzerine (yüksek ücretli modül)

## 9. Partner Portal (web uygulaması)

### 9.1 Nereye konuşlanıyor

HashTap cloud ops altyapısında (Hetzner / managed) — küçük bir Fastify
+ React web uygulaması. Partner'lar `https://partner.hashtap.app` üzerinden
erişir, SSO + 2FA.

### 9.2 MVP özellikleri

#### 9.2.1 Dashboard
- Aktif lisans sayısı / kullanım oranı (tier paketinden)
- Bu ay açılan kurulum sayısı
- Bekleyen ticket sayısı
- Son güncelleme durumları
- Yıllık performans grafiği

#### 9.2.2 Lisans yönetimi
- Paket satın alma (Tekil, Bronze, Silver, Gold)
- Aktif lisans listesi (hangi kurulumda, aktivasyon tarihi)
- Lisans aktarımı (bir restoran sözleşmesi bitince başka restorana
  tahsis etmek istiyorsa — kural: sadece aynı il içinde)
- Yenileme zamanı uyarıları

#### 9.2.3 Kurulum yönetimi
- Yeni kurulum başlat (installer CLI indir, kurulum token'ı al)
- Kurulum listesi (restoran adı, durum, versiyon, yedek durumu,
  son heartbeat)
- Kurulum detayı (uzaktan terminal açma, log görüntüleme, yedekten
  restore)

#### 9.2.4 Destek
- Ticket aç / takip et
- Bilgi tabanı arama
- Runbook'lara erişim
- Eğitim materyalleri

#### 9.2.5 Faturalama
- Fatura listesi (HashTap'ten partner'a kesilen)
- Ödeme durumu
- Gelecek tahsilatlar

#### 9.2.6 Pazarlama kit
- Broşür, PDF, demo video
- Ko-markalı malzeme şablonları
- Fiyatlandırma kalkülatörü (partner'ın kendi margin'ini hesapla)
- Referans / case study yazıları

### 9.3 Teknik implementasyon (faz sonrası iş)

- Backend: Fastify + Postgres (HashTap ops instance'ında)
  - Lisans aktivasyon API'si (her kurulum bir lisansı tüketir)
  - Kurulum heartbeat entegrasyonu (zaten var — `OPERATIONS.md` §3)
  - Ticket sistemi (basit, Odoo'nun mail.thread üzerine)
- Frontend: React + Tailwind (`packages/ui` kullanılır — DESIGN_SYSTEM.md)
- Auth: SSO (email + 2FA), role-based (partner admin, IT, satış)

Faz 16'da (ROADMAP.md güncellenecek) geliştirilir.

## 10. Marka kullanımı ve white-label yol haritası

### 10.1 Marka kuralları (MVP)

Partner satış yaparken:
- HashTap markasını **görünür olarak** kullanır — "HashTap Yetkili
  Partner: [Partner Adı]"
- Broşürler, web sitesi, sözleşme: HashTap logosu + marka kuralları
  kılavuzuna (brand guidelines) uyar
- Kendi marka adını yan yana kullanabilir (co-brand): "HashTap × XYZ
  Yazılım"

### 10.2 Yasaklanan kullanımlar

- Partner HashTap yazılımını **kendi markası altında** satamaz
  (white-label MVP'de kapalı)
- "HashTap'i biz yaptık" gibi ifadeler yasak
- HashTap logosunu değiştiremez, farklı renkte kullanamaz
- HashTap domainini / alt alanlarını kullanamaz (kendi partner.xyz.com
  olsun)

### 10.3 White-label (faz 2+)

Gold tier partner'lara **opsiyonel**:
- Tamamen kendi markası altında satış (ör. XyzPOS)
- HashTap adı müşteriye görünmez
- Ek lisans ücreti (%20-30 üzerine)
- Tek koşul: HashTap'in ürün sahibi olduğu içsel dokümantasyonda (sözleşme,
  KVKK, destek iletişim) belirtilir

White-label, partner'ın kendi müşteri markasını korumak isteyen büyük
müşterileri için değerli — faz 2'de açılacak.

## 11. Yasal çerçeve

### 11.1 Partner sözleşmesi türü

**Non-Exclusive Reseller Agreement** (MVP) — partner HashTap'in resmi
satıcısı, ama HashTap başka kanallar (doğrudan, başka partner) yürütme
hakkını saklı tutar.

**İl-Exclusive** — bölge bazlı exclusivity sözleşme ekinde tanımlı
(annex).

### 11.2 Sözleşme süresi

- İlk sözleşme: **12 ay**
- Otomatik yenileme 12 ay'lık (iki taraf da 30 gün önce bildirimde
  bulunmazsa)
- Early termination (30 gün bildirim): her iki taraf fesih hakkı
- Feshin etkisi: aktif müşteri kurulumları yaşamaya devam eder;
  partner'ın kullanmamış lisans paketi **iade edilmez** (sözleşmede net)

### 11.3 Fikri mülkiyet (IP)

- HashTap çekirdek yazılımı HashTap'in IP'si
- Partner türev ürün yapamaz (fork, custom modül satamaz)
- Partner'ın gerekli gördüğü özel özellikler HashTap'a request olarak
  gelir, HashTap kendi kararıyla ürüne dahil eder veya etmez

### 11.4 Müşteri ilişkisi

- Restoran sözleşmesi: **partner ↔ restoran arasında** imzalanır
- HashTap ile restoran arasında doğrudan sözleşme yok (veri işleyen
  DPA hariç — aşağıda)
- Partner iflas ederse: HashTap doğrudan restorana destek verme hakkını
  saklı tutar (müşteri süreklilik garantisi)

### 11.5 Veri koruma (KVKK/DPA)

- Restoran müşterisi veri sorumlusudur
- Partner veri işleyen (kurulum, destek, birincil bakım)
- HashTap alt-veri işleyen (yedekleme + ops telemetri)
- Üç katmanlı DPA: Restoran → Partner → HashTap

### 11.6 Sorumluluk sınırı

- HashTap'in sorumluluğu: yazılımın sözleşmede tanımlı çalışması
- Partner'ın sorumluluğu: doğru kurulum + müşteri eğitimi + L1 destek
- Restoran veri kaybı (backup başarısızlığı): HashTap teknik sebep
  belirlenebiliyorsa (uptime kuma'da yedek log kaybolduysa) sorumlu;
  partner konfigürasyon hatası (yedekleme kapatıldı) ise partner
  sorumlu

### 11.7 Uyum (compliance)

- Partner KVKK uyum beyanı veriyor
- Partner vergi numarası geçerli, faturalandırma sistemine entegre
- Yıllık güvenlik audit hakkı HashTap'te

## 12. Partner onboarding akışı (ilk 90 gün)

```
Gün 0: İlk görüşme
    ├── HashTap partner profili doldurulur
    ├── Demo sunulur
    └── Ön uygunluk değerlendirmesi
        ↓
Gün 7: Teklif ve sözleşme
    ├── Tier ve bölge belirlenir
    ├── Hukuki dokümantasyon paylaşılır
    └── Sözleşme imzası
        ↓
Gün 14: Lisans paketi ödemesi + kayıt
    ├── Partner Portal hesabı açılır
    ├── Ödeme teyit edilir
    └── Eğitim programı tarihi belirlenir
        ↓
Gün 21-28: Yüz yüze eğitim (3-5 gün)
    ├── Modül 1-4 tamamlanır
    ├── Sertifika sınavı
    └── Certified Partner statüsü
        ↓
Gün 30-90: Pilot faz (3 kurulum)
    ├── İlk kurulum: HashTap mentörü partnerle birlikte
    ├── İkinci kurulum: HashTap mentörü gözlem
    ├── Üçüncü kurulum: bağımsız, HashTap sadece telefonda
    └── Faz değerlendirme: aktif partner statüsüne geçiş
        ↓
Gün 90+: Aktif partner
    └── Kendi başına satış + kurulum + destek
```

### 12.1 Pilot faz değerlendirme kriterleri

İlk 3 kurulumdan sonra:
- Kurulum kalitesi (HashTap kabul testi skoru)
- Müşteri memnuniyeti (anket)
- Süre (her kurulum 8 saat altında mı)
- Ticket kalitesi (L1'de çözüm oranı)

Başarısız olursa → 1 ay ek mentörlük + yeniden değerlendirme. İkinci
kez başarısız olursa sözleşme feshi (peşin ödenen paket kısmi iade).

## 13. Partner yaşam döngüsü

### 13.1 Performans göstergeleri (yıllık değerlendirme)

| KPI | Hedef |
|---|---|
| Kurulum adedi | Tier kotasının %80+'ı |
| Kurulum başarı oranı | %95+ kabul test geçme |
| Müşteri memnuniyet (NPS) | 50+ |
| L1 çözüm oranı | %80+ ticket partner'da çözülür |
| Ticket kalitesi | HashTap'e eskalasyonda gereksiz çağrı oranı %10 altı |
| Sertifika güncelliği | %100 personel geçerli sertifikaya sahip |

### 13.2 Tier yükseltme/indirme

**Yükseltme:** Performans hedefini tutturan partner talep edebilir.
HashTap bölge müsaitse + talep hacmi varsa onaylar.

**İndirme (nadiren):** Performans 2 yıl üstüste tier altında
kaldıysa HashTap bir alt tier'a öneri yapar. Partner kabul etmezse
sözleşme feshedilebilir.

### 13.3 Partner ayrılışı

Sözleşme feshi veya yenilenmeme durumunda:
- Aktif restoran kurulumları **yaşamaya devam eder** (lisans geçerlilik
  süresi içinde)
- Partner'ın bölgesi 90 gün sonra başka partner'a açılır
- HashTap devredilen restoranlara yeni partner atayabilir (müşteri
  onayıyla) veya doğrudan destek verir
- Partner'ın elinde kullanılmamış lisans kalırsa **iade edilmez** ama
  90 gün sonra elindeki lisanslara HashTap isterse bir miktar kredi
  verebilir (iyi niyet / gelecekteki iş)

### 13.4 Partner'dan partner'a bölge devri

Bir partner bölgesini başka partner'a satmak isterse:
- HashTap yazılı onayı zorunlu
- Yeni partner sertifikalı olmalı veya hızlandırılmış eğitim alır
- Devir ücreti (her kurulum başı 5.000 TL idari) HashTap'e ödenir
- Aktif müşteri kurulumları yeni partner'a transfer edilir

## 14. Hedef pazarlar / aday partner listesi (başlangıç)

Türkiye illerine göre aday yerel yazılım şirketi profilleri:

### 14.1 Tier 1 iller (2-3 partner ortak)
- İstanbul (7 büyükşehir ilçesi)
- Ankara (Çankaya + Keçiören)
- İzmir (Konak + Karşıyaka)
- Bursa
- Antalya

### 14.2 Tier 2 iller (1 il-exclusive partner)
- Konya, Kayseri, Adana, Gaziantep, Mersin, Diyarbakır, Samsun,
  Denizli, Eskişehir, Şanlıurfa, Manisa, Hatay, Balıkesir, Aydın,
  Tekirdağ, Muğla, Trabzon, Kocaeli, Sakarya, Ordu

### 14.3 Tier 3 bölgesel
- Karadeniz Doğu (Ordu-Trabzon-Rize-Giresun → 1 partner)
- Doğu Anadolu (Erzurum-Kars-Erzincan → 1 partner)
- Güneydoğu (Mardin-Batman-Siirt → 1 partner)
- İç Anadolu (Aksaray-Niğde-Nevşehir → 1 partner)

### 14.4 Partner bulma kanalları

- **Satış ekibi outbound:** yerel POS bayi topluluklarından, muhasebe
  yazılım bayi listelerinden
- **Referans:** mevcut restoran müşterisi sayesinde IT firması
  tanışıklığı
- **Konferans / fuar:** Teknokent, Bilişim Zirvesi, yerel IT
  topluluklarına katılım
- **Online:** HashTap web sitesinde "Partner Ol" sayfası — gelen
  başvurular

## 15. Riskler ve azaltımlar

| Risk | Olasılık | Etki | Azaltım |
|---|---|---|---|
| Partner kötü kurulum yapar, marka zarar görür | Orta | Yüksek | Sertifikasyon + ilk 3 pilot mentörlük + kabul test checklist |
| Partner iflas eder, müşteriler askıda kalır | Düşük | Yüksek | HashTap doğrudan destek hakkı (sözleşmede) + bölge devri |
| Partner rakip ürün satıyor (conflict) | Orta | Orta | Sözleşmede rekabet yasağı, yıllık audit |
| Partner fiyat kırıyor, pazar değerini erite | Orta | Orta | MSRP önerisi + yıllık performans değerlendirme |
| Lisans aktivasyon hilesi (bir lisansla birden çok kurulum) | Düşük | Orta | Her kurulumun HashTap ops'a heartbeat atması zorunlu + anomaly detection |
| Partner ekibi sertifikasız kurulum yapar | Orta | Düşük | Kurulum sırasında Partner Portal sertifika kontrolü + audit logs |
| Güncelleme partner'ın izniyle geç yayılır, güvenlik açığı | Düşük | Yüksek | Kritik güvenlik patch'leri manuel override hakkı (HashTap) |
| İki partner bölge çakışması iddia eder | Düşük | Orta | Bölge sözleşmesi ekinde net harita + tarih + öncelik sırası |
| Partner Portal geliştirmesi gecikir | Yüksek | Orta | Faz 16 başlangıcına kadar Trello/Odoo manual workaround |
| Partner eğitim yükü HashTap'i fazla meşgul eder | Orta | Orta | Standart eğitim akışı + e-learning portal (scale) |

## 16. KPI'lar — Partner programı başarı göstergeleri

### 16.1 HashTap açısından

| KPI | 6. ay hedefi | 12. ay hedefi | 24. ay hedefi |
|---|---|---|---|
| Aktif partner sayısı | 3-5 | 8-12 | 20-25 |
| Toplam lisans satışı (cirosal) | 2-4M TL | 10-15M TL | 25-40M TL |
| Partner NPS | 40+ | 50+ | 60+ |
| L2 eskalasyon oranı | %25 | %20 | %15 |
| Sertifika tazeleme oranı | %90+ | %95+ | %98+ |

### 16.2 Partner açısından (hedefler)

- İlk 6 ayda break-even (peşin ödenen lisans paketini geri kazanma)
- 12. ay sonunda Bronze partner: 10 satış tamamlanmış
- 12. ay sonunda Silver partner: 20-25 satış
- NPS müşteri tarafı 50+

## 17. Faz planı (partner programı için)

Partner programının hayata geçişi ROADMAP.md'de **Faz 16**
olarak eklenir:

| Hafta | İş |
|---|---|
| W1-W2 | Partner sözleşme hukuki review + tamamlanma |
| W3-W4 | Pazarlama kit (broşür, pitch deck, demo script) |
| W5-W8 | Eğitim materyalleri (modül sunumları, sınav hazırlığı, video) |
| W9-W12 | Partner Portal MVP (dashboard + lisans + ticket) |
| W13-W14 | İlk 2-3 aday partnerle görüşme ve anlaşma |
| W15-W16 | İlk kohort eğitim + sertifika sınavları |
| W17-W24 | Pilot partner faz (her birinin 3 kurulum pilotu) |
| W25+ | Aktif partner statüsü + yeni partner kabul süreci |

Partner programı başarısı için ön koşul: **Faz 10 (HashTap'in doğrudan
pilot restoran kurulumu)** tamamlanmış olmalı — referans ve case study
olmadan partner satışı ikna zor.

## 18. Açık konular (karar bekliyor)

- **Yabancı partner mı?** Türkiye dışı (KKTC, Azerbaycan gibi) partner
  sözleşmeleri farklı yasal çerçeve gerektirir — faz 2+ kararı
- **Partner'dan partner'a çapraz satış** (ör. İstanbul partner Bursa
  müşterisi getirirse komisyon) — basit bir referral programı eklenebilir
- **Exclusive sözleşme süresi** 1 yıl mı yeterli yoksa 2-3 yıl'a çıkmalı mı
  (partner'ın yatırım güvencesi için)
- **Ön ödeme finansmanı** — bazı partner'lar Silver paketini tek seferde
  ödeyemeyebilir; 2-3 taksit kolaylığı sözleşmede nasıl kurallanır
- **White-label açılış zamanı** — ilk 10 partnerle mi yoksa 2 yıl sonra mı?
- **Partner program yöneticisi rolü** — HashTap tarafında tam zamanlı bir
  Partner Success Manager gerekli (10+ partner sonrası zorunlu)
- **Partner sözleşme dili** — sadece Türkçe mi, İngilizce versiyon da
  lazım mı (yabancı yatırımcılı IT firması için)?
- **Bayi portalı markalanması** — HashTap-branded mi yoksa
  "Partner Hub" gibi nötr bir isim mi?

## 19. Özet — Tek cümle

**HashTap partner programı, Türkiye'nin her ilinde yerel bir yazılım
firmasının bizim ürünümüzü kendi müşteri tabanına sertifikalı şekilde
satıp kurması ve bize tier bazlı sabit lisans geliri akıtmasıdır —
satışı lineer ölçekten çıkarıp ağ etkisine dönüştürür.**
