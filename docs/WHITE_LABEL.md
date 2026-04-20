# HashTap — White-Label Stratejisi

Bu doküman Odoo'nun markasının HashTap kullanıcılarına görünmemesi için uygulanan değişikliklerin tam listesini tanımlar. Kod değil, davranış ve override listesi. Uygulama `hashtap_theme` modülünde.

İlgili karar: `adr/0007-white-label-strategy.md`.

## 1. Hedef

Son kullanıcı (restoran sahibi, personeli) "HashTap POS kullanıyorum" der. "Odoo" kelimesi hiçbir ekranda, hiçbir e-postada, hiçbir hata mesajında görünmez. Kaynak dosyalarındaki copyright header'lar yerinde kalır (LGPL gerektiriyor) — geliştirici olmayan kimse onları görmez.

## 2. Hukuki çerçeve

- **Odoo Community LGPLv3.** Markanın kaldırılmasına izin verir (LGPL'de "branding lock" yoktur — Odoo Enterprise lisansında vardır, onu kullanmıyoruz).
- **Copyright header'lar** kaynak dosyalarda kalır. Bunu temizleyemeyiz.
- **"Powered by Odoo"** default footer'ı kaldırabiliriz; LGPL gerektirmiyor.
- **Odoo markası/logoları** tescil altındadır; modifiye edilmemiş dağıtımda kalır, bizim dağıtımımız modifiye edildiği için kullanmayabiliriz (kullanmayacağız).

## 3. Override listesi — kapsamlı

### 3.1 Login ekranı (`/web/login`)
- Logo: HashTap logosu.
- Arka plan: HashTap kurumsal görsel (koyu mavi + turuncu aksan).
- Başlık: "HashTap POS'a Giriş".
- "Powered by Odoo" footer: kaldır.
- "Sign in with Google" gibi SSO butonlarını ayarlardan toggle — MVP'de kapalı.

### 3.2 Veritabanı seçici (`/web/database/*`)
- Multi-DB seçici normalde burada görünür. Biz DB-per-tenant'la subdomain'den doğru DB'ye route ediyoruz; bu sayfa tamamen **gizli** olmalı (nginx'te engellenir + Odoo config `list_db=False`).
- Manager sayfası (`/web/database/manager`): master password ile erişilir; prod'da nginx'te IP whitelist. Müşterinin görmesine gerek yok.

### 3.3 App switcher (üst sol menü)
- Normalde "Discuss, CRM, Sales, Accounting..." ikonları.
- HashTap için: "HashTap POS", "Menü", "Stok", "Muhasebe", "Raporlar", "Ayarlar". Bu isimler Odoo modüllerinin kendisi değil; modüllerin görünen adları `ir.module.module`'de override edilir.
- HashTap'in sahibi olmadığı modüller (Discuss, Website vb) gizlenir — `ir.ui.menu`'den root'lar kaldırılır.

### 3.4 Üst bar (navbar)
- Odoo logosu yerine HashTap logosu.
- "Odoo Online", "Upgrade to Enterprise" gibi promosyon bağlantıları — CE'de zaten sınırlı, yine de `@api.model` override ile silinir.
- Kullanıcı menüsü: "Profilim, Oturumu Kapat" — "My Odoo.com Account" bağlantısı gizlenir.

### 3.5 E-posta şablonları
- Odoo'nun "Please update your browser..." gibi sistem mail'leri HashTap branded şablonlara override edilir.
- Varsayılan gönderen: `no-reply@hashtap.co`.
- Footer: HashTap adresi, telefon, destek maili.

### 3.6 Hata sayfaları
- 404, 500 ekranları kendi tasarımımız. Odoo stack trace son kullanıcıya gösterilmez — `debug=False` zorunlu.

### 3.7 PDF şablonları
- Fatura, fiş, rapor PDF'lerinin header/footer'ı HashTap branded.
- `report.internal.layout` template'i override edilir.

### 3.8 Windows title / tab
- Tarayıcı sekmesi başlığı: "HashTap POS — [current view]" (şu an "Odoo — [view]" gibi).
- Favicon HashTap.

### 3.9 About page
- `Help > About Odoo` linki kaldırılır. Yerine "HashTap Hakkında" — sürüm, destek iletişim.

### 3.10 Loading splash
- Odoo'nun mor "loading" spinner'ı HashTap paletine alınır.

### 3.11 Debug mode
- Odoo developer mode (`?debug=1`) kullanıcıya görünür bir şey eklemiyor — teknik ekip kullanır. Değiştirmiyoruz.

### 3.12 Error dialogs (Odoo web client)
- `UserError`, `ValidationError` modal'larının "Odoo" başlığı → "HashTap" başlığı.

### 3.13 Mobil Odoo uygulaması
- Odoo resmi mobil uygulaması App Store/Play Store'da duruyor ve oradan login olunabiliyor. Biz "bu mobil uygulamayı kullanmayın" diyoruz; müşteri eğitiminde açık.
- Engelleyemeyiz (genel IP'den bağlanıyor). Bir uyarı: Odoo mobil login başarılı olsa bile görece sıkıcı bir arayüz sunar, restoran personeli kendiliğinden PWA'yı tercih edecek.

## 4. Modüldeki davranışın haritası

`hashtap_theme` içindeki dosyalar ve ne override ettikleri:

```
hashtap_theme/
├── __manifest__.py
├── data/
│   ├── ir_config_parameter.xml    # web.base.title, login branding
│   └── mail_template_data.xml     # sistem mail'leri
├── views/
│   ├── webclient_templates.xml    # navbar, loading, favicon
│   ├── login_templates.xml        # /web/login override
│   ├── layout_templates.xml       # PDF layout
│   └── menu_cleanup.xml           # gereksiz root menüleri gizle
├── static/
│   ├── src/
│   │   ├── scss/
│   │   │   ├── _variables.scss    # renk paleti
│   │   │   └── overrides.scss     # component-level stil
│   │   └── img/
│   │       ├── logo.svg
│   │       ├── logo_small.svg
│   │       ├── favicon.ico
│   │       └── login_bg.jpg
│   └── description/
│       └── icon.png
└── security/
    └── ir.model.access.csv
```

## 5. Manuel kontrol listesi (test için)

Her major sürüm yükseltmesinden sonra aşağıdaki liste manuel koşulur. Otomasyon faz 3+ işi (Playwright snapshot test).

- [ ] `/` açıldı → HashTap logosu, "Odoo" yok.
- [ ] Login oldu → app switcher'da Odoo yazmayan sadece HashTap modülleri.
- [ ] Bir sipariş aç → PDF fiş HashTap branded.
- [ ] Şifremi unuttum e-postası → HashTap branded.
- [ ] 404 sayfası → HashTap branded.
- [ ] Help menüsü → "HashTap Hakkında" var, "About Odoo" yok.
- [ ] Favicon HashTap.
- [ ] Tarayıcı sekme başlığı HashTap ile başlıyor.
- [ ] HTML kaynağı: `<meta generator content="Odoo">` etiketi yok.
- [ ] Network tab: `/web/static/src/img/logo.png` isteği 404 değil (bizim logomuz).
- [ ] Hatalı URL → Odoo'nun debug sayfasına değil, bizim 500'e düşüyor.

## 6. Saklanmasında ısrar etmediğimiz yerler

- **Kaynak kodundaki copyright header'ları** — LGPL, kalır. Kimse görmez.
- **Odoo mobil uygulamasından login** — engellenemez. Eğitimde yönlendir.
- **İleri kullanıcı `?debug=1` ekleyip developer mode'u açarsa** görebilir. Son kullanıcı için endişe değil; developer mode'u kapalı tut.

## 7. Sürdürme

- Odoo major version upgrade'de (17 → 18) bu dokümanın §5'indeki kontrol listesi yeniden koşulur.
- Yeni modül eklendiğinde (örn faz 7'de OCA bir modül) o modülün brand'larını da temizle.
- Kullanıcı geri bildirimde "Odoo gördüm" derse — issue aç, yamala, kontrol listesine ekle.
