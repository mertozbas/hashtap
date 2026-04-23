# HashTap Cashier (Kasa) — Uygulama Şartnamesi

Bu doküman HashTap Cashier uygulamasının ne olduğunu, kimin için
olduğunu, hangi ekranlara sahip olduğunu ve hangi kurallara göre
çalıştığını tanımlar.

**Durum:** tasarım / geliştirme öncesi (planlanan yeni uygulama).
**Kod konumu:** `apps/cashier/`.
**Yol haritası:** `ROADMAP.md` yeni Faz 14.

Son güncelleme: 2026-04-23.

İlgili:
- `DESIGN_SYSTEM.md` — tasarım dili ve bileşen kütüphanesi
- `ARCHITECTURE.md` — mimari konteksti
- `apps/WAITER.md` — garson uygulaması (karşılıklı referanslar var)

## 1. Amaç

Cashier, restoranın kasa tezgâhındaki dokunmatik bilgisayarda çalışan
React uygulamasıdır. Kasiyerin gün boyu gördüğü birincil ekrandır.

### 1.1 Birincil sorumluluklar

- Aktif sipariş listesi canlı takibi (QR, garson, telefon, walk-in
  kanallarından gelen tüm siparişler).
- Ödeme tahsilatı: kart (iyzico Checkout), nakit, açık hesap.
- Adisyon yönetimi: açma, kapama, birleştirme, split bill.
- Manuel sipariş girişi (walk-in müşteri, telefon siparişi, iade).
- Gün açılış / kapanış, kasa açma / kapama.
- Rapor: gün sonu Z raporu, özet.

### 1.2 Kapsam dışı

- Detaylı muhasebe raporları (Odoo admin paneli).
- Menü yönetimi (Odoo admin).
- Personel yönetimi (Odoo admin).
- Stok yönetimi (Odoo admin).
- Kurulum / ayar ekranları (Odoo admin).

Cashier **operasyonel** bir ekrandır; yönetimsel/raporsal işler arka
plandaki Odoo'da yapılır.

## 2. Hedef kullanıcı ve cihaz

### 2.1 Birincil kullanıcı: Kasiyer

- Gün boyu (6-12 saat) ekran başında.
- Teknik bilgisi düşük, Windows POS yazılımı deneyimi yüksek
  (SambaPOS, Mikro).
- Hızlı iş yapar; bir sipariş kapatmak 10 saniyeyi aşmamalıdır.
- Türkçe ana dil; yabancı misafir için gerektiğinde İngilizce menü
  göstermeyi bilir.

### 2.2 İkincil kullanıcı: Restoran yöneticisi

- Gün açılış/kapanış.
- Z raporu okuma.
- İstisna durumlara müdahale (iade, indirim onayı, adisyon silme).

### 2.3 Cihaz hedefi

- **15.6" dokunmatik POS bilgisayarı** (primary).
- Çözünürlük: 1366×768 veya 1920×1080.
- İşletim sistemi: Windows 10/11 Pro veya Ubuntu 22+.
- Tarayıcı: **Chrome/Edge tam ekran kiosk mode**.
- Fare+klavye opsiyonel (manuel veri girişinde kullanılabilir), dokunmatik
  birincil.

**İkincil destek:** 10-13" laptop (küçük işletmelerde kasa olarak).

## 3. Üst seviye ekranlar

```
┌─────────────────────────────────────────────────────────────┐
│ [☰]  HashTap — Kafe Cumhuriyet        [🔔 2]  [👤 Kemal]  │  ← Header
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│  Masalar      │         AKTİF SİPARİŞLER (canlı)            │
│  Yeni Sipariş │                                             │
│  Ödemeler     │   [M5 · QR] [M3 · Garson] [M12 · QR] ...    │
│  Raporlar     │                                             │
│  Ayarlar      │                                             │
│               │         BEKLEYEN ÖDEMELER                   │
│  ───────      │                                             │
│  [Gün Kapat]  │   [M7 · 485 TL] [M9 · 312 TL] ...           │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

### 3.1 Sidebar menü (sol, sabit)

- Ana Sayfa (Aktif Siparişler)
- Masalar (salon haritası)
- Yeni Sipariş (walk-in)
- Ödemeler (geçmiş + bekleyen)
- Raporlar (bugün, dün, bu hafta)
- Ayarlar (kullanıcı, yazıcı test, tema)
- Alt: Gün kapat / oturumu kapat

Genişlik: 240px varsayılan; küçük ekran için collapsible.

### 3.2 Ana sayfa — Aktif Siparişler

**Bento grid layout** dashboard:
- **Sol büyük blok (2×2):** Aktif siparişler (masa kartları grid).
- **Sağ üst (1×1):** Günün özeti (sipariş sayısı, ciro, ortalama).
- **Sağ orta (1×1):** Bekleyen ödemeler (uyarı listesi).
- **Alt (2×1):** Son tamamlanan 5 sipariş (undo opsiyonu için).

**Canlı güncellemeler:**
- Yeni sipariş → pulse animasyonu + ses uyarısı.
- Sipariş state değişimi (paid → kitchen_sent) → kart kayma animasyonu.
- Gerçekten offline kalırsa: üst başlıkta "Bağlantı yok" pill + son
  senkronizasyon zamanı.

### 3.3 Masa kart detayı

Her masa kartı:
```
┌──────────────────────────┐
│ Masa 5      ● QR  12dk   │  ← masa no, kanal, bekleme süresi
│                          │
│ 2× Köfte         120 TL  │  ← ürünler
│ 1× Salata         45 TL  │
│ 2× Ayran          30 TL  │
│                          │
│ Toplam          195 TL   │  ← bold, large
│                          │
│ [Detay]        [Öde]     │  ← CTA
└──────────────────────────┘
```

Tıklanınca: tam ekran sipariş detayı modal açılır.

Renk kodlama (bekleme süresine göre):
- 0-10 dk: normal
- 10-20 dk: sarı uyarı (sol kenar çubuğu)
- 20+ dk: kırmızı uyarı + ping animasyon

### 3.4 Masalar (salon haritası)

Görsel salon haritası:
- Masaların gerçek yerleşim düzenini yansıtan grid.
- Her masa bir buton: dolu (sipariş var), boş, rezerve, kapalı.
- Dokununca: o masa için aktif sipariş varsa detay açılır; yoksa
  "Yeni sipariş başlat" CTA.

Özellikler:
- **Masa birleştirme:** Drag-drop ile iki masa birleştirilir (grup
  hesabı).
- **Masa transferi:** Sipariş bir masadan diğerine taşınır.
- **Masa rezervasyonu:** Bir masa "19:30 ayırtıldı" olarak işaretlenir.

### 3.5 Yeni Sipariş (walk-in / manuel)

Akış:
1. **Masa seç** (veya "walk-in" / "paket").
2. **Menü browse:** kategori + ürün kartları, arama, favoriler.
3. **Sepet (sağ panel):** ekledikçe doldu; modifier'lar (size, extra).
4. **Müşteri bilgi (opsiyonel):** isim, telefon.
5. **Onayla:** kitchen_sent olarak gönder veya "öde ve gönder".

Dokunmatik optimize:
- Büyük ürün kartları (min 120×120), fotoğraflı.
- Kategori chip'ler üstte sticky.
- Arama kutusu ortada, autofocus.
- Klavye için keyboard shortcut (F1-F12 = kategori, sayı = miktar).

### 3.6 Ödeme tahsilatı

Sipariş "öde" tıklandığında modal:
```
┌──────────────────────────────────┐
│ Masa 5 - Ödeme                   │
│                                  │
│      Toplam                       │
│     195,00 TL                    │  ← huge display
│                                  │
│ [🔄 Split Bill]                  │
│                                  │
│ Ödeme Yöntemi:                   │
│                                  │
│ [💳 Kart]  [💵 Nakit]  [⏳ Sonra]│  ← büyük butonlar
│                                  │
│ Son ödeme:  ────                 │
│                                  │
│ [İptal]              [Tahsil Et] │
└──────────────────────────────────┘
```

**Kart akışı:**
- "Kart" tıklanınca iyzico Checkout Form iframe açılır (PCI SAQ-A).
- Müşteri 3DS tamamlar.
- Success: callback → order paid + fiş kesilir → modal kapanır.

**Nakit akışı:**
- Müşteriden alınan miktar girilir.
- Para üstü hesaplanır.
- Kasa çekmecesi açılması (printer ESC komutu).
- Nakit yazıcıdan fiş basılır.

**Split bill:**
- Toplam kaç kişiye bölünecek? (2, 3, 4, özel)
- Her kişi için ayrı ödeme alınır.
- Veya ürün-başı split (ileride, MVP'de eşit bölme yeter).

**Pay later (açık hesap):**
- Sipariş `paid_no_receipt` yerine `cash_due` olarak işaretlenir.
- Bu modda e-Arşiv fail-close devre dışı (misafir ayrıldı, sonra
  ödenecek).

### 3.7 Geçmiş siparişler (ödemeler sekmesi)

- Bugünkü, dünkü, bu haftaki siparişler.
- Filtre: masa, kanal, durum.
- Her siparişin: detay, fiş yeniden yazdır, iade (manager onayı).

### 3.8 Raporlar

Cashier'da basit raporlar (detay Odoo admin'de):

- **Bugünkü ciro** — toplam, ödeme yöntemi kırılımı, saat kırılımı.
- **Z raporu** — gün kapatma zamanında otomatik üretilir.
- **Kasa açık/kapama** — kasa girişi / çıkışı, beklenen vs gerçek.
- **Canary metrik:** Bu saatteki ciro, geçen hafta aynı saatten fazla mı?

### 3.9 Gün kapatma akışı

1. "Gün Kapat" CTA (alt köşe, hafif vurgulu).
2. Onay modal: açık masa/adisyon var mı? (varsa liste + uyarı).
3. Kasa sayım girişi: beklenen X TL, gerçek Y TL. Fark varsa not.
4. Z raporu otomatik üretilir, yazıcıdan çıkar.
5. Sistem "gece modu"na geçer, waiter tabletleri read-only.
6. Log atılır.

## 4. Kullanıcı akışları (detaylı)

### 4.1 QR siparişinden tahsilat

```
1. Müşteri masada QR okutmuş, sipariş vermiş, ödemişti.
2. Cashier ekranında masa kartı "ÖDENDİ" state'inde görünür.
3. Mutfak hazır → yazıcıdan fiş çıktı → garson masaya servis etti.
4. Cashier tarafında sipariş "SERVİS EDİLDİ" olunca otomatik arşivden
   düşer.
5. Cashier manuel bir şey yapmıyor — izleme modu.
```

### 4.2 Masada kart okutma (pay at counter)

```
1. Garson adisyon getirdi. Müşteri kartla ödeyecek.
2. Cashier masa kartını açar → "Öde" → Kart
3. POS cihazı (fiziksel) veya iyzico Checkout Form ile tahsil
4. Başarılı → fiş basılır → masa boşaldı
```

### 4.3 Walk-in müşteri (takeaway)

```
1. Kapıdan müşteri girer, tezgaha gelir.
2. Cashier "Yeni Sipariş" → "paket" tipi seçer.
3. Menüden 2 kahve 1 kek ekler.
4. Toplam 85 TL. Müşteri 100 TL verir.
5. Nakit tahsil, 15 TL üstü verilir.
6. Sipariş `kitchen_sent` olur; barista fişten görür.
```

### 4.4 Adisyon kapatırken unutulmuş şey

```
1. Masa 7 ödeme aşamasında.
2. "Ek sipariş" butonu → menü aç → 1 dilim pasta ekle.
3. Adisyon 195 TL → 220 TL.
4. Kitchen_sent event'i yeni ürüne gider.
5. Ödeme onayla.
```

### 4.5 İade / iptal (manager gerekli)

```
1. Müşteri "kahvem soğuktu, iptal edelim" diyor.
2. Cashier sipariş detay → "Ürün iptal"
3. "Manager PIN" iste (4 haneli).
4. Manager onayı girilir.
5. Odoo'da audit log + müşteri kartına not.
6. Ödeme alındıysa iade (iyzico refund API).
```

### 4.6 İnternet koptuğunda ne olur?

- Cashier gateway ile haberleşmiyor → üst başlıkta "Çevrimdışı" pill.
- Local sipariş akışı çalışır (gateway local'de, Odoo local'de).
- Kart ödemesi çalışmaz; "Kart okuyucu internet bekliyor" mesajı.
- Nakit tahsilat tamamen çalışır.
- Cashier local IndexedDB'ye tahsilat kaydeder (duplicate-safe).
- Internet geri gelince: backlog otomatik senkronize (e-Arşiv, iyzico
  refund vb.).

## 5. Veri modeli bağımlılıkları

Cashier, Odoo'nun `hashtap_pos` modelleri üzerinden çalışır. Doğrudan
DB'ye erişim yok — Gateway API ile konuşur.

Okuduğu modeller:
- `hashtap.order`, `hashtap.order.line`
- `hashtap.menu.category`, `hashtap.menu.item`, `hashtap.modifier.group/modifier`
- `restaurant.table`
- `hashtap.payment.transaction`
- `hashtap.earsiv.receipt`

Tetiklediği aksiyonlar:
- `POST /api/cashier/order` — yeni manuel sipariş
- `POST /api/cashier/order/<id>/line` — sepet update
- `POST /api/cashier/order/<id>/pay-cash` — nakit tahsil
- `POST /api/payment/3ds/start` — kart tahsil (mevcut)
- `POST /api/cashier/order/<id>/cancel` — iptal
- `POST /api/cashier/shift/open`, `.../close` — kasa açma/kapama
- `GET /api/cashier/summary/today` — gün özeti

## 6. State management

- **Zustand store:** UI state (açık modal, seçili masa, filtre).
- **React Query (TanStack):** server state (siparişler, menü, raporlar).
- **WebSocket:** real-time updates (yeni sipariş, state değişimi).
- **IndexedDB:** offline queue (internetsiz nakit tahsilat için).

## 7. Performans hedefleri

- İlk yükleme (LCP): < 2 saniye (local ağda)
- Sipariş gönderimi: < 500ms server yanıt
- Menü browse scroll: 60fps sabit
- 8 saat kesintisiz kullanım: memory leak yok

## 8. Kabul kriterleri

MVP için:
- [ ] Aktif sipariş listesi real-time güncellenir
- [ ] QR, garson, walk-in kanallarından siparişler tek listede
- [ ] Kart ödemesi iyzico sandbox ile uçtan uca çalışır
- [ ] Nakit ödemesi + para üstü hesabı + yazıcı entegrasyonu
- [ ] Split bill (eşit bölme) çalışır
- [ ] Sipariş ekle/iptal/düzenle akışları
- [ ] Salon haritası ekranı
- [ ] Gün açma/kapatma, Z raporu
- [ ] Tam dokunmatik kullanılabilir (fare/klavye gerek duymadan)
- [ ] 1366×768 ve 1920×1080 çözünürlüklerde düzgün
- [ ] Offline durumunda graceful degradation
- [ ] Dark mode varsayılan; light mode opsiyonel

Pilot sonrası:
- [ ] Split bill (ürün-başı, custom oranlar)
- [ ] İade flow + Odoo audit integration
- [ ] Rezervasyon yönetimi
- [ ] Müşteri veri tabanı (tekrar gelen misafir)
- [ ] Loyalty program entegrasyonu (faz 2)

## 9. Açık sorular

- **Fiziksel kasa çekmecesi** — ESC/POS komutuyla açılıyor, yazıcı
  üzerinden. Tüm yazıcılarda var mı? Xprinter test et.
- **Fatura / fiş farkı** — e-Arşiv fatura mı fiş mi? (Türkiye'de
  restoran için fiş — ödeme belgesi). Ekranda hangisini göster?
- **Manager PIN** — Odoo kullanıcı şifresi mi, ayrı PIN mi? UX için
  ayrı PIN öneri.
- **Offline mode ne kadar kapsamlı?** — Nakit yeter mi, yoksa kart da
  offline çalışmalı mı? Pilot geri bildirimine göre.
- **Hangi iyzico flow?** — Checkout Form (iframe) mı yoksa 3DS
  Secure 2.0 API mi? Iframe önerilir (PCI SAQ-A, basit).

## 10. Geliştirme milestone'ları

Faz 14 içinde (bkz ROADMAP pivot sonrası):

| Hafta | Çıktı |
|---|---|
| W1 | Proje iskele, design system entegrasyonu, routing |
| W2 | Ana sayfa + aktif sipariş listesi + WebSocket |
| W3 | Yeni sipariş akışı + menü browse + sepet |
| W4 | Ödeme modal + iyzico entegrasyonu + nakit akışı |
| W5 | Salon haritası + masa yönetimi (birleştir/transfer) |
| W6 | Raporlar + gün açma/kapatma + Z raporu |
| W7 | Offline handling + edge case'ler + polish |
| W8 | Pilot kabul testi + iterasyon |
