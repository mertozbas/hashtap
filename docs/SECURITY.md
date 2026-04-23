# Güvenlik & Uyumluluk

Bu doküman HashTap'in güvenlik ve yasal uyum pozisyonunu tanımlar:
KVKK, PCI kapsamı, kimlik doğrulama, yetkilendirme, secret yönetimi,
loglama. "Ne yapıyoruz, ne yapmıyoruz, niye".

On-premise tek-kiracı dağıtım modeline (ADR-0011) göre yazılmıştır.

Son güncelleme: 2026-04-23.

## 1. Tehdit modeli — özet

### 1.1 Saldırgan profili

- **Dış (internet):** İnternet'te random botlar (SQL inject, brute force,
  kart testi fraud'ları). HashTap kurulumunun ana saldırı yüzeyi
  Cloudflare Tunnel üzerinden gelen müşteri PWA trafiği + iyzico/Foriba
  webhook'ları. Port forwarding yok.
- **Yerel ağ (restoran Wi-Fi'si):** Restoran müşterisi Wi-Fi'ye bağlandığında
  Cashier / Waiter / KDS ekranlarına ulaşabilir. Bu yüzden staff
  uygulamalar kimlik doğrulamalı; admin paneli firewall ile LAN-internal.
- **İç-çalışan (HashTap):** Destek mühendisinin Tailscale üzerinden yaptığı
  SSH erişimleri loglanır, müşteri onayına bağlanır.
- **Restoran-iç çalışan:** Garson/mutfak çalışanı kendi rolünün ötesine
  geçemez (Odoo RBAC + `hashtap.group_*`).
- **Fiziksel:** Kasa PC'si çalınırsa disk şifreli (LUKS/BitLocker) olmalı.

### 1.2 Kritik varlıklar

1. **Ödeme bilgisi** — kartın tam PAN'ı sisteme girmez (iyzico Checkout
   Form PCI SAQ-A). Saklanan: last4 + token.
2. **Müşteri PII** — telefon (opsiyonel), isim (B2B fişlerde).
3. **Restoran iş verisi** — menü, fiyat, sipariş, ciro.
4. **Restoran kimlik / mali belge** — vergi no, IBAN (iyzico onboarding).
5. **HashTap ops secret'ları** — iyzico API key (per-restoran),
   Tailscale ACL, Docker Registry credentials, restic şifreleri.

### 1.3 En önemli hasarlar

- PCI ihlali (kart verisi sızıntısı) → ticari ölüm + yasal.
- Bir restoranın verisinin başka tarafa sızması → KVKK cezası + güven.
- HashTap ops VPN'inin (Tailscale) ele geçirilmesi → tüm kurulumlara
  uzaktan erişim.
- Restoran PC'sinin fiziksel çalınması / disk imajının sızması → o
  restoranın verisi.

## 2. KVKK uyumu

### 2.1 Veri sorumlusu / işleyen rolleri

- **Restoran = veri sorumlusu** (müşterisinin verisini toplayan).
- **HashTap = veri işleyen** (yedekleme, uzaktan destek, güncelleme
  kapsamında veriye ulaşabilir).
- Sözleşmede DPA (Data Processing Agreement) imzalanır.
- Veri fiziksel olarak **restoranın kendi donanımında** durur — bu
  KVKK açısından restoran için büyük avantaj.

### 2.2 Veri envanteri (özet)

| Veri | Sorumlu | Saklama süresi | Neden |
|---|---|---|---|
| Müşteri telefonu (QR akışı, opsiyonel) | Restoran | Sipariş sonrası 6 ay | Servis sonrası bildirim |
| Müşteri adı (B2B fatura için) | Restoran | 10 yıl | VUK (vergi) |
| Müşteri VKN/TCKN (B2B fiş) | Restoran | 10 yıl | VUK |
| Sipariş detayları | Restoran | 10 yıl | VUK |
| Kart PAN | — | Saklanmaz | PCI |
| Kart last4 + token | Restoran | 10 yıl | Vergi kaydı |
| Restoran çalışan bilgileri | Restoran | İstihdam + 10 yıl | iş hukuku |
| Yedekleme ciphertext'i | HashTap ops (B2) | 1 yıl (retention) | DR |
| Uzaktan erişim log'ları | HashTap ops | 1 yıl | audit |

### 2.3 Veri aktarımı

- **Müşteri verisi restoranın PC'sinde.** Yurt dışı aktarım yok (default).
- **Yedekleme:** şifreli ciphertext Backblaze B2 (EU-Central). Anahtar
  HashTap KMS'te + restoran zarfında; B2 içeriği göremez.
- **iyzico:** ödeme için zorunlu aktarım (yurt içi).
- **e-Arşiv sağlayıcısı:** fiş için zorunlu aktarım (yurt içi, GİB'e).
- **HashTap monitoring:** sadece metrik (müşteri verisi yok); yurt dışı
  sayılmaz (anonim telemetri).

### 2.4 İhlal prosedürü

KVKK veri ihlalini 72 saat içinde Kurul'a bildirme zorunluluğu var.
Runbook:
1. Tespit → HashTap on-call hemen haberdar olur.
2. Kapsam tespiti: hangi restoranlar, hangi veri.
3. 24 saat içinde etkilenen restoran sahiplerine yazılı bildirim.
4. 72 saat içinde KVKK Kurulu bildirim (restoran yapar, HashTap yardımcı).
5. Post-mortem + düzeltici aksiyon.

### 2.5 Veri ihracı ve silme

- Restoran talebi "verimi ver" → Odoo native export + filestore arşiv →
  zip (restoran sahibi admin panelinden indirir).
- Restoran sözleşmeyi iptal etti → HashTap veri işleme sona erer; yedek
  retention'ına göre silinir (1 yıl sonra bulut'tan da düşer).
- Vergi mevzuatı (VUK 10 yıl) KVKK'ya üstündür — sipariş/fiş verisi
  süresi dolana kadar restoran tarafında saklanır.
- Bireysel müşteri talebi ("benim telefonumu silin") → restoran
  `res.partner` kaydını anonimleştirir. Fiş verisi saklanır ama PII
  redacted.

## 3. PCI DSS kapsamı

### 3.1 Kart verisiyle ilişkimiz

- **Tam PAN, CVV, expiry** HashTap sistemine **hiç girmez**.
- Müşteri PWA → iyzico Checkout Form: kart bilgisi iyzico domain'inde
  girilir (iframe).
- Geri dönen bilgi: last4, token, brand, taksit.

### 3.2 SAQ sınıfı

- **SAQ-A** kapsamındayız (outsourced — HashTap kart verisine dokunmuyor).
- SAQ-A-EP'ye düşmemek için iyzico Checkout Form zorunlu. Kart input'unu
  HashTap'te render etmek yasak.

### 3.3 Doğrulama

- iyzico'dan "PCI DSS compliant provider" belgesi temin edilip sözleşmeye
  eklenir.
- Yıllık kod tabanı taraması: kart verisi kalıntısı var mı?

## 4. Kimlik doğrulama

### 4.1 Restoran yöneticisi / personeli (Odoo panel)

- Odoo native auth (kullanıcı + şifre + opsiyonel 2FA).
- **2FA zorunlu** manager rolü için. `auth_totp` modülü aktif.
- Şifre politikası: min 12 karakter. Rotation zorunlu değil (NIST 2017+).

### 4.2 Cashier + Waiter uygulamaları

- Kısa PIN (4 haneli) veya kullanıcı adı + şifre.
- Session token browser-side (Zustand store + localStorage), shift
  süresince geçerli.
- Idle timeout: 15 dk inaktivite → yeniden PIN.

### 4.3 Müşteri PWA

- **Auth yok.** QR'dan türeyen kısa ömürlü session token.
- Sipariş sonrası `order_access_token` ile durum sorgulanır (24 saat
  TTL).
- Gerçek kimlik yok — müşteri anonim (veya opsiyonel telefonla).

### 4.4 HashTap destek ekibi

- **Tailscale VPN** kimlik + ACL. Restoran PC'sine SSH.
- Her SSH oturumu loglanır + restoran onayına bağlanır (WhatsApp tek satır).
- Master secret'lar (kurulum token, yedekleme KMS) HashTap vault'ta
  (1Password / Bitwarden Teams), 2FA zorunlu.

## 5. Yetkilendirme

### 5.1 Odoo rolleri

- `hashtap.group_manager` — restoran sahibi, her şeye erişim.
- `hashtap.group_cashier` — kasa yönetimi, ödeme, rapor.
- `hashtap.group_staff` — garson, sipariş görüntüleme ve güncelleme.
- `hashtap.group_kitchen` — mutfak, sadece KDS aksiyonları.
- `hashtap.group_readonly_analytics` — muhasebeci, sadece rapor.

Detay: `MODULE_DESIGN.md` §7.

### 5.2 Record rules

- Kullanıcı sadece kendi restoranının kayıtlarını görür (tek kiracı ortamda
  zaten tek şirket, ama Odoo rules yine de savunma derinliği için açık).
- Çoklu şube desteği gelince (faz 11+) şube bazlı record rule eklenir.

### 5.3 Gateway RBAC

- Public API (PWA) — order access token ile sınırlı (sadece kendi
  siparişini sorgulayabilir).
- Staff API (Cashier + Waiter) — Odoo kullanıcısı + scope.
- Webhook (iyzico, e-Arşiv) — IP whitelist + HMAC imza doğrulama.

## 6. Secret yönetimi

### 6.1 Saklama katmanları

- **Source code:** asla. `.env.example` sadece dummy değerler.
- **Repo:** `.env` git'e düşmez (`.gitignore`'da).
- **Kurulum:** `.env` dosyası kasa PC'sinde `/opt/hashtap/.env`, root:700.
- **Odoo DB:** `ir.config_parameter` encrypted-at-rest.
- **HashTap ops KMS:** yedekleme şifreleri, Tailscale auth key.
- **Restoran kasası:** yedekleme şifre kopyası kapalı zarfta
  (dual-custody).

### 6.2 Rotasyon

- iyzico API key: yılda 1 (veya şüphe durumunda).
- JWT signing key: 6 ayda 1 (graceful rotation).
- Tailscale auth key: 90 günde 1 (cihaz başına yenileme).
- Restic password: değiştirilmez (repo'nun içindedir); kaybedilmez.

### 6.3 Paylaşım

- HashTap ekibi arası: 1Password / Bitwarden Teams vault, 2FA zorunlu.
- SSH prod erişim anahtarları: kişi-başı, merkezi audit.
- Müşteri kurulum secret'larını asla mail/mesajla paylaşma — kurulum
  sonrası restoranın kasasında fiziksel zarf.

## 7. Ağ güvenliği

### 7.1 TLS

- **Public yüzey** (Cloudflare Tunnel üzerinden `qr.<slug>.hashtap.app`):
  Cloudflare yönetir, TLS 1.2+.
- **Yerel yüzey** (`*.hashtap.local`): Caddy yerel CA + `mkcert`, tablet
  ve ekranlara root CA kuruluş sırasında güvenilir olarak eklenir.
- HSTS on public domain'de.

### 7.2 Firewall

- Restoran PC'sinde (ufw / Windows Firewall):
  - Inbound: 80, 443 (Caddy) sadece LAN'dan; 8069 (Odoo) sadece LAN'dan.
  - Inbound internet'ten: hiçbir şey. Port forwarding yok.
  - Outbound: 443 (iyzico, Foriba, Cloudflare, HashTap ops, Docker
    registry), Tailscale 41641 UDP.
- Postgres: sadece container internal network, host'a hiç expose
  edilmez.

### 7.3 Rate limiting

- Gateway (PWA IP başı): 60 req/dk (okuma), 10 req/dk (yazma).
- Aşım → 429.
- Staff endpoint'leri: daha gevşek (personel tarafı).

### 7.4 DDoS

- Cloudflare Tunnel zaten Cloudflare proxy'nin arkasında. L3/L4 otomatik
  mitigate.
- Yerel yüzey zaten public değil — DDoS vektörü yok.

## 8. Input validation

### 8.1 PWA / Cashier / Waiter'dan gelen veri

- Zod şemaları (`packages/shared`).
- Gateway kenarda valide eder; invalid → 400.
- Odoo controller yine valide eder (defense in depth).
- **Fiyat hesabı her zaman sunucu tarafında** — client'tan gelen total
  asla güvenilir değil.

### 8.2 SQL injection

- ORM (Odoo, gateway'de Prisma/Drizzle) parametrize eder.
- Ham SQL yazıldığı nadir durumlarda parametreler `%s` ile;
  string interpolation yasak (lint kuralı).

### 8.3 XSS

- React `dangerouslySetInnerHTML` yasak (ESLint).
- Odoo QWeb template'leri otomatik escape eder.

### 8.4 CSRF

- Gateway: SameSite cookie + origin check.
- Odoo: native CSRF protection; public controller'larda JSON-RPC imza
  ile korunur.

## 9. Bağımlılık yönetimi

- `npm audit` her CI'da koşar.
- Python için `pip-audit`.
- Dependabot açık, patch/minor sürümleri otomatik PR.
- Major upgrade manuel.

## 10. Log ve audit

### 10.1 Log içeriği

- Her istek: method, path, status, latency, user_id (varsa).
- **Yasak:** kart PAN, CVV, şifre, tam telefon (hash OK).
- PII: e-posta maskelenir (`a****@example.com`).

### 10.2 Saklama

- Uygulama log'ları: 14 gün (docker log rotation).
- Audit log (Odoo chatter): kalıcı (DB içinde).
- Vergi ilişkili log (sipariş, fiş): 10 yıl.
- HashTap ops remote-access log: 1 yıl.

### 10.3 Audit trail

- Odoo `mail.thread` — kritik model değişiklikleri loglanır (fiyat,
  kullanıcı yetkisi, iade).
- HashTap SSH erişimleri → `/var/log/hashtap/remote-access.log` →
  merkezi ops log'a senkron.

## 11. Fiziksel güvenlik

- **Restoran PC'si:** disk şifreleme (LUKS Linux'ta, BitLocker Windows'ta)
  installer tarafından önerilir/kurulur.
- **Yedek zarfı:** restoran sahibine teslim edilen yedekleme şifresi
  zarfı güvenli yerde saklanmalı (kasa vs).
- **Tailscale anahtarı:** cihaz başı, cihaz kaybolursa iptal.
- **HashTap ops VPS:** Hetzner ISO 27001 (DC fiziksel güvenlik).

## 12. Penetrasyon testi

- MVP öncesi: açık kaynak araçlarla (OWASP ZAP, Burp Community) iç test.
- Pilot sonrası ilk 6 ayda: profesyonel pentest.
- Her pentest sonrası bulgular triage; public-trust affecting olanlar
  30 günde çözülür.

## 13. Sosyal mühendislik

- Restoran sahibine şifre sıfırlama: sadece doğrulanmış e-posta + telefon.
- HashTap ekibi arası secret paylaşımı: sadece vault, asla e-mail/mesaj.
- Phishing savunması: kurumsal mail'de DMARC, SPF, DKIM.

## 14. Felaket senaryoları

| Senaryo | Tepki |
|---|---|
| Bir restoran PC'si çalındı | Tailscale node iptal, diskin şifreli olup olmadığı kontrol (LUKS), restoran bilgilendir, sigorta |
| Restoran diski öldü | `OPERATIONS.md` §5.4 runbook — yedekten restore, yeni PC'ye, 4 saat RTO |
| Tailscale ops kontrol düzlemi ele geçirildi | Tüm auth key'leri iptal, restoran sahiplerine acil duyuru, kurulumları re-enroll |
| HashTap KMS (yedek şifreleri) ele geçirildi | Tüm yedek şifrelerini rotate (yeni repo init), restoran zarflarını güncelle |
| iyzico master key sızdı | iyzico'ya anında bildir, rotate, arada yapılan işlemleri audit |
| Tüm restoran yedekleri silindi (B2 hesap kapandı) | Alternatif sağlayıcıya geç (S3, Wasabi), retention'dan dolayı en kötü 1 gün veri kaybı |

## 15. Açık konular

- **DPO (Data Protection Officer):** Ölçek büyüdüğünde şart — dış danışman.
- **VERBIS kaydı:** KVKK yasal zorunluluk — pilot sonrası.
- **Siber sorumluluk sigortası:** 50+ kurulum öncesi araştırılmalı.
- **Restoran disk şifrelemesi zorunlu mu?** MVP'de önerilir (installer
  teklif eder); çoğu restoran "evet" der. Sözleşmede "şifrelemediyseniz
  veri kaybı riski sizdedir" notu.
