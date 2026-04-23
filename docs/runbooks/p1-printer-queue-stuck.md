# P1 — Print-bridge kuyruğu takıldı

**Seviye:** P1
**SLA:** 30 dk ilk müdahale, aynı iş günü çözüm.

## Özet

Yazıcıya iş gönderiliyor ama basılmıyor, siparişler mutfağa ulaşmıyor.
KDS çalışıyor olabilir fakat fiş/mutfak kupon yazdırma bloke.

## Tespit işaretleri

- `services.print_bridge != "healthy"` veya print-bridge log'unda
  `job_timeout`, `printer_offline`.
- Mutfak: "siparişler basılmıyor".
- Kasa: fiş basımı donuyor, kullanıcı iki kez bastı sanıyor.

## Adımlar

### 1. Teşhis

```bash
ssh hashtap-ops@restaurant-<slug>
cd /opt/hashtap
docker compose logs print-bridge --tail=200
docker compose exec print-bridge ls -la /var/spool/hashtap
```

Sık hatalar:

**Yazıcı güç/kablo:** restorana sor, yazıcı açık mı, USB/network kablosu
takılı mı, kağıt var mı.

**Printer IP değişmiş (DHCP):** router'dan cihazın IP'sini sabitle.

**Kuyruk tıkanmış (1000+ bekleyen job):**
```bash
# Kuyruğu temizle
docker compose exec print-bridge node scripts/flush-queue.js
```

**ESC/POS komut uyumsuzluğu:** yazıcı modeli değişmiş mi? `.env` içindeki
`PRINTER_MODEL` doğru mu?

### 2. Restart + sağlık kontrol

```bash
docker compose restart print-bridge
sleep 5
docker compose logs print-bridge --tail=50

# Test baskı
docker compose exec print-bridge node scripts/test-print.js
```

### 3. Yedek basım (geçici)

Print-bridge düzelene kadar KDS ekranına siparişleri düşür — mutfak
ekrandan takip etsin. Manager'a WhatsApp ile açıklama.

## Eskalasyon kriterleri

- 1 saat'te yazıcı yanıt vermiyorsa → fiziksel ziyaret (partner IT ekibi)
  veya yazıcı değişimi.
- Birden fazla yazıcı aynı anda düştüyse → ağ sorunu ihtimali, switch /
  router kontrolü.

## Doğrulama

- [ ] Test fiş basıldı
- [ ] Canlı sipariş baskıya düştü
- [ ] Kuyruk boş (`ls /var/spool/hashtap` temiz)
- [ ] Mutfak "her şey normal" onayı verdi
- [ ] Postmortem (tekrarlıyorsa)
