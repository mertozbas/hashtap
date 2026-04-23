# HashTap — İş Modeli

Bu doküman HashTap'in nasıl satılacağını, nasıl kurulacağını, nasıl para
kazandıracağını ve hangi operasyonel sorumlulukların bizde, hangilerinin
müşteride olduğunu kayıt altına alır. **Stratejik pivot dokümanıdır:**
önceki "multi-tenant cloud SaaS" modelinden **"on-premise kurulum + tek
kiracı yazılım"** modeline geçişi tanımlar.

Son güncelleme: 2026-04-23.

İlgili dokümanlar:
- `adr/0011-on-premise-deployment.md` — kararın ADR kaydı
- `ARCHITECTURE.md` — pivot sonrası mimari
- `INSTALLATION_PLAYBOOK.md` — IT ekibinin kurulum rehberi
- `OPERATIONS.md` — kurulum sonrası destek, güncelleme, yedekleme
- `PRODUCT.md` — ürün tanımı (pivot sonrası güncellenmiş bölümleri)

## 1. Yönetici özeti

HashTap, Türkiye restoran pazarına **"gel, kur, teslim et, destekle"**
modeliyle satılır. Bulut abonelik (SaaS) modeli reddedilmiştir.

**Satış → Kurulum → Teslim → Destek → (ileride) Donanım bundle'ı** zinciri
dört aşamalıdır:

1. **Satış ekibi** restorana gider, demo yapar, sözleşme imzalar.
2. **IT ekibi** restorana gider, yazılımı restoranın mevcut donanımına
   (veya sonraki fazda HashTap markalı donanıma) kurar, yazıcıları,
   ekranları, tabletleri bağlar, test eder.
3. **Teslim** — sistem uçtan uca çalışır durumda müşteriye devredilir.
4. **Destek** — uzaktan erişim ve telefon/saha desteğiyle sistem canlı
   tutulur.

Her restoran **tek başına, kendi binasında, kendi donanımında, kendi
verisiyle** çalışır. HashTap'in bulut sunucu maliyeti bu modelde
neredeyse sıfırdır (sadece güncelleme deposu, uzaktan-destek ve küçük
yardımcı servisler bizim tarafımızda durur).

## 2. Neden pivot — SaaS yerine on-premise?

### 2.1 SaaS modelinin yükleri (bizden kaldırılıyor)

- **Sunucu maliyeti bizde.** Her restoran için DB + compute + storage +
  trafik HashTap'in bulut faturasında. Ölçeklenme doğrudan gidere dönüyor.
- **Multi-tenant mimari karmaşası.** DB-per-tenant, subdomain routing,
  provisioning otomasyonu, veri sızıntı riskleri, global monitoring. Kod
  tabanının %20-25'i bu amaçla yazılmış/yazılacaktı.
- **Internet kesintisi = dükkan kapalı.** Restoran internetten düşünce
  sipariş de ödeme de mutfak ekranı da çalışmıyor.
- **Türk pazarı abonelik kültürüne uzak.** Restoran sahipleri "aylık
  500 TL"den ziyade "tek seferlik 25.000 TL + yıllık bakım" modeline
  daha yatkın. POS satıcıları (SambaPOS bayileri, Hugin, Mikro) 20+
  yıldır bu modelde satıyor.
- **Veri egemenliği endişesi.** KVKK ve "müşteri verim senin sunucunda
  duruyor" algısı — özellikle orta/büyük restoranlarda itiraza yol
  açıyor.

### 2.2 On-premise modelin avantajları (bizde kalıyor)

- **Yüksek marj.** Tek satıştan 25.000–80.000 TL arasında gelir (donanım
  bundle'ıyla daha fazla). SaaS'ın 18 aylık MRR'ını tek vuruşta alıyoruz.
- **Offline dayanıklılık.** Restoran LAN'ı çalıştığı sürece sipariş,
  KDS, garson, kasa çalışır. Sadece ödeme ve e-Arşiv internet gerektirir
  (onlar da kuyrukta bekler).
- **Veri egemenliği.** Restoran "verilerim binamda" diyor; güven +
  KVKK uyumu.
- **Mimari sadeleşme.** Multi-tenancy tamamen kaldırılıyor. Her kurulum
  tek kiracılı. Kod tabanı sadeleşiyor, bug yüzeyi daralıyor.
- **Türk pazarına oturmuş satış modeli.** Saha-odaklı satış + on-premise
  kurulum + yıllık bakım modeli Türkiye POS pazarında oturmuş bir
  yaklaşım; bize SaaS'ın gerektirdiği dijital pazarlama + self-serve
  onboarding + ücretsiz deneme ekonomisini kurmaktan daha kolay.
- **Sonraki aşamada donanım bundle'ı.** "HashTap Kasa Pro + yazıcı +
  tablet" paketi olarak satılabilir. Donanım marjı ilave gelir akışı.

### 2.3 On-premise modelin yükleri (kabul edilen)

- **Kurulum lineer ölçekleniyor.** Her restorana IT ekibi gidiyor; 1000
  restoran = 1000 kurulum. Bu yükü azaltmak için installer CLI
  otomasyonu ve saha ekibinin ölçeklenmesi kritik.
- **Güncelleme sorumluluğu bizde.** Bug fix çıktıktan sonra 500 restoran
  donanımındaki Docker image'ların otomatik pull'u + rollback mekanizması
  gerekli (detay: `OPERATIONS.md` §4).
- **Saha desteği.** Gece 02:00'de kasa çöktü diye arayan restoran için
  uzaktan-erişim (Tailscale/Wireguard) + SLA politikası + on-call
  mühendis.
- **Donanım sürümlülüğü.** Windows 10/11, Ubuntu, ARM/x86, farklı POS
  donanımları. Docker çoğunu soyutluyor ama yine de "bu bilgisayarda
  Docker Desktop kurulu değil" senaryosuyla karşılaşacağız.
- **Yedekleme kritik.** Restoran PC'si ölürse yedek yoksa müşteri
  kaybıdır. Gecelik şifreli S3/B2 yedek zorunlu (detay: `OPERATIONS.md`
  §5).

Bu yüklerin her birinin net çözümü `OPERATIONS.md` ve
`INSTALLATION_PLAYBOOK.md` dokümanlarında tanımlanmıştır. Hiçbiri
"bilinmeyen" değildir; sanayide standart çözüm yolları vardır.

## 3. Satış süreci

### 3.1 Satış ekibi profili

- Türkiye restoran pazarına hâkim, POS/muhasebe satışı tecrübesi olan
  iç satış ekibi.
- Saha satışı (restorana gidip demo) birincil kanal.
- Demo için taşınabilir bir kurulum (laptop + tablet + küçük yazıcı +
  QR menü kartı) ile gösterim.

### 3.2 Satış akışı

1. **Ön görüşme** — telefon / referans / saha kapı çalma. Restoranın
   ihtiyaçları: kaç masa, mevcut POS var mı, yazıcı var mı, tablet var mı.
2. **Saha demo** — 30-45 dakika canlı demo. Kasa ekranı, garson tableti,
   KDS, müşteri QR akışı. Restoran sahibi kendi telefonundan QR
   okutturur.
3. **Teklif hazırlama** — restoranın donanım durumuna göre fiyat:
   - Paket A (yazılım sadece, mevcut donanım kullanılıyor): düşük fiyat
   - Paket B (yazılım + eksik donanım — yazıcı, tablet, ekran): orta
   - Paket C (tam bundle, HashTap markalı donanım dahil): yüksek
4. **Sözleşme** — yazılım lisansı, kurulum, eğitim, 1 yıl bakım dahil.
   Ek yıllar için bakım yenileme.
5. **Kurulum randevusu** — IT ekibiyle tarih belirlenir, restoran kapalı
   saatlerde gerçekleştirilir (genellikle öğleden önce veya gece).

### 3.3 Fiyatlandırma (son kullanıcı — restoran)

Dört paket, restoranın mevcut donanım durumuna ve kurulum kapsamına
göre seçilir:

| Paket | İçerik | Kurulum (tek seferlik) | Aylık bakım (opsiyonel) |
|---|---|---|---|
| **A — QR Menü + Ödeme** | HashTap yazılımı, menü aktarımı, QR baskı, eğitim. Mevcut sistem korunur. | 80.000 TL | 1.500 TL/ay |
| **B — QR Menü + Donanım** | A + QR menü donanımı, ağ altyapısı, baskı, saha kurulumu | 120.000 TL | 1.500 TL/ay |
| **C — Yazılım + Eksik Donanım** (popüler) | B + termal yazıcı, garson tableti, KDS ekranı, print-bridge | 200.000 TL | 1.500 TL/ay |
| **D — Full Kurulum** | Tam HashTap bundle + HashTap markalı kasa PC (15.6") + mutfak ekranı (21.5") + tüm donanımlar sıfırdan, öncelikli destek | 350.000 TL | 1.500 TL/ay |

Fiyatlar pilot öncesi çalışma tahmini — restoranın büyüklüğüne,
masa sayısına, konsept sayısına göre netleşir.

**Aylık bakım opsiyoneldir:** yenilenmezse sistem çalışmaya devam eder;
sadece uzaktan destek + güncelleme + yedekleme izleme kesilir. Veri ve
yazılım kullanım hakkı restoranda kalır.

**Gelir akışları:**
1. **Kurulum ücreti** — birincil gelir, tek seferlik satış.
2. **Aylık bakım** — ikincil, yinelenen. Güncelleme, uzaktan destek,
   yedekleme izleme, telefon desteği.
3. **İşlem komisyonu** (facilitator fee) — iyzico üzerinden geçen
   ödemelerde küçük bir HashTap payı. Marjinal, ana akım değil.
4. **Donanım marjı** — bundle paketlerinde (B/C/D) donanımda
   üretici → HashTap → restoran zincirindeki fark.
5. **Ek modül / özellik satışı** (faz 2+) — sadakat programı, delivery
   entegrasyonu, AI menü önerisi gibi şeyler modüler eklenti olarak.

### 3.4 Hedef satış rakamları (ilk 12 ay, pilot sonrası)

**Doğrudan satış (İstanbul + 1 şehir):**

| Çeyrek | Kurulum adedi | Ortalama paket | Ciro tahmini |
|---|---|---|---|
| Q1 (pilot) | 1-3 | 120.000 TL | 120-360.000 TL |
| Q2 | 5-10 | 140.000 TL | 700K-1.4M TL |
| Q3 | 15-25 | 160.000 TL | 2.4-4M TL |
| Q4 | 30-50 | 180.000 TL | 5.4-9M TL |

Bu muhafazakar tahminler; satış ekibi tam oturursa yukarı kıvrılabilir.
Toplam 12 aylık hedef: **~8-15M TL doğrudan satış**.

## 4. Kurulum süreci (IT ekibi)

Ayrıntılı playbook: `INSTALLATION_PLAYBOOK.md`.

### 4.1 Ön hazırlık (restoranda, kurulum gününden önce)

IT ekibinden biri **kurulum öncesi ziyaret** yapar (veya satış ekibi
paylaşır):
- Restoranın internet bağlantısı var mı, hızı ne?
- Mevcut POS/kasa bilgisayarı var mı? Model, işletim sistemi?
- Mutfakta KDS ekranı koyulacak yer var mı?
- Yazıcı(lar) — mevcut mu, yeni mi? Model, bağlantı (USB/Ethernet)?
- Tablet — garsonlar hangi cihazı kullanacak? Android/iOS?
- Wi-Fi kapsamı salonun her masasını kapsıyor mu?

Sonuç: kurulum gerekliliği listesi + donanım listesi + süre tahmini.

### 4.2 Kurulum günü (4-8 saat)

Tipik bir kurulumun yol haritası:

| Saat | Aktivite |
|---|---|
| 0:00 | Ekip gelir, restoran sahibiyle selamlaşma, alan keşif |
| 0:30 | Kasa PC'sine Docker kurulumu + HashTap installer çalıştırma |
| 1:30 | Yazılım ayağa kalktı: Odoo + Postgres + Redis + uygulamalar |
| 2:00 | Restoran bilgileri girişi: isim, vergi no, iyzico hesabı, e-Arşiv hesabı |
| 2:30 | Menü yükleme (satış öncesi hazırlanmış Excel'den import veya manuel) |
| 3:30 | Yazıcıların ağa bağlanması, test baskısı |
| 4:00 | Tabletlerin (garson) kurulumu, waiter app yüklenmesi, test |
| 4:30 | KDS ekranının kurulumu, test siparişi |
| 5:00 | Kasa ekranının ayarlanması, ödeme testleri |
| 5:30 | Uçtan uca kabul testi: 3 masa, 3 farklı sipariş, 3 farklı ödeme yolu |
| 6:00 | Restoran personeline hızlı eğitim (kasa, garson, mutfak) |
| 7:00 | Teslim formu imzası, iletişim kanalları (destek hattı) paylaşımı |
| 7:30 | Çıkış |

### 4.3 Teslim kriterleri

Aşağıdakilerin tümü yeşilse sistem teslim edilir:

- [ ] Her masa QR kodu okutulup menü geliyor.
- [ ] Bir test siparişi uçtan uca: QR → sipariş → KDS → yazıcı → kasa →
      ödeme (sandbox) → e-Arşiv (mock) → kapat.
- [ ] Kasa ekranı 12 saat kesintisiz açık kalma testinden geçti
      (uzaktan izlenir).
- [ ] Yedekleme servisi ilk gece snapshot'ını başarıyla aldı.
- [ ] Uzaktan destek (Tailscale) bizim tarafımızdan erişilebilir.
- [ ] Restoran personeli en az iki kez doğru sipariş akışını yönetti
      (eğitim kalitesi).

Teslim sonrası ilk 72 saat **yakın izleme**: HashTap tarafında bir
mühendis on-call, herhangi bir uyarıda hızlı müdahale.

## 5. Destek modeli

Ayrıntı: `OPERATIONS.md`.

### 5.1 Destek seviyeleri

| Seviye | Kapsam | Çözüm süresi hedefi |
|---|---|---|
| **L1 — Kullanıcı hatası** | "Nasıl yaparım?", eğitim eksikliği | Aynı gün |
| **L2 — Yazılım hatası (kritik değil)** | Rapor gelmiyor, yazıcı ara sıra boş fiş basıyor | 1-3 iş günü |
| **L3 — Kritik (dükkan çalışmıyor)** | Kasa açılmıyor, ödeme alamıyor, KDS donuyor | 30 dakika içinde ilk müdahale, 2 saat içinde çözüm hedefi |
| **L4 — Donanım arızası** | PC bozuldu, yazıcı çöktü | Değişim parça sürelerine bağlı; yedek donanım sözleşmeye göre |

### 5.2 İletişim kanalları

- **WhatsApp destek hattı** — restoran sahibinin birincil kanalı.
- **Telefon destek hattı (mesai)** — 08:00–24:00 arası canlı.
- **Gece on-call (00:00–08:00)** — sadece L3+ için; PagerDuty benzeri
  rota.
- **Uzaktan erişim** — Tailscale, müşteri onayı olmadan bağlanmıyoruz
  ama sözleşmede "arıza durumunda önceden onay" maddesi var.

### 5.3 Bakım pencereleri

- Güncellemeler **geceleri** restoran kapalıyken uygulanır.
- Watchtower (otomatik Docker pull) default saat: 04:00 Türkiye saati.
- Büyük versiyon güncellemeleri (major release) restoran ile randevulu
  yapılır.

## 6. Donanım bundle stratejisi (faz 2)

**Şimdi (faz 1):** restoranın mevcut donanımını kullanıyoruz. Yazılım
pazarlayıp satıyoruz.

**Sonra (faz 2 — 12 ay sonrası hedef):** HashTap markalı donanım paketi.

### 6.1 Donanım paketinin potansiyel içeriği

- **HashTap Kasa Pro** — 15.6" dokunmatik POS bilgisayarı, fanless,
  Windows IoT veya Ubuntu; pre-install HashTap + donanım-optimize
  sürücüler.
- **HashTap Mutfak Ekranı** — 21.5" dokunmatik, su sıçramasına dirençli,
  duvar/masa montaj seçenekli, pre-install KDS.
- **HashTap Termal Yazıcı** — 80mm ESC/POS, Ethernet, otomatik kesici;
  üretici: SM/Epson/Star white-label OEM.
- **HashTap Garson Tablet** — 8" Android tablet, kılıf, pre-install
  waiter app; opsiyonel.
- **Kurulum kiti** — router, kabloler, QR kodları laminatlı, masa
  tabelaları.

### 6.2 Tedarik stratejisi

- Faz 2 başında Türkiye donanım distribütörleriyle OEM anlaşmaları
  (Hugin, Dinox, Partner Tech veya ithal Gainscha/SM).
- Stok maliyeti yüksek olduğu için just-in-time satış: sipariş gelince
  montaj/konfigürasyon, 3-5 iş günü teslimat.
- Kurulum ekibi donanımı ofisten/depodan alıp restorana götürür.

### 6.3 Faz 1 → Faz 2 geçiş kriterleri

Donanım bundle'ına geçmek için gerekenler:
- Aylık 15+ kurulum hızına ulaşılmış olmak (yeterli ölçek).
- Pilot/early adopter müşterilerden "donanım da sizde olsun" talebi
  gelmiş olmak.
- Tedarikçi görüşmelerinde makul marj (% 20+) elde edilebilir olmak.
- Depo + lojistik altyapısı kurulabilecek konumda olmak.

## 7. Sorumluluk matrisi

| Alan | HashTap | Restoran | Not |
|---|---|---|---|
| Yazılım geliştirme | ✅ | — | — |
| Yazılım güncellemesi | ✅ | — | Otomatik, gece saatinde |
| Saha kurulumu (ilk) | ✅ | Elektrik + internet hazır olmalı | Kurulum ücretine dahil |
| Donanım (faz 1) | — | ✅ | Mevcut donanım kullanılır |
| Donanım (faz 2 bundle) | ✅ | — | Paket içinde |
| İnternet bağlantısı | — | ✅ | Restoranın kendi hattı |
| Elektrik, UPS | — | ✅ | Restoran sağlar |
| Yedekleme (yazılım verisi) | ✅ | — | Gece buluta şifreli |
| Donanım yedekleme | — | ✅ veya sözleşme eki | Bozulan yazıcı vb. |
| Uzaktan destek | ✅ | Erişim izni verir | Tailscale |
| Saha müdahale (arıza) | ✅ (sözleşmeye göre) | — | Yıllık bakımda dahil veya extra |
| Personel eğitimi | ✅ (ilk) | ✅ (sonraki çalışanlar) | Video + PDF kılavuz |
| iyzico sözleşmesi | HashTap facilitator | Restoran subMerchant | Her iki tarafın imzası |
| e-Arşiv sözleşmesi | — | ✅ | Restoran kendi sağlayıcısıyla |
| Veri sahipliği | — | ✅ | Restoran kendi verisinin sahibi |
| Veri işleyen (KVKK) | ✅ (yedekleme kapsamında) | ✅ (aslî) | Sözleşmede tanımlı |

## 8. Riskler ve azaltımlar

| Risk | Olasılık | Etki | Azaltım |
|---|---|---|---|
| Kurulum kalitesiz, restoran memnuniyetsiz | Orta | Yüksek | Kabul test checklist'i + ilk 72 saat yakın izleme |
| Güncellemede prod'da bug | Orta | Yüksek | Önce iç test → 1-2 gönüllü restoran canary → kalan → rollback altyapısı |
| Restoran PC'si kapandı/bozuldu, veri gitti | Düşük | Yüksek | Gecelik şifreli S3/B2 yedek, RTO < 4 saat |
| IT ekibi ölçekleme sorunu | Orta | Orta | Installer CLI otomasyonu + saha ekibi yetiştirme + video eğitim |
| Türkiye'de satış kanal rekabeti | Yüksek | Orta | Modern UX + tek paket avantajıyla farklılaşma |
| Donanım fiyat dalgalanması (faz 2) | Orta | Orta | Birden çok tedarikçi, döviz kuru hedge |
| KVKK denetimi | Düşük | Yüksek | Yedek şifreleme + erişim logları + sözleşme maddeleri sağlam |
| Restoran "abonelik mi?" diye itiraz | Düşük | Düşük | Satış konumlandırması net: "tek seferlik + yıllık bakım" |
| Internet kesintisinde ödeme alamamak | Yüksek | Düşük | Offline sipariş çalışıyor, ödeme kuyrukta; kartla ödeme müsait olunca tahsil |

## 9. Pivot sonrası değişen iç süreçler

### 9.1 Kod tabanında silinen/sadeleşen

- Multi-tenant provisioning otomasyonu (Faz 8'in tenant lifecycle kısmı).
- Gateway'in subdomain routing mantığı.
- Gateway'in tenant registry DB'si.
- DB-per-tenant bakım scriptleri (migration-per-tenant).
- Global monitoring / cross-tenant raporlama boru hattı.

### 9.2 Kod tabanına eklenen

- Installer CLI (`packages/installer/` veya benzeri) — tek komutla
  kurulum wizard'ı.
- Updater servisi — Docker Watchtower veya kendi daemon.
- Backup servisi — `restic` tabanlı gecelik şifreli yedek + S3/B2 push.
- Cashier app — restoran kasası için yeni React uygulaması.
- Waiter app — garson için yeni React uygulaması (mobile-first).
- Remote support setup script — Tailscale otomatik kayıt.
- Kabul testi otomasyonu (`smoke-test.sh`) — kurulum sonrası çalıştırılan
  E2E test.

### 9.3 Kod tabanında kalıp basitleşen

- `hashtap_pos` Odoo modülü — tenant-filter mantığı kaldırılabilir;
  her instance zaten tek kiracı.
- Gateway API — "thin BFF" rolü korunur ama tek Odoo'ya yönlendirir.
- Customer PWA — aynı kod, sadece API base URL farklı (local IP veya
  Cloudflare Tunnel hostname).
- Print-bridge — zaten on-premise içindi, değişmiyor.

## 10. Kısa vadeli yol haritası (pivot sonrası)

Ayrıntı: `ROADMAP.md` (pivot sonrası güncellenmiş).

| Hafta | İş |
|---|---|
| W0 | Pivot dokümantasyonu (bu doküman + diğerleri) |
| W1 | Mimari sadeleştirme: multi-tenant kalıntıları sil, tek-kiracı baseline |
| W2 | Installer CLI iskeleti + `.env` wizard |
| W3 | Design system: renk paleti, tipografi, bileşen kütüphanesi |
| W4-6 | Cashier app — kasa ekranı |
| W7-9 | Waiter app — garson uygulaması |
| W10 | Remote support + backup + auto-update altyapısı |
| W11 | Saha kabul testi otomasyonu |
| W12 | Pilot restoran kurulumu |

## 11. Açık sorular (karar bekliyor)

- **Fiyatlama nihai:** Yukarıdaki rakamlar çalışma tahmini; pilot
  sonrası pazar araştırmasıyla kalibre edilecek.
- **Sözleşme şablonları:** Hukuki hazırlık gerekli — yazılım lisansı,
  bakım sözleşmesi, KVKK veri işleme eki, SLA.
- **Faturalandırma:** Kurulum tek fatura mı, taksitli mi? Bakım yıllık
  peşin mi, aylık mı? Muhasebe + CRM tool seçimi (Odoo'nun kendisi
  kullanılabilir).
- **Donanım bundle ne zaman?** 50+ yazılım-sadece kurulumun başarısı
  sonrası değerlendirilecek.
- **Facilitator fee yasal zemin:** iyzico facilitator sözleşmesinde
  HashTap payının tanımı — hukuki kontrol gerekiyor.
