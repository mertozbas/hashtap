# Güvenlik & Uyumluluk

Bu doküman HashTap'in güvenlik ve yasal uyum pozisyonunu tanımlar: KVKK, PCI kapsamı, kimlik doğrulama, yetkilendirme, secret yönetimi, loglama. "Ne yapıyoruz, ne yapmıyoruz, niye".

## 1. Tehdit modeli — özet

### 1.1 Saldırgan profili
- **Dış:** İnternet'te random botlar (SQL inject, brute force, DDoS), fırsatçı fraudster'lar (kart testi).
- **Yarı-dış:** Rakip restoran veya kötü niyetli bir yatırımcı bir kiracının verisine erişmeye çalışabilir.
- **İç-çalışan:** HashTap ekibinden bir geliştiricinin kazara veya kasten prod verisine erişmesi.
- **Kiracı-iç:** Bir restoran personeli kendi yetkisinden fazlasına erişmeye çalışabilir.

### 1.2 Kritik varlıklar
1. **Ödeme bilgisi** — kartın tam PAN'ı sistemimize girmez (iyzico checkout form). Saklanan sadece last4 + token.
2. **Müşteri PII** — telefon (opsiyonel), isim (opsiyonel) fiş için.
3. **Kiracı iş verisi** — menü, fiyat, sipariş, ciro.
4. **Kiracı kimlik/mali belge** — vergi no, IBAN (iyzico onboarding).
5. **HashTap master secret'lar** — iyzico API key, Odoo master password.

### 1.3 En önemli hasarlar
- PCI ihlali (kart verisi sızıntısı) → ticari ölüm + yasal.
- Kiracı-arası veri sızıntısı → güven kaybı + KVKK cezası.
- iyzico master secret sızıntısı → tüm kiracıların hesabından para transferi riski.

## 2. KVKK uyumu

### 2.1 Veri sorumlusu / işleyen rolleri
- HashTap her kiracı adına **veri işleyen**. Veri sorumlusu = restoran.
- Sözleşmede (kiracı onboarding) bu rol netleştirilir. DPA (Data Processing Agreement) imzalanır.

### 2.2 Veri envanteri (özet)

| Veri | Sorumlu | Saklama süresi | Neden |
|---|---|---|---|
| Müşteri telefonu (QR akışı, opsiyonel) | Kiracı | Sipariş sonrası 6 ay | Servis sonrası bildirim/iade |
| Müşteri adı (fatura için) | Kiracı | 10 yıl | VUK (vergi) gereği |
| Müşteri VKN/TCKN (B2B fiş) | Kiracı | 10 yıl | VUK |
| Sipariş detayları | Kiracı | 10 yıl | VUK |
| Kart PAN | — | Saklanmaz | PCI |
| Kart last4 + token | Kiracı | 10 yıl (fiş logu) | Vergi kaydı |
| Restoran çalışan bilgileri | Kiracı | İstihdam süresi + 10 yıl | iş hukuku |
| HashTap ekibi hesap bilgileri | HashTap | İlişki süresi + 5 yıl | KVKK default |

### 2.3 Aktarım
- Hetzner Almanya DC — yurt dışı aktarım. Müşteri açık rıza ile (onboarding sözleşmesi içinde) + sözleşmesel güvence (Standard Contractual Clauses benzeri).
- iyzico — ödeme için zorunlu aktarım (yurt içi).
- e-Arşiv sağlayıcısı — fiş için zorunlu aktarım (yurt içi, GİB'e gider).

### 2.4 İhlal prosedürü
KVKK veri ihlalini 72 saat içinde Kurul'a bildirme zorunluluğu var. Runbook:
1. Tespit → on-call ekip hemen haberdar olur.
2. Kapsam tespiti: hangi kiracılar, hangi veri, kaç kişi.
3. 24 saat içinde ilgili kiracılara yazılı bildirim.
4. 72 saat içinde KVKK Kurulu bildirim.
5. Post-mortem + düzeltici aksiyonlar.

### 2.5 Veri ihracı ve silme
- Kiracı talebi: "verimi ver" → Odoo backup API + filestore arşiv → indirilebilir zip.
- Kiracı talebi: "verimi sil" → offboard akışı (`MULTI_TENANCY.md` §3.4). Vergi mevzuatı (VUK 10 yıl) KVKK'ya üstündür — sipariş/fiş verisi süresi dolana kadar silinemez, kiracıya açıklanır.
- Bireysel müşteri talebi ("benim telefonumu silin") → `res.partner` kaydını anonimleştir. Fiş verisi saklanır ama PII redacted.

## 3. PCI DSS kapsamı

### 3.1 Kart verisiyle ilişkimiz
- **Tam PAN, CVV, expiry** HashTap sunucularına hiç girmez.
- PWA → iyzico Checkout Form: kart bilgisi iyzico domain'inde girilir (iframe veya redirect).
- Geri dönen bilgi: last4, token, brand (Visa/Master), taksit seçeneği.

### 3.2 SAQ sınıfı
- **SAQ-A** kapsamında olmalıyız (outsourced e-commerce — merchant hiç kart verisine dokunmuyor).
- SAQ-A-EP (merchant sayfası üzerinden kart toplanıyor ama iyzico'ya gidiyor) kapsamına düşmemek için iyzico Checkout Form zorunlu. Embedded form veya custom input yasak.

### 3.3 Doğrulama
- iyzico'dan "PCI DSS compliant provider" belgesi temin edilir ve sözleşmeye eklenir.
- Dahili audit: yılda 1 kez kod tabanı taraması — kart verisi kalıntısı var mı.

## 4. Kimlik doğrulama (authentication)

### 4.1 Restoran yöneticisi / personeli (Odoo panel)
- Odoo'nun native auth (kullanıcı + şifre + opsiyonel 2FA).
- **2FA zorunlu** admin rolü için. `auth_totp` modülü aktif.
- Şifre politikası: min 12 karakter, karışık. Password rotation zorunlu değil (NIST 2017+).
- SSO (Google Workspace) — faz 2 opsiyonu.

### 4.2 Müşteri PWA
- **Auth yok.** QR'dan türeyen kısa ömürlü session token. Müşteri hesap açmaz.
- Sipariş sonrası access_token ile durum sorgulanır (24 saat TTL).
- Gerçek kimlik doğrulama yok — müşteri "anonim" (veya opsiyonel telefonla).

### 4.3 HashTap ekibi (admin / iç)
- Master password (Odoo DB yönetimi) — vault'ta, rotasyon ayda 1.
- Tenant admin API (gateway) — her HashTap ekibi üyesi JWT, rol bazlı.
- 2FA zorunlu.
- Prod sunucu SSH: sadece anahtar, şifresiz.

## 5. Yetkilendirme (authorization)

### 5.1 Odoo rol sistemi
- `hashtap.group_manager` — restoran her şeyi.
- `hashtap.group_staff` — sipariş + masa görüntüleme, durum güncelleme.
- `hashtap.group_kitchen` — mutfak ekranı (sadece hazırla/hazır).
- `hashtap.group_readonly_analytics` — raporlar.

Detay: `MODULE_DESIGN.md` §7.

### 5.2 Record rules
- Kullanıcı **sadece kendi şirketinin** kayıtlarını görür (Odoo default company rule).
- Çoklu şube desteği geldiğinde (faz 7+): şube bazlı record rule.

### 5.3 Gateway RBAC
- Admin API (tenant create/suspend) — sadece HashTap ekibi.
- Public API (PWA) — tenant-scoped; başka kiracıya crosssover yok.
- Webhook (iyzico, e-Arşiv) — IP whitelist + imza doğrulama.

## 6. Secret yönetimi

Detay: `DEPLOYMENT.md` §7.

### 6.1 Saklama katmanları
- **Source code:** asla. `.env.example` sadece dummy değerler.
- **Repo:** `.env.prod` git-crypt ile şifreli veya hiç commit'lenmez (S3 secret).
- **Sunucu:** 600 izinli dosya; systemd environment.
- **Odoo DB:** `ir.config_parameter` encrypted-at-rest (postgres tde veya Odoo encrypt_util).

### 6.2 Rotasyon
- iyzico API key: yılda 1 (veya şüphe durumunda).
- Odoo master password: ayda 1.
- JWT signing key: 6 ayda 1 (graceful rotation, iki key arasında geçiş).
- Postgres admin şifresi: 6 ayda 1.

### 6.3 Paylaşım
- HashTap ekibi arasında paylaşım: 1Password / Bitwarden tipi vault.
- SSH / prod erişim anahtarları: kişi başına, kayıtlı.

## 7. Ağ güvenliği

### 7.1 TLS
- Tüm dış trafik TLS 1.2+, prefer 1.3.
- HSTS on (`max-age=31536000; includeSubDomains`).
- TLS 1.0/1.1 kapalı.

### 7.2 Firewall
- Gateway VPC: sadece 80/443 dışarı açık. İç trafik (gateway ↔ Odoo, Odoo ↔ Postgres) private network.
- SSH: sadece bastion host, IP whitelist.
- Postgres: sadece iç network; public internet asla.

### 7.3 Rate limiting
- Gateway (her PWA IP'si): 60 req/dk (okuma), 10 req/dk (yazma).
- Tenant başı: 1000 req/dk agregat.
- Aşım → 429.

### 7.4 DDoS
- Cloudflare proxy. L3/L4 DDoS otomatik mitigate.
- Uygulama seviyesi (L7) botlar — Cloudflare rate limit rules + HashTap gateway rate limit.

## 8. Input validation

### 8.1 PWA'dan gelen veri
- Zod şemaları (`packages/shared`).
- Gateway kenarda valide eder; invalid → 400.
- Odoo controller yine valide eder (defense in depth).

### 8.2 SQL injection
- ORM (Odoo, Drizzle gateway'de) parametrize eder. Ham SQL yazıldığı nadir durumlarda (raporlama) parametreler `%s` ile geçilir; string interpolation yasak.

### 8.3 XSS
- PWA React — `dangerouslySetInnerHTML` yasak (lint kural).
- Odoo QWeb template'leri otomatik escape eder.

### 8.4 CSRF
- Gateway: SameSite cookie + origin check.
- Odoo: native CSRF protection; public controller'larda JSON-RPC imza ile korunur.

## 9. Bağımlılık yönetimi

- `npm audit` her CI'da koşar.
- Python için `pip-audit`.
- Dependabot açık, patch/minor sürümleri otomatik PR.
- Major upgrade manuel.

## 10. Log ve audit

### 10.1 Log içeriği
- Her istek: method, path, status, latency, user_id (varsa), tenant_id.
- Yasak: kart PAN, CVV, şifre, tam telefon numarası (hash'li OK).
- PII: e-posta maskelenir (`a****@example.com`).

### 10.2 Saklama
- Uygulama log'ları: 90 gün (S3 cold).
- Audit log (Odoo chatter): kalıcı.
- Vergi ilişkili log (sipariş, fiş): 10 yıl.

### 10.3 Audit trail
- Odoo `mail.thread` ile kritik model değişiklikleri loglanır (fiyat değişikliği, user permission değişikliği).
- Admin paneli aksiyonları (HashTap ekibi): `tenant_events` tablosu (`MULTI_TENANCY.md` §4).

## 11. Fiziksel güvenlik

- Bulut sağlayıcıya delege (Hetzner ISO 27001).
- Print-bridge (restoranda Pi) fiziksel erişim: restoranın sorumluluğunda. Ajan token'ı compromised olursa iptal + yeniden kurulum.

## 12. Penetrasyon testi

- MVP öncesi: ücretsiz / açık kaynak araçlarla (OWASP ZAP, Burp Community) kendi iç test.
- MVP sonrası ilk 6 ayda: profesyonel pentest (dış firma).
- Her pentest sonrası bulgular triage + public-trust affecting olanlar 30 günde çözülür.

## 13. Sosyal mühendislik

- Kiracı desteği: şifre sıfırlama sadece doğrulanmış e-posta + telefon üzerinden.
- HashTap ekibi arası secret paylaşımı: sadece vault, asla email/mesaj.
- Phishing savunması: kurumsal mail'de DMARC, SPF, DKIM.

## 14. Felaket senaryosu

| Senaryo | Tepki |
|---|---|
| Master password sızdı | Tüm kiracılara acil duyuru, password rotate, şüpheli işlemleri iste geçmişten doğrula |
| iyzico master key sızdı | iyzico'ya anında bildir, rotate. Arada yapılan işlemleri 48 saat içinde audit |
| Tek kiracının verisi başka kiracıya sızdı | 72 saat KVKK, etkilenen kiracılara bireysel bildirim, root cause analizi |
| Tüm Postgres silindi | DR restore — hedef RTO 4 saat, RPO 15 dk (WAL archive) |
| Pi (print-bridge) çalındı | Token iptal, kiracıya yeni Pi kurulum, kısa süreli fiş = e-posta/PDF mod |

## 15. Açık konular

- DPO (Data Protection Officer) atanması: ölçek büyüdüğünde şart — muhtemelen dış danışman.
- Penetrasyon test firması seçimi.
- KVKK veri envanteri resmi belgesi (VERBIS kaydı) — MVP sonrası ama yasal zorunluluk.
- Sigorta: Siber sorumluluk poliçesi araştırılmalı (ölçek büyüdüğünde).
