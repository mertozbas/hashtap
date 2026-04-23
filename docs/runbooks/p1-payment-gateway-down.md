# P1 — iyzico ödeme gateway'i yanıt vermiyor

**Seviye:** P1
**SLA:** 30 dk ilk müdahale, 4 saat çözüm hedefi.

## Özet

Restoranda kart ödeme başarısız oluyor. Nakit satış devam ediyor ancak
müşteri kart kullanamıyor. iyzico'da kesinti veya bizim entegrasyon
tarafında hata olabilir.

## Tespit işaretleri

- Monitoring: `metrics_24h.payment_success_rate < 0.95`.
- Gateway log'u: `iyzico timeout`, `5xx`, veya `subMerchant_not_found`.
- Restoran: "kart geçmiyor" şikâyeti.

## Adımlar

### 1. iyzico tarafı mı, bizim tarafımız mı?

```bash
# Status sayfası
curl -sI https://status.iyzipay.com

# iyzico sandbox health test
curl -sI https://sandbox-api.iyzipay.com/ping
```

- iyzico genel kesinti → restoranlara toplu WhatsApp bildirim + iyzico
  çözümünü bekle. Durum sayfasını paylaş.

### 2. Kendi gateway'imiz tarafı

```bash
ssh hashtap-ops@restaurant-<slug>
cd /opt/hashtap
docker compose logs gateway --tail=200 | grep -iE "iyzico|payment"
```

Sık hatalar:

**API key bozuk / yanlış subMerchant:**
```bash
cat /opt/hashtap/.env | grep -E "IYZICO|SUBMERCHANT"
# key'leri HashTap KMS'ten kontrol et, gerekirse rotate + restart
docker compose restart gateway
```

**Rate limit (yüksek hacim):**
- iyzico dashboard'dan restoran işlem hacmine bak, limit artırımı talep
  et.

**Network (restoran internet sorunu):**
```bash
docker compose exec gateway curl -sI https://api.iyzipay.com
# DNS / TLS / bağlantı hataları → restoran ağı
```

### 3. Geçici çözüm — nakit / QR banka

- Restorana WhatsApp: "kart 1 saat içinde düzelecek; bu arada nakit /
  QR banka kabul edelim".
- Müşteri PWA'da "kart ödeme geçici olarak kapalı" banner göster
  (feature flag: `payments.card_enabled = false`).

```bash
docker compose exec odoo odoo shell -d hashtap -c "
env['ir.config_parameter'].sudo().set_param('hashtap.card_enabled', 'False')
env.cr.commit()
"
```

### 4. Doğrulama

```bash
# Test işlem (sandbox)
curl -X POST https://restaurant-<slug>.hashtap.app/v1/payments/test

# Gerçek küçük tutar (5-10 TL) deneyin, iptal + iade ile temizleyin
```

- payment_success_rate 5 dakika içinde %95 üstüne dönmeli.

## Eskalasyon kriterleri

- 1 saat'te kök neden tespit edilemediyse → ikinci on-call + iyzico
  destek bilet.
- Kart ödeme 4 saat'ten fazla down kalırsa → müşteri finansal etki ciddi,
  kurucuya bildir.
- Birden fazla restoranı aynı anda etkiliyorsa → acil kitle
  iletişim + iyzico escalation.

## Doğrulama

- [ ] Gateway log'da son 5 dakikada iyzico 200 yanıtı var
- [ ] Test işlem (küçük tutar) başarılı
- [ ] payment_success_rate > %95
- [ ] Feature flag eski haline alındı (`card_enabled=True`)
- [ ] Restoran "ödeme düzeldi" onayı verdi
- [ ] Postmortem açıldı
