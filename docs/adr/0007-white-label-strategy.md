# ADR-0007 — White-label yaklaşımı

- Durum: kabul
- Tarih: 2026-04-20
- İlgili: ADR-0004, ADR-0005, `WHITE_LABEL.md`

## Bağlam

HashTap müşteriye "HashTap POS" diye satılacak. Müşteri arkadaki Odoo'yu görmemeli — hem marka tutarlılığı hem pazarlama gücü için.

Soru: Odoo markasını görünmez yapmak için ne kadar kod/kaynak değişikliği şart?

## Seçenekler

### (A) Hiç değiştirme, Odoo markasını olduğu gibi bırak
Reddedilir. "HashTap POS" iddiası boşa çıkar.

### (B) Kaynak dosyalarındaki her "Odoo" kelimesini bul-değiştir
Reddedilir. Hem ADR-0005'e (core'a dokunmama) aykırı hem gereksiz. Kaynak dosyalardaki `# Copyright 2019-2024 Odoo S.A.` header'ları LGPL gerekli kılıyor — zaten kimse görmez.

### (C) Görünen her yerde override, kaynakta dokunma
Seçilen yol. `hashtap_theme` modülünde:
- Logo, renk paleti, favicon.
- Login ekranı, app switcher, üst bar.
- E-posta şablonları.
- PDF raporları header/footer.
- Tarayıcı sekme başlığı.
- Hata sayfaları.
- Help menüsü ("Odoo Hakkında" yerine "HashTap Hakkında").

Detaylı liste: `WHITE_LABEL.md` §3.

## Lisans sınırları (LGPLv3)

LGPL white-label'a izin verir. Spesifik:
- **Odoo logosunu kaldırabilirsin** (Odoo Enterprise'da yasak, CE'de değil).
- **"Powered by Odoo" footer'ını kaldırabilirsin.**
- **Kaynak kodundaki copyright header'ları kaldıramazsın** — ama son kullanıcı onları hiç görmez.
- **Kendi modülünü LGPL altında yayınlamak zorunda değilsin** eğer modifiye edilmiş Odoo kodu dağıtmıyorsan. Biz SaaS olduğumuz için "dağıtım" klasik anlamda yok; yine de kendi modüllerimizi LGPL altında tutacağız (etik ve basitlik).

## Karar

**Seçenek C — UI katmanında tam white-label, core değişmez.**

Uygulama detayı `WHITE_LABEL.md`. Bu ADR sadece stratejik kararı belgeler.

## Prensipler

1. Müşteri Odoo kelimesini **hiçbir yerde** görmemeli.
2. Kaynak kodundaki copyright header'ları dokunulmaz (LGPL).
3. Odoo'nun mobil uygulamasından login engellenemez — kullanıcı eğitiminde PWA yönlendirilir.
4. Odoo developer mode (`?debug=1`) opsiyonu iç kullanım için açık kalır; son kullanıcı bunu erişmiyor (ek ortamda kilit).

## Sonuçlar

- `hashtap_theme` modülünün bakımı her Odoo major upgrade'inde güncellenmek zorunda. Odoo'nun UI template'leri değişebilir.
- Manuel checklist (`WHITE_LABEL.md` §5) her release sonrası koşulur.
- Uzun vadede: Playwright ile ekran görüntüsü snapshot test — regresyonu otomatik yakala.

## Review kriterleri

- Her Odoo major upgrade sonrası white-label checklist kaç madde kırmızı? Hedef: 0.
- Kullanıcıdan "Odoo görünüyor" şikayeti geldi mi?
