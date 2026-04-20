# ADR-0005 — Odoo core'una dokunmama, sadece modül

- Durum: kabul
- Tarih: 2026-04-20
- İlgili: ADR-0004, ADR-0007

## Bağlam

Odoo'yu taban olarak seçtikten sonra (ADR-0004) iki strateji tartışıldı:

1. **Core fork:** Odoo'nun kaynak kodunu indir, değiştir, "HashTap POS" olarak brandle.
2. **Modül + white-label:** Odoo core'una dokunma; tüm özelleştirmeleri `hashtap_pos` ve `hashtap_theme` modüllerinde tut. Müşteriye "HashTap POS" olarak sun.

## Alternatifler — derinleme

### Core fork (reddedildi)

**Artıları:**
- Her türlü özelleştirme mümkün (framework'ün izin verdiği sınırları aşabilirsin).
- Upstream değişikliklerinin takibini gevşetebilirsin.

**Eksileri:**
- **Upstream divergence kabusu:** Odoo yılda 1 major sürüm, sık güvenlik yamaları çıkarıyor. Her çıkanı merge etmek zorlaşır. 2-3 yıl sonra upstream'den o kadar uzaklaşırsın ki upgrade pratikte imkansız.
- **Güvenlik yamaları:** Odoo'nun yayınladığı her güvenlik yamasını kendin cherry-pick'lemek zorundasın. Kaçırılan bir tane = CVE.
- **Lisans yükü:** LGPLv3 fork'lanan core değişikliklerin açık kalmasını zorunlu kılar. Rekabet avantajı açısından sıkıntı.
- **Hire edilebilirlik:** "Odoo developer" geniş havuz, "HashTap-fork-of-Odoo developer" dar havuz.

### Modül + white-label (seçildi)

**Artıları:**
- Odoo'nun modül sistemi zaten %90+ özelleştirmeye izin veriyor. Yeni modeller, view'lar, controller'lar, override'lar, record rules — core'a dokunmadan.
- Upstream upgrade = `git pull odoo-17` + `pip upgrade`. Minör efor.
- Güvenlik yamaları bedava.
- Lisans temiz: modülümüz LGPL altında ama core değişikliği yok.
- Geliştirici işe alımı: "Odoo 17 developer" arıyoruz.

**Eksileri:**
- Odoo framework'ün opinionated yerleri ile sürtüşebiliriz; bazen ideal olmayan bir yöntemle çözmek zorunda kalabiliriz.
- `%100 özelleştirme` gerekli bir yere çarparsak zorlu: monkey-patch (runtime patching) seçeneği kalır, ama denetimli kullanılmalı.

## Karar

**Odoo core'una asla dokunma. Tüm değişiklikler modül katmanında.**

Hiyerarşi, en tercih edilenden:
1. Yeni model / yeni view / yeni controller / yeni iş akışı — `hashtap_pos`'ta temiz ekle.
2. Mevcut model/behavior'u genişlet — Odoo'nun `inherit` mekanizması.
3. Core logic override — Odoo'nun `_inherit` + super() pattern'i.
4. Monkey-patch — **sadece son çare.** ADR ile belgele, gerekçeyi yaz, tech debt olarak kaydet.
5. Core dosya düzenleme — **yasak.** ADR değişikliği olmadan yapılamaz.

## Özel durum: monkey-patch

Bazı durumlarda (Odoo'nun iç bir fonksiyonu bizim ihtiyacımızı karşılamıyor ve `_inherit` yolu açık değil) monkey-patch'e başvurmak gerekebilir. Kural:
- `hashtap_pos/patches/` dizini altında her patch ayrı dosya.
- Dosyanın başında yorumla: hangi Odoo fonksiyonu, neden patch gerekli, upstream'e PR açıldı mı.
- Her major Odoo upgrade'te bu dosyalar manuel review edilir.
- CI'da "patch kalıntısı" kontrol script'i — upstream fonksiyonun hash'i değişirse uyarı.

## Sonuç

- Odoo upstream'in yayınladığı her sürümü almak, merge savaşı çıkarmadan mümkün.
- `git log --oneline odoo/odoo-bin` (upstream'den) neyin ne olduğunu bize karıştırmaz — biz sadece kendi dosyalarımıza bakarız.
- İleride Odoo 17 → 18 geçişi sırasında `hashtap_pos` kodunun 17 → 18 migration'ı yazılır (Odoo'nun deprecation patterns'ini takip ederek); core kod değişikliği yok.
- "Bir şey Odoo'da olmalı ama yok" durumları için önce OCA'ya, sonra Odoo'ya upstream PR düşünülür — kendi patch'imizden önce.

## Değerlendirme (6 ay sonrası review)

- Kaç monkey-patch'e muhtacız? Eğer >3 ise, ADR-0005'in pratikte çöktüğünün işareti.
- Odoo 17 → 18 upgrade'i ne kadar sürdü? Hedef: <1 hafta.
