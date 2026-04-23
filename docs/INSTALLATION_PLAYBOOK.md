# HashTap — Kurulum Playbook (IT Ekibi)

Bu doküman, HashTap'i bir restorana kuracak IT ekibinin adım adım
başvuracağı rehberdir. Saha kurulumunun sıfır an'ından teslim anına
kadar her aşamayı kapsar.

Hedef kitle: HashTap IT/kurulum ekibi.

İlgili dokümanlar:
- `ARCHITECTURE.md` — teknik mimari
- `OPERATIONS.md` — kurulum sonrası destek
- `BUSINESS_MODEL.md` — iş modeli konteksti
- `DEV_SETUP.md` — developer için lokal setup (IT için kurulum ile
  aynı DEĞİL)

Son güncelleme: 2026-04-23.

## 1. Tipik kurulum zaman çizelgesi

Ortalama bir restoran kurulumu **4-8 saat** sürer. Büyük restoran veya
donanım komplikasyonu durumunda 2 güne yayılabilir.

| Aşama | Süre | Bölüm |
|---|---|---|
| Ön ziyaret / tespit | — (ayrı gün) | §2 |
| Kurulum günü: alan keşfi | 30 dk | §4.1 |
| Kurulum günü: yazılım kurulumu | 1-2 saat | §4.2 |
| Kurulum günü: veri girişi (menü, ayarlar) | 1-2 saat | §4.3 |
| Kurulum günü: çevre birimleri | 1-2 saat | §4.4 |
| Kurulum günü: uçtan uca test | 1 saat | §4.5 |
| Kurulum günü: eğitim + teslim | 1 saat | §4.6 |
| Teslim sonrası izleme | 72 saat | §5 |

## 2. Ön ziyaret (kurulum öncesi)

Satış ekibi sözleşmeyi imzaladıktan sonra IT'den biri (veya satış ekibi
teknik bilgi toplamışsa onlar) **restoranı ziyaret eder** veya video
görüşme yapar.

### 2.1 Çek-list

Aşağıdaki bilgiler kurulum gününe kadar elde edilmiş olmalıdır:

#### Restoran genel
- [ ] Restoran adı, vergi numarası, vergi dairesi
- [ ] İletişim: sahibi telefon, yedek iletişim, e-posta
- [ ] Açılış saatleri (kurulum için boş saat penceresi)
- [ ] Kaç masa, kaç katmanda (salon + teras vb.)
- [ ] Salon + mutfak kabaca krokisi (fotoğraf yeterli)

#### İnternet
- [ ] ISP adı, bağlantı türü (fiber/VDSL), hız (Mbps)
- [ ] Modem/router markası, yönetici erişim bilgisi (port-forward veya
      firewall değişikliği gerekebilir — aslında gerekmiyor ama acil
      durumlar için)
- [ ] Statik IP var mı? (gerekli değil ama plus)
- [ ] Wi-Fi kapsamı tüm masalar + mutfak + bar'ı kapsıyor mu?

#### Mevcut donanım
- [ ] Kasa PC'si var mı?
  - Marka/model, işletim sistemi (Windows 10/11 Pro veya Ubuntu LTS?),
    RAM, CPU, disk doluluk
  - Docker kurulu mu?
  - Admin şifresi alınabilir mi?
- [ ] Mutfak ekranı var mı? TV mi, PC mi, mini-PC mi?
- [ ] Termal yazıcı(lar) var mı?
  - Marka/model (Epson TM-T20? Star TSP100? Xprinter?), bağlantı
    (USB/Ethernet), mevcut bağlı PC
- [ ] Garson tabletleri var mı? Android mi iOS mu, kaç tane?

#### Mevcut yazılımlar (değişecek veya yanyana kalacak)
- [ ] Mevcut POS yazılımı var mı (SambaPOS, Adisyo, Logo)?
  - Segment B senaryosunda mevcut POS korunur; HashTap adapter ile
    çalışır (ROADMAP Faz 7).
  - Segment A senaryosunda HashTap tek POS'tur; eski POS devre dışı
    bırakılır.
- [ ] Muhasebe yazılımı? (dışarıda kalıyor, sadece rapor aktarımı)
- [ ] e-Arşiv sağlayıcısı (Foriba, Uyumsoft, Logo, Bulut Entegratörü)?
  Hesap bilgileri alınabilir mi?
- [ ] iyzico subMerchant hesabı var mı? Yoksa başvuru HashTap tarafında
  başlatılıyor mu?

### 2.2 Tespit çıktısı

Ön ziyaret sonunda IT ekibinin elinde şunlar olmalı:

1. **Kurulum paketi listesi:** hangi donanımın restoranda olduğu, hangi
   donanımın HashTap'in getireceği.
2. **Yazılım konfigürasyon dosyası taslağı** — kurulum gününde `.env`
   wizard'ına hızlıca girilecek değerler.
3. **Menü içeriği** — satış ekibi restoranın mevcut menüsünü Excel
   şablonuna geçirmiş olmalı (kurulum gününde import edilir).
4. **Tahmini kurulum süresi.**
5. **Risk notları** — "internet yavaş, güncelleme sürelerine dikkat",
   "kasa PC'si 6 yaşında, değişim öner" gibi.

## 3. Kurulum kiti (IT ekibi yanında götürür)

Fiziksel araç gereçler:
- Dizüstü bilgisayar (kurulum sırasında terminal + dokümantasyon)
- USB 3.0 flash bellek 16 GB+ (Ubuntu ISO + offline installer paketi)
- Ethernet kablosu 5m, 10m
- Cat6 konnektör + krimpleme aleti (gerekirse kablo uzatma)
- USB-Ethernet adaptörü
- HDMI kablosu (ekran test)
- Multi-prize + kısa uzatma kablosu
- Etiketleme makinesi + şeffaf bant
- Laminate QR kart printerı değil ama hazır baskılı QR kodlar
- Cep telefonu (hotspot yedek internet)
- (Opsiyonel) UPS (kaliteli kurulum istiyorsa)

Dijital kit:
- HashTap installer paketinin offline kopyası (USB'de)
- Yedek Docker images (update registry'ye internet yoksa fallback)
- Menü Excel şablonu
- Test kartları bilgisi (iyzico sandbox)
- SSH public key'ler (uzaktan destek için)
- Kabul testi script'i (`smoke-test.sh`)
- Teslim formu PDF şablonu

## 4. Kurulum günü

### 4.1 Alan keşfi (30 dk)

**Ekibin yapacağı:**
1. Restoran sahibi/yetkili ile selamlaşma, günün planı özet.
2. Kurulum yapılacak alanları fiziksel olarak gezme:
   - Kasa PC'sinin yeri, priz, ethernet, havalandırma
   - Mutfak ekranı konumu, görünürlük açısı, ıslak zondan uzaklık
   - Termal yazıcıların konumu, kağıt stoğu
   - Wi-Fi sinyal testi (tablet ile her masa)
   - Modem/router konumu, port durumu
3. "Gün sonu neyin çalışıyor olmasını bekliyorsunuz?" kontrolü — yanlış
   beklentiler baştan düzeltilir.
4. Restoran WiFi şifresi alınır, kurulum için personel telefon numarası
   doğrulanır.

**Kırmızı bayraklar (durdur, satış ekibiyle konuş):**
- İnternet bağlantısı ölü veya 2 Mbps altı → kurulum ertelenir, ISP
  değişimi gerekli.
- Kasa PC'si 10 yaşını geçmiş ve değişim paketinde yok → yavaş çalışır,
  müşteri memnuniyetsizliği riski.
- Menü tamamlanmamış veya yanlış → satış ekibi menüyü restoranla
  netleştirip kurulumu ertelesin.

### 4.2 Yazılım kurulumu (1-2 saat)

#### 4.2.1 Temel OS hazırlığı

**Ubuntu hedefliyorsa (tercih edilen):**
1. Restoran PC'sine Ubuntu Server 22.04 LTS yüklü değilse → USB'den boot,
   temiz kurulum (disk şifrelemesi LUKS ile açık).
2. Ağ yapılandırması: sabit IP 192.168.1.10 (veya restoranın ağ
   planına uygun).
3. SSH açık, admin user + SSH public key eklendi.
4. `apt update && apt upgrade` (gerekiyorsa).
5. Docker ve docker-compose yüklü değilse yüklenir.

**Windows 10/11 Pro hedefliyorsa:**
1. Windows Update güncel.
2. Docker Desktop kurulur (WSL2 backend ile).
3. Kasa/Cashier app'ini tam ekran kiosk modunda çalıştıracak Chrome veya
   Edge ayarı.
4. UAC bildirimleri devre dışı (kiosk deneyimi için).

#### 4.2.2 HashTap Installer çalıştırma

```bash
# Kasa PC'sinde (root veya sudo ile):
curl -sSL https://install.hashtap.app | bash

# veya offline:
./hashtap-installer.sh --offline --package ./hashtap-package.tar.gz
```

Wizard şunları sorar:
1. **Restoran kimlik:** ad, slug (alt alan adı için), vergi no
2. **Dil ayarları:** varsayılan TR, opsiyonel EN
3. **Zaman dilimi:** Europe/Istanbul (default)
4. **iyzico bilgileri:** API key, secret, subMerchant ID
5. **e-Arşiv sağlayıcı:** Foriba/Uyumsoft, kullanıcı, şifre
6. **Yazıcı sayısı ve IP'leri:** (boş bırakılabilir, sonra eklenir)
7. **Erişim kuralı:** müşteri QR için Cloudflare Tunnel mi, local Wi-Fi
   mi?
8. **Cloud ops kaydı:** HashTap monitoring'e auth token (bizim cloud
   wizard'ından alınan)
9. **Tailscale auth key:** uzaktan destek için
10. **Backup şifre:** restic parola (KMS'e yedeklenir; restoran kasasına
    da kapalı zarfta verilir)
11. **Admin kullanıcı:** restoran yöneticisi için kullanıcı adı + güçlü
    şifre (sahibi koymak ister)

Wizard sonrasında:
- `.env` dosyası `/opt/hashtap/.env` olarak yazılır (root:700).
- `docker-compose pull` → image'lar çekilir (ilk kurulumda 5-15 dk).
- `docker-compose up -d` → tüm servisler ayağa kalkar.
- Odoo modülleri yüklenir: `docker exec odoo odoo -d hashtap -i
  hashtap_pos,hashtap_theme,account,stock --stop-after-init`
- Admin kullanıcısı, varsayılan menü grupları, para birimi vb. seed
  edilir.
- mDNS/`.local` alan adı kurulur.
- Caddy yerel TLS sertifikası oluşturur.
- Cloudflare Tunnel devreye alınır (seçildiyse).
- Tailscale node kaydolur.
- İlk heartbeat HashTap ops'a gider.
- Backup servisi yüklenir, ilk test snapshot alır.

Installer sonunda özet:
```
✓ Docker stack up (11 services healthy)
✓ Odoo accessible at http://hashtap.local/admin
✓ Cashier accessible at http://kasa.hashtap.local
✓ Waiter accessible at http://garson.hashtap.local
✓ KDS accessible at http://mutfak.hashtap.local
✓ Customer PWA at https://qr.<slug>.hashtap.app
✓ Tailscale registered (restaurant-<slug>)
✓ Monitoring heartbeat received by HashTap ops
✓ Backup test successful: 2.4 MB uploaded to repo
✗ Warnings: [varsa listeler]
```

### 4.3 Veri girişi (1-2 saat)

#### 4.3.1 Menü import

Ön ziyarette hazırlanmış menü Excel dosyası:
```
Kategori | Ürün Adı (TR) | Ürün Adı (EN) | Fiyat (TL) | KDV % | Alerjen | Açıklama TR | Açıklama EN | Fotoğraf URL
```

Import yolu:
1. Odoo admin'e git: Ayarlar → HashTap → Menü Import Aracı
2. Excel yükle → önizleme → onay → import
3. Eksikleri manuel düzelt (fotoğraflar, modifier'lar)

#### 4.3.2 Masa tanımlama

1. Admin → HashTap → Masalar
2. Her masa için: ad, kapasite, bölge (salon/teras)
3. QR kod otomatik üretilir → PDF'e basılıp lamine edilir
4. Masalara yerleştirilir (ekip yapar)

#### 4.3.3 Personel kullanıcıları

1. Garson kullanıcıları (grup: `hashtap_staff`)
2. Kasiyer kullanıcıları (grup: `hashtap_cashier`)
3. Mutfak kullanıcıları (grup: `hashtap_kitchen`)
4. Restoran yöneticisi (grup: `hashtap_manager`)

Her kullanıcı için şifre üretir, personel ile paylaşır.

#### 4.3.4 Ödeme yöntemleri

1. Kart (iyzico) — aktivasyon testi: test kartı ile sandbox ödeme
2. Nakit — default açık
3. "Kasada öde" (pay at counter) — QR akışında opsiyon

#### 4.3.5 Yazıcı yapılandırması

1. Print-bridge config: her yazıcının IP'si, tipi (mutfak/bar/adisyon)
2. Kategori-yazıcı eşleştirmesi (örn: "Yemekler" → mutfak yazıcısı,
   "İçecekler" → bar yazıcısı)
3. Test baskısı: her yazıcıdan bir test fişi çıkar

### 4.4 Çevre birimleri (1-2 saat)

#### 4.4.1 KDS ekranı

1. Mini-PC veya Smart TV'nin tarayıcısını aç
2. `http://mutfak.hashtap.local` → tam ekran modu
3. Otomatik başlangıç: boot sonrasında otomatik tam ekran Chrome
4. Mutfak personeline kısa tanıtım

#### 4.4.2 Garson tabletleri

1. Tablet başına Chrome aç → `http://garson.hashtap.local`
2. "Ana ekrana ekle" (PWA) → masaüstü kısayolu
3. Garson kullanıcısı ile login, "Beni hatırla"
4. Wi-Fi'ye bağlı + masalar arası dolaşırken sinyal kesintisiz kontrol

#### 4.4.3 Kasa ekranı

1. Kasa PC'sinin ekranında Chrome/Edge tam ekran kiosk
2. `http://kasa.hashtap.local`
3. Kasiyer kullanıcısı ile login
4. Auto-start: Windows'ta Task Scheduler veya Ubuntu'da `autostart`
   script.

#### 4.4.4 QR kartlar

1. Her masaya ilgili QR kart laminatlı şekilde yerleştirilir
2. Bar ve teras özel masalarının QR'larının ayrı olduğu doğrulanır
3. İki dilli kart (TR + EN) şablonu tavsiye edilir

### 4.5 Uçtan uca kabul testi (1 saat)

`smoke-test.sh` otomatik bir kısmını yapar; manuel kısım aşağıda:

#### 4.5.1 Müşteri akışı

- [ ] Test telefonundan (personel telefonu) restoran Wi-Fi'sine bağlan
  (veya 4G'den Cloudflare Tunnel üstünden)
- [ ] Masadaki QR'yi okut → menü yüklenir
- [ ] 2-3 ürün sepete ekle, modifier seç
- [ ] Checkout → iyzico sandbox → test kartı (4059030000000009) → başarılı
- [ ] Sipariş KDS'e düştü mü? (mutfak personeli doğrular)
- [ ] Yazıcıdan fiş çıktı mı? (fiziksel kontrol)
- [ ] e-Arşiv mock/test modunda fiş kesildi mi?
- [ ] Sipariş durumu PWA'da "Hazırlanıyor → Hazır" geçiyor mu?

#### 4.5.2 Garson akışı

- [ ] Tabletten garson login
- [ ] Boş masaya ürün ekle, "Mutfağa gönder"
- [ ] KDS'te görüldü, yazıcıdan çıktı
- [ ] "Adisyon al" → kasaya uyarı düştü

#### 4.5.3 Kasa akışı

- [ ] Manuel sipariş oluştur (walk-in müşteri)
- [ ] Nakit ödeme simülasyonu (tahsil işareti)
- [ ] Kart ödemesi simülasyonu (sandbox)
- [ ] Gün sonu raporu (test dakikaları)

#### 4.5.4 Kesinti testleri

- [ ] İnterneti kapat (modem kapatılır) → local sipariş akışı çalışır mı?
  - KDS: ✓, waiter: ✓, cashier: ✓ (nakit), ödeme (kart): ✗ (beklenen)
- [ ] Yazıcıyı kapat → print-bridge kuyruğa alıyor mu?
- [ ] Yazıcıyı aç → kuyruk basılıyor mu?
- [ ] İnterneti geri aç → e-Arşiv kuyruğu işleniyor mu?

### 4.6 Eğitim + teslim (1 saat)

#### 4.6.1 Personel eğitimi

**Kasiyer (15 dk):**
- Gün açılışı / kapanışı
- Manuel sipariş girişi
- Ödeme tahsilatı (kart + nakit)
- Adisyon iptal / iade (manager onayı gerekebilir)
- "Sık karşılaşılan 5 senaryo" canlı gösterim

**Garson (10 dk):**
- Tableti açma, login
- Masa seçimi → ürün ekleme → gönderme
- Mutfaktan "hazır" bildirimini takip
- Adisyon kapatma

**Mutfak (5 dk):**
- KDS'te sipariş alma
- "Başla → hazır → servis edildi"
- Kağıt yazıcı kesildiğinde nasıl fiş çıkartacak?

**Restoran sahibi (20 dk):**
- Odoo backend turu: sipariş listesi, günlük rapor, menü editör
- Kullanıcı yönetimi
- Yedekleme durumu nasıl kontrol edilir
- Destek hattı numarası + WhatsApp grubu

#### 4.6.2 Teslim dokümanları

Restoran sahibine teslim edilen fiziksel dosya:
- **Kurulum raporu** — imzalı, tarihli
- **Erişim bilgileri** — admin kullanıcı + şifre (zarfta), WiFi
  şifresi, yedekleme şifresi (ayrı kapalı zarf)
- **İletişim kanalları** — destek telefon/WhatsApp, ticket sistem linki,
  acil durum numarası
- **Eğitim kılavuzu** — PDF + QR kod ile video linkleri
- **Bakım sözleşmesi** — yıllık bakım kapsamı, SLA, çıkış hakları

#### 4.6.3 Teslim formu imzalama

Form üstünde teslim kriterleri çek-listi (`BUSINESS_MODEL.md` §4.3'teki
maddeler). Müşteri imzalar, IT ekibi imzalar.

### 4.7 Çıkış

- Gereksiz dosyalar silinir (Excel şablonları, test kartı notları, SSH
  geçici anahtarlar).
- `/opt/hashtap/.env` dosyasına izin kontrolü yapılır (kimse okuyamıyor).
- Güncelleme zamanlayıcısı aktif onaylanır (cron job / watchtower).
- Bir sonraki 72 saat için on-call mühendis isim+telefon restoran
  sahibine bildirilir.

## 5. Teslim sonrası (72 saat yakın izleme)

### 5.1 İlk 24 saat

- HashTap monitoring dashboard'unda kurulumun "yeşil" olduğu sürekli
  doğrulanır.
- Bir mühendis on-call; WhatsApp grubuna yanıt verir.
- Restoranın ilk canlı siparişleri loglardan takip edilir (uzaktan,
  Tailscale üzerinden).
- 12-18. saatte restoran sahibiyle kontrol araması: "Nasıl geçiyor?"

### 5.2 24-48 saat

- Hata oranı kritik mi? (>%1 sipariş akışı hata = müdahale)
- Yedekleme gecelik çalıştı mı? (monitoring onaylar)
- Güncelleme denemesi canary'den geldiyse başarılı mı?

### 5.3 48-72 saat

- Performans telemetrisi incelenir (yavaşlık var mı?)
- Restoran sahibinin geri bildirimleri toplanır
- "Pilot sonrası ince ayar" listesi hazırlanır (menü fotoğrafı eksik,
  yazı tipi büyütülmeli vb.)

### 5.4 Hafta 2

- On-site ziyaret (opsiyonel) — restoran ihtiyaç duyuyorsa
- Geri bildirim dokümanı oluşturulur, ürün ekibine iletilir
- Müşteri memnuniyet anketi gönderilir

## 6. Hata senaryoları ve müdahale

### 6.1 Kurulum sırasında karşılaşılan yaygın problemler

| Problem | Çözüm |
|---|---|
| Docker pull yavaş / başarısız (ağ) | Offline paketten kur; sonra internet gelince `docker-compose pull && restart` |
| Kasa PC'sinde yeterli disk yok | Eski dosyalar temizlenir; gerekirse yeni SSD öneri |
| Odoo başlamıyor, "DB connection failed" | Postgres container'ın tamamen kalkmasını bekle (`docker logs postgres`), retry |
| Yazıcıya erişilemiyor | IP doğru mu? Aynı subnet'te mi? `ping` + telnet 9100 |
| Cloudflare Tunnel çalışmıyor | Token doğru mu? DNS propagation (5-10 dk) |
| Tailscale bağlanmıyor | Auth key ömrü dolmuş olabilir; cloud ops'tan yeni key |
| e-Arşiv sandbox login hatası | Provider credentials yeniden doğrula; Foriba test hesabının süresi olmalı |

### 6.2 Kurulum iptali / ertelemesi

Eğer kritik kırmızı bayrak açılırsa kurulum durdurulabilir:
- Teslim kriterlerinin %100'ü yeşil olmadan asla "tamam" denilmez.
- Erteleme formu doldurulur, satış ekibine ve müşteriye yazılı bildirilir.
- Yeni kurulum tarihi belirlenir.

## 7. Çek listeler (özet)

### Ön ziyaret checklist
- [ ] Restoran kimlik bilgileri toplandı
- [ ] İnternet bağlantısı testleri yapıldı
- [ ] Mevcut donanım listesi çıkarıldı
- [ ] Eksik donanım siparişi verildi
- [ ] Menü Excel'i satış ekibi tarafından doldu
- [ ] iyzico + e-Arşiv hesap bilgileri alındı
- [ ] Kurulum tarihi + saat penceresi netleşti

### Kurulum günü checklist
- [ ] IT kiti tam (fiziksel + dijital)
- [ ] Alan keşfi yapıldı, kırmızı bayrak yok
- [ ] Yazılım kurulumu tamamlandı
- [ ] Menü import edildi
- [ ] Masalar tanımlandı, QR'lar laminatlandı
- [ ] Kullanıcılar oluşturuldu, şifreler teslim edildi
- [ ] Çevre birimleri (ekran, yazıcı, tablet) yapılandırıldı
- [ ] E2E kabul testi %100 yeşil
- [ ] Kesinti testleri yeşil
- [ ] Personel eğitimi verildi
- [ ] Teslim formu imzalandı
- [ ] Monitoring yeşil, ilk heartbeat düştü

### 72 saat sonrası checklist
- [ ] Hata oranı < %1
- [ ] Gecelik yedek başarılı (3/3)
- [ ] Restoran sahibinden pozitif geri bildirim
- [ ] Kritik bir bug veya sorun listelenmedi
- [ ] Resmi teslim dokümanı arşivlendi

## 8. Doküman versiyonu

- v0.1 (2026-04-23) — pivot sonrası ilk playbook
- Gelecek sürümler: pilot restoranlardan öğrenilen acı veren detayları
  ekleyerek büyüyecektir.
