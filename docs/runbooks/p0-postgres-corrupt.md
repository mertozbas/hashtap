# P0 — Postgres başlamıyor / bozuk

**Seviye:** P0
**SLA:** 15 dk ilk müdahale, 2 saat çözüm hedefi.

## Özet

Postgres container başlamıyor, bağlantı hatası veriyor veya veri
bozulması şüphesi var. Odoo + gateway çalışmıyor → kasa ve QR menü kapalı.

## Tespit işaretleri

- Monitoring: `services.postgres != "healthy"`.
- Restoran: "kasa açılıyor ama menüler yüklenmiyor" şikâyeti.
- `docker compose logs postgres` → `FATAL: database files are incompatible`
  veya `PANIC: could not locate a valid checkpoint record`.

## Önkoşullar

- Tailscale ile restoran PC'sine SSH.
- restic + B2 credentials (son yedek restore senaryosu için).

## Adımlar

### 1. Teşhis

```bash
ssh hashtap-ops@restaurant-<slug>
cd /opt/hashtap
docker compose ps postgres
docker compose logs postgres --tail=200
```

Sık görülen senaryolar:

**A. Disk dolmuş:**
```bash
df -h
# /var/lib/docker üstünde %95+ ise
docker system prune -f  # image cleanup
docker compose restart postgres
```

**B. Pg versiyon uyumsuz (major upgrade sonrası):**
```bash
# Docker image'ı downgrade edip veriyi export et, sonra upgrade
```

**C. Veri bozuk (PANIC):**
→ Adım 3 (restore).

### 2. Hafif toparlanma denemeleri

```bash
# Container restart
docker compose restart postgres

# Log kontrol
docker compose logs -f postgres

# Eğer WAL sorunu:
docker compose exec postgres pg_resetwal /var/lib/postgresql/data  # SON ÇARE
```

`pg_resetwal` veri kaybına yol açabilir. Yapmadan önce son snapshot
testi yap:

```bash
# Disk imajı çıkar (Tailscale üzerinden slow ama güvenli)
docker compose exec postgres tar czf - /var/lib/postgresql/data \
  | ssh ops "cat > /backup/rest-<id>-$(date +%F).tgz"
```

### 3. Restore (restic'ten)

1 saat içinde lokal toparlanma olmazsa restic'e geç:

```bash
# Postgres'i durdur
docker compose stop postgres

# Mevcut data volume'unu yedekle (sorun tekrar ederse analiz için)
docker compose run --rm postgres \
  bash -c "tar czf /var/lib/postgresql/data-broken-$(date +%F).tgz \
    /var/lib/postgresql/data"

# Volume'u temizle
docker compose run --rm postgres \
  bash -c "rm -rf /var/lib/postgresql/data/*"

# Postgres'i tekrar başlat (boş initdb yapar)
docker compose up -d postgres
sleep 10

# Restore çalıştır
docker compose run --rm backup hashtap-restore latest

# Odoo + diğer servisleri başlat
docker compose up -d
```

### 4. Doğrulama

```bash
docker compose exec postgres psql -U hashtap -c "\dt"
docker compose exec postgres psql -U hashtap -c \
  "SELECT count(*) FROM pos_order;"
```

- Restoran personeli ile:
  - Son sipariş kayıtta mı (RPO 24 saat)?
  - Kasa, KDS, menü tam çalışıyor mu?
  - Ödeme akışı sandbox testi başarılı mı?

### 5. Kaçan siparişler (RPO 24 saat)

Son yedek ile olay anı arasındaki siparişler kaybolmuş olabilir.
Müşteriye **dürüst** bildirim:
- "Son 24 saat içindeki siparişlerden kaybolan olabilir, Z raporunda
  kontrol edelim."
- Kayıp tespit edilirse: KDV/e-Arşiv tutarlı hale getirmek için muhasebe
  düzeltme işlemi.

## Eskalasyon kriterleri

- 30 dk'da teşhis yoksa → ikinci on-call.
- 1 saat'te toparlanma yoksa → restore kararı al (veri kaybı riski göze
  alındı).
- 3 saat'te hala aşağıda → saha ziyareti / donanım şüphesi.

## Doğrulama

- [ ] Heartbeat yeşil, `services.postgres == "healthy"`
- [ ] Son sipariş Odoo'dan gözleniyor
- [ ] Müşteriye veri kaybı bilgisi verildi (varsa)
- [ ] Postmortem açıldı
- [ ] Bozuk volume yedeği saklandı (analiz için)

## Önleyici aksiyonlar

- Gece backup başarısı zorunlu → 2 gece fail uyarısı var
- Yüksek hacim restoranı için saatlik `pg_dump` → local retention (RPO
  1 saate iner)
- Disk uyarısı %85'te → gelmesi için monitoring
