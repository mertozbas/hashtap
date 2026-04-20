# HashTap — Ürün Tanımı

Bu doküman ne inşa ettiğimizi, kim için inşa ettiğimizi ve hangi sınırları çizdiğimizi kayıt altına alır. Teknik tercihler değil iş kararları buradadır.

## 1. Bir cümlede

**HashTap, restoranların mevcut POS'larıyla birlikte ya da onun yerine çalışan; müşterinin QR okutup cebinden sipariş verip ödediği, restoran için tam ERP özelliklerini arka planda sağlayan çok kiracılı SaaS.**

## 2. Hangi problemi çözüyoruz

### 2.1 Müşteri tarafında
- Yoğun saatte garson bekleme süresi.
- Menü fotoğrafı / dil seçeneği yetersizliği (özellikle turistik bölgelerde).
- Fiş için ayrıca beklemek, kart okutmak, imza, bahşiş hesabı.
- Grup hesabını bölüştürmek.

### 2.2 Restoran tarafında
- POS'u olmayan küçük işletmelerde sipariş kaydı defter/hafıza üstünde.
- POS'u olan işletmelerde bile: masa çevriminin yavaşlığı, menü fotoğrafı basılı menüye hapsolmuş, çok dilli menü yok, ciro analizi zayıf.
- e-Arşiv, KDV, günsonu Z raporu için ayrı ayrı sistemler.
- Türkiye'de kart komisyonu + POS kirası + BT destek paketini ayrı ayrı ödemek.

### 2.3 Ekosistem tarafında
- Mevcut POS ürünleri (SambaPOS, Adisyo, Logo) restoran deneyimi için kapalı kutu. Üçüncü parti uygulamanın ekran açması dahi zor.
- Yeni açılan kafelerin POS seçiminde iki ay harcaması — pazarda parçalı, kafa karıştırıcı bir manzara var.

## 3. Hedef müşteri segmentleri

### 3.1 Segment A — Küçük & yeni işletme (POS'u yok)
- 5–40 masa arası kafe/restoran.
- POS kiralamak, kurdurmak, eğitim almak için zamanı ve parası yok.
- HashTap'i **tek paket** olarak kullanır: hem QR menü + ödeme, hem mutfak yazıcısı (print-bridge), hem ERP (Odoo arka planda), hem muhasebe köprüsü.
- **Birincil hedef segment. MVP burada başlar.**

### 3.2 Segment B — Mevcut POS'u olan orta işletme
- SambaPOS / Adisyo kullanıyor, değiştirmek istemiyor.
- Sadece QR menü + ödeme + e-Arşiv parçasını istiyor.
- HashTap onların POS'una **adapter** ile bağlanır, kendi ERP'miz devre dışı.
- **İkincil hedef. Mevcut müşteriye ekleme satışı anlamına gelir.**

### 3.3 Segment C — Zincir veya bölgesel grup
- 3+ şube, farklı konseptler (restoran + bar + kafe).
- Merkezi raporlama, merkezi menü, ama şube düzeyinde bağımsız operasyon istiyor.
- HashTap'in tenant-içi-çoklu-konsept desteği ve Odoo'nun çoklu şirket modeliyle hedeflenir.
- **Faz 2/3 hedefi. İlk 12 haftada odak değil.**

### 3.4 Kapsam dışı
- Oteller (oda servisi, housekeeping).
- Dark kitchen / delivery-only işletmeler (farklı akış, farklı ekonomi).
- Perakende (giyim, market). HashTap restoran-spesifik kalır.

## 4. Değer önerisi (customer-facing)

| Müşteriye söylediğimiz | Arkada ne var |
|---|---|
| "Tek paket: QR menü + ödeme + mutfak fişi + ERP" | Odoo 17 CE + `hashtap_pos` modülü |
| "POS yoksa bizim sistemimizi kur, POS varsa bağlanalım" | Segment A: tam HashTap; Segment B: adapter |
| "Direkt senin banka hesabına" | iyzico subMerchant (facilitator model) |
| "e-Arşiv otomatik" | Foriba/Uyumsoft adapter, fail-close policy |
| "Türkçe + İngilizce menü otomatik" | `hashtap_pos` modülü i18n alanları |
| "Aylık sabit, masa başı değil" | SaaS aboneliği (MRR) |

## 5. Ticari model

- **Aylık abonelik** — masa/ciro/kullanıcı başı değil, sabit paket.
- **Kurulum ücreti** — tek seferlik, donanım + eğitim + menü yükleme dahil.
- **Kart komisyonu** — iyzico'nun oranı + küçük bir HashTap payı (facilitator fee). Bu pay ana gelir kaynağı değil, marjinal.
- **Print-bridge donanımı** — Raspberry Pi + yazıcı dahil paket; ya kurulum ücretine yedir ya ayrıca sat.

## 6. Temel özellik listesi (MVP)

- [ ] Müşteri PWA: QR → menü → sepet → ödeme → sipariş durumu.
- [ ] Müşteri tarafında TR + EN dil desteği.
- [ ] Apple Pay / Google Pay + kart (iyzico 3DS).
- [ ] Restoran paneli (Odoo native, white-label): sipariş akışı, menü yönetimi, stok, ciro raporu, ayarlar.
- [ ] Mutfak yazıcısı çıktısı (print-bridge veya network printer).
- [ ] e-Arşiv otomatik fiş.
- [ ] Çoklu masa yönetimi.
- [ ] Günsonu Z raporu.
- [ ] Tenant provisioning (yeni restoran bir saat içinde açılabilir).

## 7. Kapsam dışı (MVP)

- Rezervasyon sistemi.
- Müşteri sadakat programı / QR kampanya.
- Kurye / delivery entegrasyonu (Yemeksepeti, Getir).
- Çoklu konsept / zincir raporlama.
- Bordro, personel vardiya optimizasyonu.
- AI menü önerisi / dinamik fiyatlama.

Bunlar faz 2–3 adayları. MVP'de **tek bir restoran tek bir şubede uçtan uca çalışıyor** olmak yeter.

## 8. Başarı kriterleri

MVP başarılı sayılır eğer:
1. Bir pilot restoran, HashTap'in tek sistemi olarak 4 hafta boyunca kesintisiz çalışır.
2. Haftalık işlem hacmi en az 200 sipariş.
3. Ödemelerin %95'i iyzico üzerinden başarıyla, %100'ünde e-Arşiv otomatik kesilmiş olur.
4. Pilot restoran sahibi "bunu diğer şubemde de kullanırım" der ve referans verir.
5. Sistem provisioning (yeni restoran açma) 60 dakikanın altına iner.

## 9. Rekabet ve pozisyonlama

| Rakip | Güçlü yönü | HashTap'in farkı |
|---|---|---|
| SambaPOS | Türkiye'de yaygın, stabil | Modern QR/mobile UX yok, SaaS değil |
| Adisyo | Bulut tabanlı, QR var | POS'suz tek paket olarak zayıf, white-label yok |
| MenuQR / Sunmenu benzeri | Ucuz, hızlı kurulum | ERP/ödeme yok, sadece dijital menü |
| Square / Toast (ABD) | Çok olgun | Türkiye'de yok; e-Arşiv ve iyzico ekosistemi yok |

HashTap'in pozisyonu: **"Modern QR deneyimi + Türkiye'ye yerel ERP + tek paket"** — bu üçünü birden sağlayan doğrudan bir rakip bildiğimiz kadarıyla yok.

## 10. Açık sorular

- Kart komisyonu üstüne HashTap payı yasal olarak nasıl alınacak? (Facilitator sözleşmesinde tanımlı olmalı, hukuki doğrulama gerekiyor.)
- Print-bridge donanımını biz mi stoklayacağız, distribütör mü? — Pilotta kendimiz kurarız, ölçeklenince dağıtım ortağı.
- Müşteri verileri Türkiye'de mi saklanmalı? (KVKK açısından evet — Hetzner İstanbul / Telekom bulut adayları.)
- Pilot restoran kim? — Bu doküman yazıldığı anda net müşteri yok.
