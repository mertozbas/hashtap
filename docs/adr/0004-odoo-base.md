# ADR-0004 — Odoo CE 17 tabanı

- Durum: kabul
- Tarih: 2026-04-20
- İlgili: ADR-0005, ADR-0006, ADR-0010; `PRODUCT.md`, `ARCHITECTURE.md`

## Bağlam

Faz 0'da TS/Node'da sıfırdan restoran ERP yazma planlanmıştı. Araştırma sonucunda iki gözlem öne çıktı:

1. ERP yazımı bir yıllık mega-iş: muhasebe doğruluğu, stok düşümü hesabı, KDV beyannamesi, vardiya/personel modülleri — her biri kendi başına bir ürün. Küçük ekiple MVP sonrası bile yetişmez.
2. Açık kaynak, olgun, aktif bakımlı, restoran-odaklı, TS/Node'da bir ERP taban **mevcut değil**. Python (ERPNext, Odoo) veya ölü Java/PHP seçenekleri var.

Şu üç yol tartışıldı:
- A) Ayrı servis olarak ERPNext/Odoo'yu yanda koştur, HashTap API ile konuş.
- B) Bir ERP'yi fork'la, core'u değiştir, "HashTap POS" olarak sat.
- C) Sıfırdan minimal restoran ERP yaz (TS/Node).

Sonraki araştırmada **"modül + white-label"** dördüncü yol ortaya çıktı ve kabul edildi (ADR-0005). Bu ADR sadece **taban olarak Odoo CE seçimi**ni belgeler.

## Alternatifler

### Odoo Community 17 LTS
- **Lisans:** LGPLv3.
- **Stack:** Python + PostgreSQL + OWL.
- **Restoran olgunluğu:** `pos_restaurant` modülü canlı — masa planı, KDS, split bill, modifier.
- **Multi-tenant:** Odoo Online'ın kullandığı DB-per-tenant modeli kanıtlı.
- **Topluluk:** Geniş, OCA gibi aktif katmanlar.
- **TR uyumu:** OCA `l10n-turkey` kıvılcımı var; bakım gevşek ama başlangıç noktası mevcut.

### ERPNext (Frappe)
- **Lisans:** GPLv3.
- **Stack:** Python + MariaDB/Postgres + Frappe framework.
- **Restoran olgunluğu:** Zayıf. Restoran modülü topluluk eliyle, çoğu eklenti bakımsız.
- **Multi-tenant:** Site-per-tenant (Frappe Cloud modeli) — kanıtlı ama dökümantasyon daha dağınık.
- **TR uyumu:** Yok denecek kadar az.
- **Framework:** DocType metadata-driven — form fabrikası için hızlı; karmaşık iş akışları için sınırlı.

### Yol C — sıfırdan TS/Node
- Kontrol tam.
- Maliyet yüksek — ERP çekirdek sorunları (muhasebe doğruluğu, KDV) yeniden yazılır.
- Piyasada tabanda 10+ yıl olgunlaşmış alternatiflerle yarışacak kalitede ilk sürümü bulmak zor.

## Karar

**Odoo Community 17 LTS.**

Gerekçeler:
1. **LGPL > GPL** modül yazımında manevra alanı. Kendi modülümüzü LGPL altında tutarak etrafında ticari katman kurmak hukuken net.
2. **`pos_restaurant` olgunluğu** ERP'nin restoran tarafını bedava getiriyor — masa planı, KDS, modifier, split bill zaten var.
3. **Multi-tenant kanıtlı**: Odoo Online binlerce kiracıyla aynı DB-per-tenant modelini koşuyor.
4. **Accounting olgun**: Muhasebe, stok, raporlama alanlarında Odoo CE, ERPNext'e göre daha derin ve daha çok üretim kullanıcısıyla hata ayıklanmış.
5. **Geliştirici havuzu**: Odoo geliştiricileri Türkiye dâhil piyasada bulunabilir. ERPNext dev havuzu daha dar.

## Red edilenler

- **ERPNext:** Restoran zayıf, GPL daha sıkı.
- **Yol C (sıfırdan):** Zaman-risk profili kabul edilmez.
- **Yol A (ayrı servis):** `MODULE_DESIGN.md`'deki gibi Odoo'nun içinde oturmak hem operasyonel hem UX anlamında daha tutarlı. Gateway zaten thin BFF.

## Sonuçlar

- Python + Odoo ekosistemini öğrenme yatırımı gerekiyor (stack split: TS frontend, Python backend).
- Odoo'nun opinionated yapısı bazı HashTap akışlarıyla sürtüşebilir; "monkey-patch yasak, modül içinde çöz" disiplini şart.
- TR lokalizasyonu (e-Arşiv, KDV beyanı, iyzico) için kendi modüllerimizle tamamlayacağız — OCA'nın mevcut modülleri yeterli değil.
- Odoo 17 destek süresi 2027 yılına kadar güvenli; 18 geldikten sonra upgrade planı (ADR-0010).

## Değerlendirme kriterleri (ileride review için)

Aşağıdaki göstergeler 6 ay sonra review'da değerlendirilir:
- Module geliştirme hızı: 1 yeni feature ortalama kaç gün?
- Odoo upstream upgrade acısı: major version geçişlerinde bizim modülümüz uyumunu koruyor mu?
- Performans: Odoo request latency PWA için kabul edilebilir mi?
- Toplam operasyonel maliyet vs kazanılan "ERP bedava" değeri.

Review'da kriterler kırmızıya düşerse, bu ADR revize edilir.
