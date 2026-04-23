# HashTap Waiter (Garson) — Uygulama Şartnamesi

Bu doküman HashTap Waiter uygulamasının ne olduğunu, kimin için
olduğunu, nasıl çalıştığını tanımlar.

**Durum:** tasarım / geliştirme öncesi (planlanan yeni uygulama).
**Kod konumu:** `apps/waiter/`.
**Yol haritası:** `ROADMAP.md` yeni Faz 15.

Son güncelleme: 2026-04-23.

İlgili:
- `DESIGN_SYSTEM.md` — tasarım dili
- `apps/CASHIER.md` — kasa uygulaması
- `ARCHITECTURE.md` — mimari konteksti

## 1. Amaç

Waiter, garsonun elindeki tablet veya telefonda çalışan React
uygulamasıdır. Garson masadan sipariş alır, mutfağa gönderir, adisyon
getirir.

### 1.1 Birincil sorumluluklar

- Masa seçimi (salon haritası veya liste).
- Menüden sipariş oluşturma (modifier'larla).
- Mutfağa anında gönderme.
- Mutfaktan "hazır" bildirimini alma.
- Masaya servis onayı.
- Adisyon sorgulama ve kasaya götürme.

### 1.2 Kapsam dışı

- Ödeme tahsilatı (kasada yapılır — waiter sadece "adisyon al" der;
  kasa alır).
  - **Hariç tutum:** Pilot sonrası waiter'da iyzico Checkout Form ile
    direkt tablet'ten tahsilat mümkün olabilir. MVP'de kasaya yönlendir.
- Menü editörü, kullanıcı yönetimi.
- Rapor görüntüleme.
- Mutfak ekranı fonksiyonu (ayrı uygulama: KDS).

Waiter **akışkan** bir uygulamadır; garson'un 10 saniyede masadan
mutfağa sipariş uçurması beklenir.

## 2. Hedef kullanıcı ve cihaz

### 2.1 Birincil kullanıcı: Garson

- Salon içinde sürekli yürüyor, masadan masaya gidiyor.
- Tek elle cihazı tutuyor, diğer eli dolu (tepsi, peçete).
- Hız kritik — yoğun öğlen 15 masayı kapsayan akış.
- Teknik bilgi düşük; AppStore mantığına yabancı olabilir.
- Türkçe birincil dil; bazı restoranlarda yabancı personel (İngilizce
  destek).

### 2.2 İkincil kullanıcı: Restoran yöneticisi / kapı önü

- Kapı önündeki masaları yönetebilir.
- Garsonları izleyebilir (kim ne yapıyor).

### 2.3 Cihaz hedefi

- **8-10" Android tablet** (birincil). Örnek: Samsung Galaxy Tab A8,
  Huawei MatePad.
- Bazı restoranlar telefon kullanır (özellikle küçük kafeler).
- Chrome/Samsung Internet tarayıcıda PWA olarak çalışır.
- "Ana ekrana ekle" kurulumu — native app hissi.
- **Offline-capable** — Wi-Fi kör noktaları normaldir; sepet yerel
  tutulur, sinyal geldiğinde senkronize.

### 2.4 Çözünürlük hedefleri

- Tablet dikey: 800×1280 (baseline, ayrıntılı optimize)
- Tablet yatay: 1280×800 (destekli ama çoğunlukla dikey)
- Telefon: 390×844 (iPhone baseline) — küçük ama kullanılabilir

## 3. Üst seviye ekranlar

### 3.1 Login

- Restoran seçimi (çoklu restoran için — MVP'de tek).
- Kullanıcı adı + şifre veya PIN (4 haneli).
- "Beni hatırla" — token local storage (shift süresi kadar).
- Biometrik (parmak izi) opsiyonel, PWA sınırları içinde.

### 3.2 Ana ekran — Masa listesi / haritası

İki view modu (kullanıcı seçer, tercih saklanır):

**Liste modu:**
```
┌──────────────────────────────┐
│ Salon A                      │
├──────────────────────────────┤
│ Masa 1   ●  Dolu · 12 dk     │
│ Masa 2      Boş              │
│ Masa 3   ●  Dolu · 5 dk      │
│ ...                          │
├──────────────────────────────┤
│ Teras                        │
├──────────────────────────────┤
│ Masa 11  ●  Dolu · 2 dk      │
│ ...                          │
└──────────────────────────────┘
```

**Harita modu:**
- Salon krokisi + masalar üstünde renk kodlu.
- Dolu/boş/rezerve durumu.
- Tıklanınca masa detayı.

Üst başlık:
- Kullanıcı adı + aktif vardiya süresi
- "Yeni Sipariş" büyük CTA
- Filtre (sadece benim masalarım, tüm masalar)
- Çevrimdışı indicator (varsa)

### 3.3 Masa detayı

```
┌──────────────────────────────┐
│ ← Masa 5  · 4 kişi · 12 dk   │
├──────────────────────────────┤
│                              │
│ Mevcut sipariş:              │
│ 2× Adana Kebap      280 TL   │
│ 1× Çoban Salata      45 TL   │
│ 2× Ayran             30 TL   │
│ ─────────────────────────    │
│ Toplam:             355 TL   │
│                              │
│ Durum:  Mutfakta (2 dk)      │
│                              │
├──────────────────────────────┤
│                              │
│   [+ Sipariş Ekle]           │  ← büyük primary
│                              │
│   [Adisyon Al]   [Servis ✓]  │  ← secondary'ler
│                              │
└──────────────────────────────┘
```

Aksiyonlar:
- **Sipariş Ekle** — menü akışına geçer
- **Adisyon Al** — kasaya "X masa adisyon istiyor" bildirimi
- **Servis Edildi** — mutfaktan gelen "hazır" item'ları "servis" olarak
  işaretler
- **Masa Notu** — müşteri notu, alerji, özel istek

Long-press bir sipariş satırı → item iptal/not ekleme drawer.

### 3.4 Yeni sipariş / Menü browse

Dikey tablet için optimize:

```
┌──────────────────────────────┐
│ [← Masa 5]      🔍 Ara       │
├──────────────────────────────┤
│ Kategoriler (yatay scroll):  │
│ [Başl.] [Ana] [Tatl.] [İçc.] │
├──────────────────────────────┤
│                              │
│ ┌──────────┐ ┌──────────┐    │
│ │          │ │          │    │
│ │  KEBAB   │ │  KÖFTE   │    │
│ │          │ │          │    │
│ │ 140 TL   │ │ 120 TL   │    │
│ └──────────┘ └──────────┘    │
│                              │
│ ┌──────────┐ ┌──────────┐    │
│ │ PİLAV    │ │ SALATA   │    │
│ │ 35 TL    │ │ 45 TL    │    │
│ └──────────┘ └──────────┘    │
│                              │
├──────────────────────────────┤
│ 3 ürün · 285 TL    [Sepet →] │  ← sticky alt
└──────────────────────────────┘
```

Ürün kartı: fotoğraf, isim, fiyat, alerjen ikonları.
Tıklanınca: ürün detay + modifier seçim.

### 3.5 Ürün detay + modifier

Drawer (alt yarıdan yukarı) açılır:

```
┌──────────────────────────────┐
│         [↓ Kapat]            │
├──────────────────────────────┤
│                              │
│     [URUN FOTO BUYUK]        │
│                              │
│     Adana Kebap              │
│     140 TL                   │
│                              │
│     Acılı, el yapımı         │
│                              │
├──────────────────────────────┤
│ Pişirme:                     │
│   ○ Az acılı                 │
│   ● Orta acılı               │
│   ○ Çok acılı                │
├──────────────────────────────┤
│ Yan ürün:                    │
│   ○ Pilav (+ 15 TL)          │
│   ● Pilav + Salata (+25 TL)  │
│   ○ Sadece kebap             │
├──────────────────────────────┤
│ Miktar:   [–]  2  [+]        │
├──────────────────────────────┤
│ Not (opsiyonel):             │
│ [soğansız lütfen........]    │
├──────────────────────────────┤
│                              │
│   [+ Sepete Ekle · 330 TL]   │  ← primary
│                              │
└──────────────────────────────┘
```

Modifier mantığı:
- Single select (radio)
- Multi select (checkbox)
- Mandatory vs optional
- Ücretli modifier'ların fiyat yansıması canlı

### 3.6 Sepet + gönderim

```
┌──────────────────────────────┐
│ Masa 5 - Sepet  [X]          │
├──────────────────────────────┤
│                              │
│ 2× Adana Kebap (Orta acılı,  │
│    Pilav+Salata)             │
│    Not: soğansız             │
│    2× 165 = 330 TL [düzenle] │
│                              │
│ 1× Çoban Salata              │
│    45 TL           [düzenle] │
│                              │
│ ─────────────────────────    │
│ Ara toplam:         375 TL   │
│ KDV (%8):            30 TL   │
│ Toplam:             405 TL   │
│                              │
├──────────────────────────────┤
│                              │
│ [Daha Ekle]   [Mutfağa Gönder]│
│                              │
└──────────────────────────────┘
```

"Mutfağa Gönder":
- Onay modal (yanlış gönderim önlemi, bir kez)
- API call: `POST /api/waiter/order`
- Başarı: haptik + ses + "Gönderildi" animasyon
- Masa durumu güncellenir, ana ekrana dön

### 3.7 Aktif siparişlerim ekranı (opsiyonel)

Garsonun sorumlu olduğu tüm masaları tek liste halinde:
- Mutfakta bekleyenler
- Hazır (servise çıkarılacak)
- Ödeme bekleyenler (adisyon alındı)

Yoğun vardiyada hızlı genel bakış için. KDS'in mini garson-versiyonu gibi.

### 3.8 Bildirim drawer

Üst çekince:
- "Masa 3'te hazır" (mutfaktan gelen ping)
- "Masa 7 adisyon istedi" (masadan tablet ile çağrı — ileride)
- "Kasa adisyon hazır" (kasadan gelen bildirim)

## 4. Kullanıcı akışları (detaylı)

### 4.1 Yeni misafir geldi → sipariş aldı → mutfağa gönderdi

```
Süre hedefi: 45 saniye misafir oturduğundan sipariş mutfağa düşene kadar.

1. (1sn) Garson tablette açılır ekran.
2. (3sn) "Masa 5" tıklar → masa detay.
3. (2sn) "Sipariş Ekle" → menü açılır.
4. (5sn) Kategori "Ana Yemek" seçer, 2 kebab seçer.
5. (10sn) Modifier'ları doldurur (orta acı, pilav+salata, not yok).
6. (3sn) "Salata" kategorisi → 1 çoban salata ekler.
7. (5sn) Sepet doğrular.
8. (2sn) "Mutfağa Gönder" → onay → GÖNDERİLDİ.
```

Gerçek dünya: garson masadan uzaklaşırken bile gönderilebilir.

### 4.2 Mutfaktan "hazır" bildirimi aldı

```
1. Mutfakta KDS'te "Masa 5 hazır" basıldı.
2. Garson tabletinde push bildirim (ses + titreşim).
3. Garson tableti kontrol eder: "Masa 5 - 2 Kebap hazır"
4. Mutfağa gidip alır, masaya servis eder.
5. "Servis ✓" tıklar → sipariş kapanır.
```

Bildirim tetikleyicisi: WebSocket event `order.item.ready` dispatch.

### 4.3 Müşteri ek sipariş istedi

```
1. Garson masa 5 detayına gider.
2. "Sipariş Ekle" → menü → tatlı ekle.
3. Sepet görünür.
4. "Mutfağa Gönder" — existing order'a ek satır eklenir.
5. KDS'te aynı sipariş kartında yeni item görünür.
```

### 4.4 Adisyon almak

```
1. Müşteri "adisyon lütfen" dedi.
2. Garson masa detay → "Adisyon Al"
3. Sistem kasaya bildirim gönderir: "Masa 5 adisyon bekliyor"
4. Garson ekranı: "Kasaya gönderildi, birazdan oradan gelecek"
5. Kasa adisyonu yazdırır, garson alır, masaya götürür.
```

Alternatif (pilot sonrası): garson tableti ile direkt tahsilat (iyzico
Checkout form tablet'te).

### 4.5 Yanlış sipariş girdi

```
1. Garson fark etti yanlış ürün ekledi.
2. Sepet ekranında ürün satırı "düzenle" → iptal.
3. Henüz "Mutfağa Gönder"e basmadıysa: sessiz silme.
4. Bastıysa: kitchen'e "iptal" eventi gider, mutfak "İPTAL" rozeti görür.
```

### 4.6 Wi-Fi kesildi

```
1. Garson tableti "Çevrimdışı" pill gösterir.
2. Sipariş almaya devam eder — sepet IndexedDB'de tutulur.
3. "Mutfağa Gönder" sırasında sinyal yoksa: "Gönderilecek, bekleniyor"
4. Sinyal gelince otomatik gönderir.
5. Kesinti uzun olursa garson manuel olarak kasaya sözlü bildirebilir.
```

Offline sınırı:
- Menü cached (son 24 saat)
- Sepet local persist
- Gönderim kuyruğu local queue
- Yeni menü değişikliği varsa uyarı: "Senkronize ediliyor"

## 5. Teknik dayanıklılık

### 5.1 Offline-first mimari

- Service Worker ile static asset'ler cache.
- Menü verisi React Query cache (staleTime = 1 saat).
- Sipariş submission kuyruğu: IndexedDB'de; sinyal gelince submit.
- Retry backoff: 1s, 2s, 5s, 15s, 60s.

### 5.2 Çoklu tablet senaryosu

Birden fazla garson aynı masaya sipariş eklemeye çalışırsa:
- Last-write-wins değil, **additive** (iki garson iki ayrı line ekler).
- Çakışma yok: her line ayrı ID.
- Ama aynı masa durumunu iki kez "adisyon al" yaparsa: tek kez eşleştir
  (idempotency token).

### 5.3 Battery awareness

Tabletler günde 8-12 saat açık; pil süresi önemli:
- Dark mode default (OLED avantajı)
- Polling yerine push (WebSocket daha az CPU)
- Background'a alınca WebSocket reconnect optimize
- Idle timer: 15 dakika inaktivite → otomatik kilit (PIN istenecek)

### 5.4 Performans hedefleri

- Menü ilk yükleme: < 1s (cached) / < 3s (first)
- Sipariş gönderimi (server → ACK): < 800ms
- Sayfa geçişleri: 60fps
- Scroll (menü, masa listesi): 60fps garanti
- 3 yıllık Samsung Tab A tabletlerinde test et

## 6. Veri modeli bağımlılıkları

Gateway API endpoints (staff token ile):
- `GET /api/waiter/tables` — masalar + son durum
- `GET /api/waiter/menu` — menü (cacheable)
- `POST /api/waiter/order` — yeni sipariş (masa + line'lar)
- `POST /api/waiter/order/<id>/line` — mevcut order'a line ekleme
- `DELETE /api/waiter/order/<id>/line/<line_id>` — line iptal
- `POST /api/waiter/order/<id>/bill-request` — adisyon talebi
- `POST /api/waiter/order/<id>/served` — servis onayı
- `WS /api/waiter/events` — push bildirimler

## 7. State management

- **Zustand:** UI state, aktif masa, sepet (current table)
- **React Query:** server state (tables, menu, orders)
- **IndexedDB via Dexie:** offline queue + cached menu
- **WebSocket:** real-time (mutfak "hazır" vb.)

## 8. PWA yapılandırması

```json
// manifest.json
{
  "name": "HashTap Garson",
  "short_name": "Garson",
  "theme_color": "#FF6B3D",
  "background_color": "#0A0E1A",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/waiter",
  "icons": [...]
}
```

- Service Worker: Workbox ile.
- "Ana ekrana ekle" banner: ilk login sonrası.
- Install prompt UX: "HashTap'i ekranınıza ekleyin, daha hızlı açılsın".

## 9. Kabul kriterleri

MVP için:
- [ ] Login + session yönetimi
- [ ] Masa listesi + harita iki view
- [ ] Masa detay + sipariş listesi
- [ ] Menü browse + kategori filtreleme + arama
- [ ] Modifier seçim (tek/çoklu + ücret hesabı)
- [ ] Sepet + mutfağa gönderme
- [ ] Mutfaktan "hazır" bildirimi (WebSocket)
- [ ] "Servis edildi" onayı
- [ ] Adisyon alma (kasaya bildirim)
- [ ] Offline mode (sepet persist + sync queue)
- [ ] Dark mode default, 800×1280 ve 1280×800 çözünürlüklerde düzgün
- [ ] PWA olarak tablete yüklenebilir ("Add to Home Screen")
- [ ] Haptik feedback (dokunma onayı, bildirim)

Pilot sonrası:
- [ ] Tablet'ten direkt kart tahsilatı (iyzico Checkout mobile)
- [ ] Table call (masadan tablet çağrısı)
- [ ] Split bill UI (per-item)
- [ ] Rezervasyon entegrasyonu
- [ ] Çoklu dil (personel İngilizce)

## 10. Açık sorular

- **Telefon desteği ne kadar?** — Küçük ekranda deneyim kısıtlı; waiter
  için tablet öneri. Telefon MVP'de çalışır ama edge case'ler iptal
  edilmiş olabilir.
- **Garsonlar tablet paylaşır mı?** — Evet, vardiya içinde 2-3 garson
  aynı tableti kullanabilir. Hızlı user switch gerekli.
- **Push notification native mi PWA mi?** — PWA Android'de iyi, iOS'ta
  Safari 16.4+ (nadir restoran). Yeter.
- **Kitchen to waiter bildirimi nasıl tetikleniyor?** — KDS'te "hazır"
  butonuna basıldığında. WebSocket event bus. Standart.
- **Garson performans metriği gerekli mi?** — "Kim kaç masa aldı, ne
  kadar hızlı" — yönetici için değerli. Pilot sonrası faz.

## 11. Geliştirme milestone'ları

Faz 15 içinde (ROADMAP pivot sonrası):

| Hafta | Çıktı |
|---|---|
| W1 | Proje iskele, design system, PWA setup, routing |
| W2 | Login + masa listesi + harita view |
| W3 | Menü browse + ürün detay + modifier |
| W4 | Sepet + mutfağa gönderme + WebSocket push |
| W5 | Offline queue + IndexedDB + retry logic |
| W6 | Bildirim sistemi (hazır, adisyon, vs) |
| W7 | Edge case'ler, polish, battery optimization |
| W8 | Pilot kabul testi + iterasyon |
