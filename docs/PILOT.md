# HashTap — Pilot Rehberi (Faz 9 + Faz 10)

Bu doküman, gerçek bir restoranda yapılan **ilk** HashTap kurulumunun
adım adım nasıl yürütüleceğini tanımlar. Kurulum öncesi hazırlık
(Faz 9) + 4 haftalık canlı pilot (Faz 10) tek dosyada toplu, çünkü
saha ekibi ikisini birlikte yürütür.

İlgili:
- `INSTALLATION_PLAYBOOK.md` — teknik kurulum (installer CLI)
- `OPERATIONS.md` — canlı operasyon + incident
- `runbooks/` — P0/P1/P2 olay yanıtları
- `apps/CASHIER.md` · `apps/WAITER.md` — app şartnameleri

Son güncelleme: 2026-04-24.

## 1. Özet — Pilot neden önemli?

HashTap mimarisinin tek-kiracı on-premise modelinde canlıya çıkmadan
önce tüm sürüm kurulmuş ve 4 hafta canlı iş yüküyle sınanmış
olmalıdır. Pilot:

- **Referans noktası** — doğrudan satışta ilk müşteri, partner satışında
  demo olarak gösterilir.
- **Öğrenme laboratuvarı** — ürün-pazar uyumu, kurulum süresi, destek
  yükü ilk kez somutlaşır.
- **Risk sınırlama** — aynı anda 10 restorana çıkmaktan kaçınıp tek
  kurulumdan beslenen feedback ile iterate ederiz.

Pilot olmadan partner onboarding başlamaz (Faz 16 ön koşulu).

## 2. Pilot restoran seçim kriterleri

Pilot restoran aşağıdaki özelliklere sahip olmalı:

- **Sahip kararlı + değişime açık** — her gün geri bildirim verebilir
- **Büyüklük orta** — 20-40 masa (ne çok küçük ne çok büyük)
- **Günlük hacim 100-300 sipariş** — anlamlı veri oluşturacak ama
  kritik değil
- **Mevcut POS basit** — pilot kapsamında Segment A (full HashTap ERP)
  tercih
- **İstanbul / Ankara** — HashTap saha ekibi 30 dk içinde gidebilir
- **Wi-Fi + fiber internet var** — kesintisiz bağlantı şart
- **Mutfak + kasa + salon ayrı** — KDS ve garson tableti kullanılabilir

Kontrendikasyon:
- Franchise zincirleri (karar alma yavaş)
- Bar / gece kulübü (yüksek hacim, gürültü)
- Sahibin uzakta olduğu şubeler (feedback yavaş)

## 3. Faz 9 — Pilot hazırlık (2 hafta)

### 3.1 Hafta 1 — Menu ve donanım

| Gün | İş | Sahip |
|---|---|---|
| 1 | Restoran menüsünü Excel'den import | IT |
| 1 | Foto çekimi (eksik olanlar) | Pazarlama |
| 2 | Masa sayımı + QR kod üretimi | IT |
| 2 | QR lamine + masa tabelası basımı | Matbaa |
| 3 | Donanım kurulumu öncesi ön ziyaret | Saha |
| 3 | Ağ altyapısı değerlendirme (AP, switch yeri) | Saha |
| 4 | iyzico subMerchant başvurusu + onay | Hukuk/Sahip |
| 4 | e-Arşiv (Foriba) kurulum | IT |
| 5 | Cashier PC + garson tableti + KDS ekranı kurulumu | Saha |

**Çıktılar:**
- Menü Odoo'ya girilmiş, QR kodlar hazır
- Donanım restorana yerleşmiş, ağa bağlı
- iyzico sandbox + live key'ler HashTap KMS'te

### 3.2 Hafta 2 — Software kurulum + dry run

| Gün | İş | Sahip |
|---|---|---|
| 6 | Installer CLI ile full stack kurulum (`hashtap-installer`) | IT |
| 6 | Cloudflare Tunnel + Tailscale enroll | IT |
| 7 | Smoke test: tüm servis yeşil, heartbeat ops'ta | IT |
| 7 | iyzico sandbox ile test ödemesi 5 tur | IT |
| 8 | Personel eğitimi — kasa ekibi (4 saat) | IT + Sahip |
| 8 | Personel eğitimi — garson ekibi (3 saat) | IT + Sahip |
| 9 | Personel eğitimi — mutfak ekibi (2 saat) | IT + Şef |
| 9 | Müşteri PWA test (sahibin telefonundan) | Sahip |
| 10 | Tüm sistemde dry run — 2 saat aile/arkadaş sipariş | Herkes |
| 10 | Feedback topla + kritik bug'ları fix | IT |
| 11 | Pilot başlangıç toplantısı — sahip ile risk review | Sahip + HashTap |
| 12 | Go/No-go kararı | Sahip |

**Hazır kontrolü (dry run gün 10 sonu):**
- [ ] QR menü 30 sn içinde açılıyor (3G bağlantıda)
- [ ] Sipariş → mutfak (KDS) < 5 sn
- [ ] Kart ödeme başarı > %98 (sandbox 50 tur)
- [ ] e-Arşiv Foriba sandbox'ta geçiyor
- [ ] Garson tableti masadan sipariş açıyor
- [ ] Kasa açılış/kapanış Z raporu çalışıyor
- [ ] Gecelik backup alındı (restic snapshot)
- [ ] Heartbeat ops dashboard'da yeşil
- [ ] Personel "kendim yapabilirim" diyor

Herhangi bir madde hayırsa pilot bir gün erteler, sorunu giderir.

## 4. Faz 10 — Canlı pilot (4 hafta)

### 4.1 Yapı

- **Başlangıç:** Cuma akşam servisi veya Pazar brunch (yoğun ama toparlanabilir).
- **İlk 72 saat:** HashTap on-call mühendis restoranda fiziksel olarak.
- **1. hafta:** Günlük check-in (sabah 30 dk, akşam 30 dk).
- **2-4. hafta:** Haftalık review (Çarşamba 1 saat).

### 4.2 Canary flag stratejisi

Pilotun ilk günü **%10 QR trafiği** ile başla:
- 10 masadan 1'i HashTap QR'ı takıyor, geri kalan masalar geleneksel
  servis (kasa manuel alır).
- İlk gün sonu hedefi: 10-15 QR sipariş, sıfır kritik hata.

Gün 2: **%50**. Gün 3: **%100**. Gerçek kapasiteye ulaşıldığında canary
sonlandırılır.

Feature flag mechanism: `hashtap.settings.canary_qr_pct` parametresiyle
customer PWA'da rastgele ret/kabul (klient-side seed ile per-cihaz
tutarlı).

### 4.3 Günlük operasyon

```
Sabah 09:00:
  - Restoran açılış öncesi sanity check
    - Heartbeat yeşil?
    - Gecelik backup başarılı?
    - Disk < %80?
    - Ödeme gateway sağlıklı?
  - Personel brifing: bugün dikkat edilecek noktalar

Gün boyunca:
  - Monitoring dashboard açık
  - Her ticket kaydedilir (ne zaman, nerede, çözüm)
  - Tekrar eden sorun → hot fix kuyruğuna

Akşam 23:00:
  - Gün sonu Z raporu (kasa kapanışı)
  - Ciro + sipariş sayısı + hata raporu → günlük rapor
  - Eklenmesi gereken iyileştirme notları
```

### 4.4 Haftalık review (Çarşamba 14:00)

Restoran sahibi + HashTap kurucu + IT ekibi + (varsa) partner:

1. **Metrikler** — sipariş sayısı, ciro, kart payı, ortalama masa süresi
2. **Bildirilen sorunlar** — çözülen/çözülmeyen/planlanmış
3. **Personel feedback** — kasa/garson/mutfak anket
4. **Müşteri feedback** — QR kullanım oranı, şikayetler
5. **Aksiyon öğeleri** — sonraki hafta için somut işler

### 4.5 Başarı kriterleri (4 hafta sonu)

MVP pilot kabul kriterleri — tümü karşılanmalı:

- [ ] **Uptime > %99.5** — haftalık 50 dk altı kesinti
- [ ] **Kart ödeme başarı > %97** — ilk 1000 işlemde
- [ ] **P0 olay sayısı 4 haftada ≤ 2** — düzeltilmiş ve postmortem
      yapılmış
- [ ] **RTO < 4 saat** — en az 1 restore testi gerçekleşmiş (simüle)
- [ ] **Kaybolan sipariş = 0** — kuyruk, offline, edge case hepsi temiz
- [ ] **Restoran NPS ≥ 50** — personel + sahip birlikte
- [ ] **Müşteri QR kullanım oranı > %30** — zorla kabul ettirilmedi,
      doğal benimseme
- [ ] **Canlı aylık bakım ücreti alınmış** — 1.500 TL abonelik aktif

### 4.6 Pilot sonu teslim paketi

Pilot tamamlandığında HashTap referans olarak kullanmak için hazırlar:

- **Case study yazısı** (2 sayfa) — sahip onayıyla
- **Metrik özet sayfası** — anonim/yerelleştirilmiş
- **Video testimonial** (30-60 sn) — sahibin doğal sözleri
- **Foto seti** — restoran içinden sistem görüntüleri
- **Teknik raporu** (iç dokuman) — sorunlar, öğrenme, iterasyon listesi

## 5. Pilot öncesi çek listesi (tek sayfa)

Kurulum gününe 1 gün kala:

### 5.1 Donanım
- [ ] Cashier PC çalışır durumda, Windows/Ubuntu güncel
- [ ] Termal yazıcı (ESC/POS) test baskısı geçti
- [ ] Garson tableti şarjlı, kılıfı + askı hazır
- [ ] KDS ekranı duvara monteli, ethernet bağlı
- [ ] Router + switch + AP'ler doğru yerde, kablolama temiz
- [ ] QR kod sticker'ları her masada

### 5.2 Software
- [ ] `/opt/hashtap/.env` dolu, permissions 0600
- [ ] `docker compose ps` tüm servisler running/healthy
- [ ] `infra/odoo/docker-compose.yml --profile ops up -d` ile
      heartbeat + backup çalışıyor
- [ ] `hashtap-installer --dry-run` ile config re-verify
- [ ] Cloudflare Tunnel `qr.<slug>.hashtap.app` public URL çözülüyor
- [ ] Tailscale'de cihaz online
- [ ] Smoke test yeşil (gateway /health + ops /health)
- [ ] Admin şifresi + installation token dual-custody kasaya kondu

### 5.3 Entegrasyonlar
- [ ] iyzico subMerchant aktif, live key'ler yerinde
- [ ] e-Arşiv Foriba login çalışıyor
- [ ] 2 test siparişi → fatura başarıyla kesildi
- [ ] Uptime Kuma dashboard kurulum ekledi, pingliyor
- [ ] Kritik uyarı kuralları aktif (heartbeat 10 dk, disk %90, vs.)

### 5.4 Personel hazırlığı
- [ ] Kasa personeli Cashier app akışını anlatabiliyor
- [ ] Garson tableti kullanımı video izlendi + pratik yapıldı
- [ ] Mutfak KDS bump-bar kullanabilir
- [ ] Sahip admin paneline girebilir, ciro raporu alabilir
- [ ] Destek hattı (WhatsApp) test edildi

### 5.5 İş tarafı
- [ ] Sözleşme imzalandı
- [ ] Faturalama bilgileri (paket lisans + aylık bakım) Odoo'da
- [ ] Pilot başlangıç tarihi yazılı onaylandı
- [ ] Sahip 72 saat sürekli ulaşılabilir (kritik saat)

## 6. Rollback planı

Pilot sırasında kritik sorun çıkar ve çözülemezse:

| Durum | Aksiyon |
|---|---|
| QR menü erişilemez (2 saat+) | Dış Cloudflare Tunnel bypass → geleneksel servise dön |
| Kart ödeme down (1 saat+) | "Kart kabul etmiyoruz, nakit/QR banka" modu |
| Tüm sistem down (15 dk+ / P0) | Manuel kağıt sipariş (geri dönüş prosedürü) |
| Veri kaybı şüphesi | Restore from last snapshot — runbook `p0-postgres-corrupt.md` |
| Yazılım pilota uygun değil | 30 günde pilot bitir + tam para iadesi (sözleşmede) |

Restoran **her zaman** HashTap'siz çalışabilmelidir — tam geri dönüş
planı dry-run'da test edilir (öncesinde, mümkünse):
- Kağıt sipariş bloklu hazır
- Manuel pos cihazı yanıt veriyor (yedek)
- Mutfak hala sipariş alabiliyor (sözlü)

## 7. Pilot sonrası

### 7.1 Başarıysa
- **Aylık bakım abonesi** — otomatik devam
- **İkinci restoran hazırlığı** — bu pilot referansıyla partner pitch
- **Öğrenilen dersler dokümante** — `docs/PILOT_LEARNINGS.md` (pilot sonu yazılır)
- **Ürün iterasyonu** — backlog'daki bug/iyileştirme 2 hafta içinde fix

### 7.2 Başarısızsa
- **Geri dönüş tamamla** — sistem kaldırıldı, veri iade edildi
- **Retrospektif** — neyi yanlış yaptık, bir daha yapmamak için
- **İş modeli düzeltmesi** — gerekirse paket fiyat/kapsam revize
- **Teknik root cause'lar** — mimari kararlar yeniden değerlendirilir

## 8. Açık kalanlar

- **Canary flag** mechanism'i kodda yok — Faz 9 öncesi `hashtap.settings`
  altına eklenmeli
- **Feature flag rollout** için ayrı bir admin UI (şimdilik SQL ile
  toggle ediyor)
- **Pilot metrik dashboard** — özet kart + grafik (Uptime Kuma
  yetmezse custom Grafana)

Bu açık kalanlar Faz 9 içinde kapatılmalı — kurulumda yetmezse **pilot
ertelenir**, zorla ilerleme yok.
