# HashCash — QR Sipariş & Ödeme Platformu (v0 arşiv)

> **Not:** Bu, projenin ilk vizyon + iş planı taslağıdır. İsim "HashCash" → **HashTap** oldu; mimari Odoo-tabanlı modül + white-label'a evrildi (ADR-0004, ADR-0005). Güncel ürün ve yol haritası için:
>
> - [docs/PRODUCT.md](./docs/PRODUCT.md) — güncel ürün tanımı
> - [docs/ROADMAP.md](./docs/ROADMAP.md) — W1–W22 plan
> - [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — güncel mimari
>
> Bu doküman tarihsel referans olarak tutuluyor — bazı kararlar (ör. kendi backend'imizi yazmak) artık geçerli değil.

---

> Müşteri masada QR okutur → menüden seçer → uygulama içinden öder → sipariş otomatik olarak restoranın mevcut POS/ERP sistemine düşer → adisyon/fiş restoranın yazıcısından çıkar → para doğrudan restoranın hesabına geçer.

---

## 1. Vizyon

Restoranlar zaten bir adisyon/POS sistemi kullanıyor (SambaPOS, Adisyo, Mikro, Logo, Profit, Atılım, Mikrofis vb.). Garson tabletle veya elle siparişi sisteme giriyor, mutfak/bar yazıcılarına fiş düşüyor, ödeme yazar kasa ya da POS cihazı üzerinden alınıyor.

**HashCash'in yeri:** **sipariş alma sürecini** dijitalleştirmek — servis ve müşteri ilişkisini değil. Garson hâlâ siparişi masaya getirir, hâlâ "afiyet olsun" der, hâlâ tabakları toplar. Biz sadece "sipariş bloknotu + yazar kasa fişi + ödeme alma" üçlüsünü müşterinin telefonuna taşıyoruz. Restoran için "dışarıdan gelen yeni bir sipariş kanalı"yız; QR kodu okutan masa, garson kadar geçerli bir kaynak. Bu **self-servis değil, sipariş aracılığı** felsefesi — ürünün karakterini belirleyen karar.

**Müşteri tarafı için katma değer:**
- Sıra beklemeden sipariş.
- Hesap bölüştürme (split bill).
- Çoklu dil.
- Geçmiş siparişler, favoriler.

**Restoran tarafı için katma değer:**
- Garson yükü düşer, hata oranı düşer.
- Sipariş–ödeme arasındaki kayıp süre sıfırlanır (önce ödeme, sonra mutfak).
- Ek bir POS terminali kirası gerekmez (sanal POS yeterli).
- Müşteri verisi (ne sipariş ediliyor, hangi saatte, kim tekrar geliyor).

---

## 2. Uçtan uca akış

```
[Müşteri telefonu]
   1. QR okut → app.hashcash.io/r/{restoran-slug}/t/{masa} (örn: /r/lacivert/t/12)
   2. Menüden ürün ekle → sepet
   3. "Öde" → ödeme ekranı (kart / Apple Pay / Google Pay)
   4. 3D Secure → ödeme gateway (iyzico/PayTR/Stripe)
   5. ✓ Ödeme onayı

[HashCash Backend]
   6. Ödeme webhook → "ödendi" durumu
   7. Sipariş paketini restoranın POS adapter'ına gönder
   8. Adapter, restoranın mevcut sistemine API ile yazar
       (SambaPOS: GraphQL; Adisyo: REST; SambaPOS yoksa: yerel print server)

[Restoran]
   9. Mutfak yazıcısı: yemek fişi
  10. Bar yazıcısı: içecek fişi
  11. Kasa: adisyon "ödendi" olarak açılır → Z raporuna girer
  12. Mali fiş: e-Arşiv olarak GİB'e gönderilir, müşteriye e-posta/SMS

[Para akışı]
  13. Ödeme gateway → restoranın kendi merchant hesabı (T+1 / T+2 hesaplaşma)
  14. HashCash → komisyon kesintisi (gateway veya ayrı fatura ile)
```

Önemli karar: **ödeme önce, hazırlık sonra.** Geleneksel akışın tersi. Riski (müşteri yer, kaçar) sıfırlar; iadeyi sadece üretim başlamadan önce yapar.

---

## 3. Mimari (yüksek seviye)

```
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│  Müşteri PWA    │ ──▶ │  HashCash API (BE)   │ ──▶ │  Ödeme Gateway     │
│  (React/Vite)   │     │  (Node/TS, Postgres) │     │  (iyzico/Stripe)   │
└─────────────────┘     └──────────┬───────────┘     └────────────────────┘
                                   │
                                   ├─▶ POS Adapter Layer
                                   │     ├─ SambaPOS adapter
                                   │     ├─ Adisyo adapter
                                   │     ├─ Mikro/Logo adapter
                                   │     └─ Generic Print Bridge (ESC/POS)
                                   │
                                   ├─▶ e-Arşiv / e-Fatura entegratörü
                                   │     (Foriba / Uyumsoft / Logo eFatura)
                                   │
                                   └─▶ Restoran Yönetim Paneli
                                         (gerçek zamanlı sipariş ekranı,
                                          rapor, menü editörü)
```

**Multi-tenant:** her restoran bir `tenant_id`. Menü, masalar, yazıcı yapılandırması, POS bağlantı bilgileri, gateway anahtarları tenant'a bağlı.

**Olay tabanlı (event-driven):** sipariş yaşam döngüsü `created → paid → sent_to_pos → in_kitchen → ready → served` gibi olaylarla yürür. Her aşamada restoran paneline ve müşteri PWA'sına websocket push.

---

## 4. POS / ERP entegrasyonu — herkese tek çözüm yok, "kütüphane" yaklaşımı

Bu projenin teknik kalbi burası. Her restoranın sistemi farklı; "tek API ile hepsine bağlanırız" yanılgı. Felsefe: **her restoran için elimizdeki en az invaziv yöntemi seçeriz.** Bunun için bir bağlantı yöntemleri kütüphanesi tutarız ve restoranın durumuna göre uygun olanı devreye alırız.

### 4.1 Adapter pattern — tek arayüz, çok uygulama
Her bağlantı yöntemi ayrı bir modül. Hepsi aynı arayüzü uygular; üst katman (sipariş motoru) hangisinin altında ne döndüğünü bilmez:
```ts
interface PosAdapter {
  pushOrder(order: Order, table: Table): Promise<PosOrderId>
  markPaid(posOrderId: PosOrderId, payment: Payment): Promise<void>
  syncMenu(): Promise<MenuSnapshot>   // restoran menüyü tek yerden yönetsin
  healthCheck(): Promise<AdapterHealth>
}
```

### 4.2 Bağlantı yöntemleri — duruma göre seçilir

Aşağıdaki yöntemleri "menüde" tutarız, restoranın POS'una göre uygun olanı satış sırasında belirleriz:

| Yöntem | Ne zaman kullanılır | Notlar |
|--------|---------------------|--------|
| **Resmi REST/GraphQL API** | POS firması açık API sağlıyorsa (SambaPOS, Adisyo gibi) | En temiz; iki yönlü senkron mümkün |
| **Webhook (POS → biz)** | POS sadece event yayınlıyorsa | Sipariş yazımı için yetmez, sadece durum alma için |
| **Yerel bilgisayar ajanı** | POS yazılımı yerel kuruluysa, dış API yoksa (Mikro, Logo, Profit gibi) | POS'un çalıştığı PC'ye küçük Windows servisi kurarız; DB'ye veya yerel API'ye yazar, buluttan WebSocket ile sipariş çeker |
| **DB-level connector** | Yerel ajan da kurulamıyorsa, DB şeması biliniyorsa | Riskli (POS güncellemesi şemayı kırabilir), sadece yedek |
| **Print Bridge (Raspberry Pi)** | POS hiç açılamıyorsa veya restoranın POS'u yoksa | Wi-Fi'a takılı küçük cihaz, mutfak/bar yazıcılarına ESC/POS ile fiş basar; "plug & play" |
| **Doğrudan ESC/POS / network printer** | Yazıcılar zaten ağdaysa, ek donanım gerekmez | Print Bridge'in cihazsız varyantı |

Her yöntem için ayrı adapter; restoran kayıt sırasında "POS bağlantı tipi" seçilir, gereken konfigürasyon (API anahtarı / yerel ajan kurulum kodu / cihaz seri numarası / yazıcı IP'si) panelden girilir.

### 4.3 İlk satış stratejisi: en kolay yoldan başla
İlk pilot kurulumlarda **Print Bridge / yazıcıya doğrudan basım** ile başlamak en hızlısı — POS firmasıyla hiç konuşmadan restorana "yarın getireyim takıyım" denebilir. Resmi API entegrasyonları (SambaPOS, Adisyo) paralelde geliştirilir, hazır oldukça uygun restoranlara teklif edilir.

---

## 5. Ödeme entegrasyonu

### 5.1 Para akışı modelleri
İki seçenek:

**A) Marketplace modeli (HashCash hesaplaşır):**
- Müşteri HashCash'e öder, HashCash restorana T+1/2 transfer eder, komisyonu keser.
- Avantaj: kurulum kolay, restoran tek imza atar.
- Dezavantaj: HashCash'in MASAK/BDDK kapsamında "ödeme kuruluşu" lisansı gerekir → çok pahalı, çok yavaş.

**B) Direkt ödeme (HashCash facilitator) — ✅ SEÇİLEN MODEL:**
- Restoranın kendi iyzico / PayTR / Param / Stripe **alt hesabı** açılır.
- HashCash sadece "API üzerinden ödeme tetikleyici"dir, paraya hiç dokunmaz.
- Komisyon: ya gateway'in marketplace özelliğinden (iyzico subMerchant), ya HashCash kendi SaaS abonelik faturasını kesip komisyonu oradan alır.
- Hukuki yük yok, MASAK/BDDK lisansı gerekmez.

### 5.2 Türkiye gateway'leri
- **iyzico** (subMerchant API var, marketplace için en olgun) — **birinci tercih**.
- **PayTR** (yaygın, ucuz komisyon).
- **Param POS** (banka entegrasyonları geniş).
- **Stripe** — Türk lirası için sınırlı, yurt dışı turist trafiği fazla olan otel/sahil restoranları için ikincil seçenek.

### 5.3 Bahşiş
Ödeme ekranında %5/%10/%15/özel buton. Bahşiş tutarı ayrı bir kalemde gateway'e gider, restoran isterse ayrı bir alt hesaba (garson havuzu) yönlendirilebilir.

---

## 6. Mali / yasal — Türkiye'de bunu atlayınca proje çalışmaz

### 6.1 Yazar kasa zorunluluğu
Türkiye'de gıda satışı yapan işletme **yeni nesil ÖKC (Ödeme Kaydedici Cihaz)** üzerinden fiş kesmek zorunda. Yani ödeme HashCash üzerinden de gelse, fiscal fişin GİB'e bildirilmesi gerek. Üç yol:
1. **e-Arşiv fişi**: e-Arşiv mükellefi restoranlar için, biz bir e-Arşiv entegratörü (Foriba, Uyumsoft, Logo eFatura, Mysoft) üzerinden elektronik fiş keseriz. **Tercih edilen yol.**
2. **ÖKC ile entegre POS**: bazı yeni nesil ÖKC'ler (Hugin, Ingenico, Verifone) dış sistemden komut alıp fiş basabilir → sertifikalı entegrasyon gerekir.
3. **Restoran kendi keser**: HashCash sadece sipariş/ödeme aracısı; mali fişi restoran kendi kasasından keser. MVP için en hızlı, müşteri deneyimi için en kötü (e-posta ile fiş gelmez).

### 6.2 Sözleşmeler
- HashCash ↔ Restoran: SaaS sözleşmesi + işleme aracılık.
- HashCash ↔ Müşteri: KVKK aydınlatma, mesafeli satış (yiyecek/içecek istisnası dikkat).
- Gateway ↔ Restoran: doğrudan, HashCash şahit.

---

## 7. Menü Senkronizasyonu — projenin bel kemiği

> "Asıl iş bu" diye işaretlendi. Aynı menü iki yerde yaşar: restoranın POS'unda (siparişin yazıldığı, fişin kesildiği yer) ve HashTab'da (müşterinin gördüğü yer). Bu ikisi tutmazsa: müşteri "Tavuk Şiş 250 ₺" sipariş eder, POS'a "TAV.SIS 280 ₺" düşer veya hiç düşmez. Restoran kaybeder, müşteri de kaybeder.

### 7.1 Tasarım kararı: katmanlı sahiplik
İki sistem aynı şeye sahip değil — **farklı şeylere** sahip. Çakışma yok, çünkü alanlar ayrılıyor:

| Alan | POS sahibi | HashTab sahibi |
|------|------------|----------------|
| Stok kodu / SKU | ✅ | — |
| İsim (kasaya çıkacak kısa isim) | ✅ | — |
| Fiyat (resmi) | ✅ | sadece okur |
| KDV oranı | ✅ | — |
| Muhasebe / kategori | ✅ | — |
| Aktif/pasif (kalıcı) | ✅ | — |
| "Bugün stokta yok" (geçici) | — | ✅ |
| Müşteri görseli ismi | — | ✅ ("Köy Tavuk Şişi" vs POS'taki "TAV.SIS") |
| Fotoğraf | — | ✅ |
| Açıklama | — | ✅ |
| Çoklu dil | — | ✅ |
| Alerjen / vegan / acılık | — | ✅ |
| Modifier (sosu yanda, az pişmiş, ekstra peynir) | hibrit | hibrit |

Özet: **POS = iş yönetimi gerçeği** (vergi, stok, kasa). **HashTab = sunum gerçeği** (müşterinin gördüğü).

### 7.2 Eşleştirme (mapping) modeli
HashTab'daki her ürün, bir veya daha fazla POS ürününe bağlanır:
```
hashtab_item: { id, name_tr, name_en, photo, allergens, hidden, ... }
   └─ pos_link: { pos_product_id, pos_name, pos_price (cached), last_synced_at }
```

Sipariş düştüğünde:
- Müşteri PWA'sında gösterilen: `hashtab_item`
- POS'a yazılan: `pos_link.pos_product_id` ve `pos_link.pos_price`

Fiyat çakışması (cache eskimiş, POS fiyatı değişmiş): sipariş POS'a düşmeden önce **POS fiyatı kazanır**, müşteriye "fiyat 250 → 280 oldu, devam edilsin mi?" uyarısı çıkar. Nadir senaryo, ama olduğunda sessiz hata olmaması kritik.

### 7.3 Sync döngüsü
```
Her saat (veya panelden "Şimdi senkronize et"):
  POS adapter → POS'tan menü çek
  Diff hesapla:
    • Yeni POS ürünü var
        → HashTab'da "Eşleştirilmemiş ürün" listesine düşer.
        → Restoran fotoğraf + açıklama + çeviri ekleyip "müşteri menüsüne çıkar" der.
        → Veya "gizli" işaretler (örn. personel yemeği).
    • POS'ta fiyat değişti
        → cache güncellenir, müşteri PWA'sı yeni fiyatı gösterir.
    • POS'ta ürün silindi/pasifleşti
        → HashTab'da otomatik gizlenir, restorana panel bildirimi.
    • HashTab'da düzenleme yapıldı (fotoğraf, çeviri, alerjen)
        → POS'a hiçbir şey gitmez (POS'un alanı değil).
    • HashTab'a yeni ürün eklendi (henüz POS'ta yok)
        → "POS'ta eşleşme bekliyor" durumunda. Müşteriye gösterilmez.
        → Sipariş gelirse POS'a yazılamaz, alarm çıkar.
        → Restoran ürünü POS'una eklediğinde otomatik eşleştirme önerisi (isim+fiyat fuzzy match) çıkar.
```

### 7.4 İlk kurulum sihirbazı (onboarding)
Restoran HashTab'a ilk eklendiğinde:
1. POS bağlantısı kur (API anahtarı / yerel ajan kurulum kodu / Print Bridge cihazı).
2. POS'tan menü tek seferlik tam çekilir.
3. Liste ekranı: her ürün için 3 buton — **[Müşteriye göster] [Sonra] [Gizle]**. "Müşteriye göster" derse fotoğraf + İngilizce çeviri (otomatik öneri ile) + alerjen formu açılır.
4. AI destekli: ürün isminden açıklama önerisi, ortak menü item veritabanından (bizim biriktireceğimiz) fotoğraf önerisi.
5. **Hedef: 30 dakikada menü hazır olsun.** Bu süre tutmuyorsa restoran satışı yapamayız.

### 7.5 Print Bridge senaryosunda menü (POS yoksa)
- HashTab tek doğru kaynak.
- Mutfak/bar fişine HashTab item ismi + modifier'lar + masa no basılır.
- SKU/stok takibi yok; restoran isterse HashTab paneli üzerinden basit gün sonu raporu alır.
- Bu senaryo için menü editörü daha zengin: KDV, kategori, "yarın menüde olacak" zamanlama vs.

### 7.6 Çoklu konsept (madde 6'daki cevap)
Bir tenant altında birden çok `concept` (örn. "Restoran", "Üst Kat Bar", "Nargile"). Her konseptin kendi menüsü, kendi POS bağlantısı, kendi yazıcıları olabilir. Müşteri masada aynı QR'dan tüm konseptleri görür, tek sepet/tek ödeme yapar; arka planda her konseptin siparişi kendi mutfağına/barına/POS'una düşer.

### 7.7 Edge case'ler
- **Aynı POS ürünü, farklı sunumlar:** "Salata" POS'ta tek ürün ama HashTab'da "Mevsim Salatası" ve "Çoban Salatası" olarak ayrı görünmek istenirse → tek `pos_product_id`, iki `hashtab_item`. Modifier ile ayrım.
- **HashTab'da varyant, POS'ta ayrı ürün:** "Pizza Margherita Küçük/Büyük" HashTab'da varyant; POS'ta `PIZ.MARG.S` ve `PIZ.MARG.L` ayrı ürünler. Eşleştirme `variant_id → pos_product_id`.
- **Fiyat farkı (teras/iç mekan):** masa konumu HashTab'da etiket → masa etiketine göre farklı `pos_link` seçilir. Çoğu POS bunu zaten halleder (price list per zone), biz takip ederiz.

---

## 8. MVP kapsamı (ilk 3 ay)

Hedef: **Bir pilot restoranda, gerçek bir akşam servisinde uçtan uca çalışan ürün.**

- [ ] Çok kiracılı (multi-tenant) menü editörü — restoran kendi ürün/kategori/fotoğrafını yönetir.
- [ ] Müşteri PWA: sepet + sipariş + ödeme ekranı, çoklu dil.
- [ ] Tenant + masa modeli, QR şeması: `…/r/{slug}/t/{table}`.
- [ ] iyzico subMerchant ile ödeme (pilot restoranın kendi alt hesabı).
- [ ] **Print Bridge v0**: Raspberry Pi + node-thermal-printer ile ESC/POS basımı. Mutfak ve bar olmak üzere iki yazıcıya ayrı fiş.
- [ ] Restoran paneli: gerçek zamanlı sipariş listesi (websocket), "hazır", "teslim edildi" butonları, manuel "POS'a tekrar gönder".
- [ ] e-Arşiv: Foriba veya Uyumsoft ile entegrasyon (sandbox yeterli).
- [ ] Bahşiş, hesap bölüştürme — sadece varsa nice-to-have.

Başarı kriteri: Bir akşam servisinde masaların büyük çoğunluğu uygulama üzerinden sipariş verip ödesin, garson sadece servisi yapsın, hiçbir adisyon kaybolmasın.

---

## 9. Aşamalı yol haritası

| Faz | Süre | Çıktı |
|-----|------|-------|
| 0. Ön çalışma | 2 hafta | iyzico subMerchant onayı, e-Arşiv entegratör seçimi, donanım listesi |
| 1. MVP | 8 hafta | Pilot restoranda tek lokasyon canlı |
| 2. Pilot genişletme | 3 ay | Farklı tipte 5 restoran (cafe, balıkçı, fine dining, bistro, otel restoranı) |
| 3. SambaPOS adapter | 1 ay | SambaPOS kullanan işletmeler |
| 4. Adisyo adapter | 1 ay | Adisyo kullanan ~15K restoran TAM'ı |
| 5. Yerel ajan + DB connector | 2 ay | Mikro/Logo/Profit gibi kapalı sistemler |
| 6. Turistik bölge / çoklu dil derinleştirme | sürekli | Sahil ve şehir merkezi turist trafiği |

---

## 10. Teknik yığın önerisi

- **Frontend (müşteri PWA):** Mevcut React + Vite + i18n. Service worker ile offline sepet.
- **Frontend (restoran paneli):** React + websocket (Socket.IO veya native WS).
- **Backend:** Node.js + TypeScript + Fastify (veya NestJS modülerlik için). Postgres (multi-tenant: schema-per-tenant değil, `tenant_id` kolonlu satır seviyesi izolasyon + RLS).
- **Kuyruk/event:** Postgres tabanlı (PgBoss) MVP'de yeterli; ileride Redis/NATS.
- **Adapter çalıştırma:** her adapter ayrı paket, dinamik yüklenir.
- **Print Bridge:** Node.js + `node-thermal-printer`, MQTT veya WebSocket ile bulut bağlantısı.
- **Hosting:** Hetzner / DigitalOcean (TR yakın), CDN için Cloudflare. Sahil restoranlarında internet kararsız → Print Bridge'in 5 dakikalık offline buffer'ı olmalı.
- **Gözlem:** Sentry + Grafana (Loki + Tempo). Sipariş–ödeme–POS arasında korelasyon ID şart.

---

## 11. Başlıca riskler

| Risk | Olasılık | Etki | Azaltma |
|------|----------|------|---------|
| Ödeme alındı ama POS'a düşmedi | Orta | Çok yüksek (müşteri yemek bekler) | İdempotent retry + restoran panelinde "manuel düş" butonu + alarm |
| Mutfak yazıcısı offline | Yüksek | Yüksek | Print Bridge yerel buffer + sesli/görsel alarm |
| Mali fiş kesilmedi | Düşük | Çok yüksek (vergi cezası) | e-Arşiv başarısızsa siparişi tamamlama, restorana panel uyarısı |
| Restoran POS'unun API'si yok | Yüksek | Orta | Print Bridge yedek plan |
| iyzico subMerchant onayı uzar | Orta | Yüksek | PayTR ile paralel başvuru |
| Müşteri "yemek geldi ama yanlış" diyor → iade | Orta | Orta | Mutfak fişine müşteri ID + zaman; iade için restoran panel onayı |
| Sezonluk talep (sahil) | Yüksek | Düşük | Sunucu maliyetlerini yatay otomatik ölçeklendir |

---

## 12. İş modeli

Üç gelir kalemi olabilir, başta sadece (a)+(b):

- **a) Aylık SaaS:** restoran başına aylık (örn. 2.500–5.000 TL), masa sayısına göre kademeli.
- **b) İşlem komisyonu:** ödeme tutarının %0.5–1'i. Gateway komisyonu (iyzico ~%1.7) buna ek.
- **c) Donanım:** Print Bridge tek seferlik satış (~1.500 TL) veya kira.
- **d) Veri/raporlama (ileride):** anonim sektör benchmark raporları, premium analytics.

Pilot'ta (a) ve (c) ücretsiz, sadece (b) — restoranın "ücretsiz dene" demesi kolay.

---

## 13. Açık sorular (karar vermeden ilerlemeyelim)

1. **İlk pilot restoran tipi:** tek bir işletmeyle mi başlayalım, yoksa 2-3 farklı işletme tipiyle (cafe, balıkçı, fine dining) paralel mi? Pilot çeşitliliği ürünü daha iyi şekillendirir ama MVP'yi yavaşlatır.
2. **Ödeme aracılık modeli:** iyzico subMerchant → MASAK lisansı gerektirmediğini hukukçuya teyit ettirmek lazım.
3. **Mali fiş entegratörü:** ✅ **Karar: pilot restoranın mevcut entegratörüne ayak uyduracağız.** Uzun vadede en yaygın 2-3 entegratör için adapter yazılır (Foriba, Uyumsoft, Logo eFatura).
4. **Marka:** ~~HashCash~~ — "hashcash" zaten 1997 Adam Back algoritması. **Karar: isim değişecek, "hash" kalacak.** Aday listesi (bölüm 14'e bak), tescil öncesi 2-3 finalist seçilip alan adı + TPMK kontrolü yapılacak.
5. **Garson rolü:** ✅ **Karar: sipariş odaklı.** Sipariş verildikten sonra garson hâlâ getirir. Biz yalnızca sipariş alma sürecini dijitalleştiriyoruz, "self-service" bir kafeterya değiliz. Bu felsefe vizyon bölümüne işlendi.
6. **Çoklu işletme tek adisyon:** ✅ **Karar: destekleyeceğiz.** Bir tenant altında birden fazla "konsept" (restoran/bar/nargile) olabilir, aynı masaya birden çok konseptten sipariş eklenebilir, tek hesapta toplanır. Veri modeline `concept_id` eklenecek.
7. **Menü yönetimi sahibi:** ✅ **Karar: hibrit, katmanlı sahiplik.** Restoran HashTab panelinden de POS'undan da düzenler; iki sistem aynı şeye değil, **farklı şeylere** sahip olur. Detay bölüm 7'ye işlendi — proje mimarisinin bel kemiği bu.

---

## 14. Marka adı — "hash" kalır, isim değişir

Kriterler:
- "hash" mutlaka geçer (kullanıcı kararı).
- 2 hece ya da kısa bir kompozisyon — söylemesi kolay.
- Restoran/sipariş/ödeme dünyasıyla doğal çağrışım.
- `.com` / `.io` / `.app` müsait olmalı.
- Türkçe okunuşu da doğal olmalı.

### Aday liste

| İsim | Çağrışım | Avantaj | Dezavantaj |
|------|----------|---------|------------|
| **HashTab** | "tab" = restoran adisyonu/hesabı (İngilizce barlarda yaygın), aynı zamanda browser tab | Hem ödeme hem dijital; kısa, akılda kalır | "Tab" Türkçe okuyana yabancı gelebilir |
| **HashOrder** | Direkt: "sipariş" | Tanımlayıcı, SEO dostu | Çok jenerik |
| **HashServe** | Servis | Restoran çağrışımı güçlü | "serve" Türkçe okuyana yabancı |
| **HashBites** | "bites" = küçük lokmalar | Sıcak, gıda odaklı | Sadece atıştırmalık çağrışımı |
| **HashMasa** | TR/EN hibrit, "masa" net | Yerel dokunuş, anlaşılır | Küresel ölçeklenirse zorlar |
| **HashKasa** | "kasa" = ödeme noktası | Çok yerel, çok net | Aynı sorun + "POS" gibi algılanabilir |
| **HashPay** | Ödeme | Net | Biz "ödeme şirketi" değiliz, bu odakta hata mesajı verir |
| **Hashy** | Markamsı, kısa | Esnek, scalable | Anlamsız, B2B'de güven düşük |
| **HashFlow** | Akış | Modern | Çok jenerik (başka ürünlerde var) |

**İlk öneri: HashTab.** Hem "restoran adisyonu" hem "ödeme" çağrışımı taşır, küresel kullanılabilir, TR'de de kısa söylenir. İkinci tercih: **HashMasa** (yerel pazara sıcak girer, ama küresel ölçek zorlaşır).

**Sonraki adım:** finalist 2-3 isim için aynı gün `.com/.io/.app` + Türk Patent ve Marka Kurumu (TPMK) sınıf 35/42 (yazılım/perakende) sorgulaması yapılır.

> Doküman geri kalanında geçici olarak **HashTab** kullandım (önceki "HashCash" yerine bazı yerlerde geçer hâlâ — final isim seçilince toplu rename).

---

## 15. Sonraki somut adım

Önerim şu sırayla:
1. **İsim kararı** — bölüm 14'teki adaylardan finalist seç → alan adı + TPMK kontrolü → tescil başvurusu.
2. **Hukuk / mali danışmanla 1 saat** — subMerchant modeli + e-Arşiv yükümlülüğü teyit.
3. **iyzico kurumsal satış** — subMerchant başvurusu (2-3 hafta sürer, paralel başlatalım).
4. **Pilot restoran adayı seç + bir akşam gözlem** — şu anki sipariş→fiş→ödeme akışını dakika dakika çıkar. POS hangi marka, hangi yazıcılar var, kaç adisyon paralel açık, ortalama masa süresi ne, menüde kaç ürün var (bölüm 7 onboarding süresi için kritik).
5. **Yeni repo açılışı:** seçilen isimle (mevcut Terakki menü repo'sundan ayrı, bağımsız ürün). Müşteri PWA + restoran paneli + backend monorepo olarak başlayabilir.
6. **Menü sync PoC** — pilot restoranın POS'undan menü çekip "katmanlı sahiplik" modelinin gerçek veriyle nasıl davrandığını görmek. (Bu MVP'nin en riskli teknik parçası, önden test edilmeli.)
7. **Print Bridge için 1 adet Raspberry Pi + termal yazıcı sipariş** (~3.000 TL toplam) — donanım PoC.

Bu adımlar bittiğinde 8 haftalık MVP sprint'ine net bir backlog ile gireriz.
