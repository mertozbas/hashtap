# P2 — Gecelik backup başarısız

**Seviye:** P2 (tek gece); **P1** (üst üste 2 gece fail).

## Özet

restic snapshot alamadı: B2 bağlantı hatası, şifre yanlış, disk dolu
veya pg_dump başarısız.

## Tespit işaretleri

- Monitoring: `services.backup != "healthy"`.
- Dashboard: son snapshot 24+ saat önce.
- Heartbeat uyarısı: `backup_last_success_hours > 24`.

## Adımlar

### 1. Teşhis

```bash
ssh hashtap-ops@restaurant-<slug>
cd /opt/hashtap
docker compose logs backup --tail=200
```

**Senaryolar:**

**A. B2 / S3 bağlantı hatası:**
```bash
docker compose exec backup restic snapshots 2>&1 | head -20
# 403 → credentials rotation gerekli
# Timeout → restoran internet sorunu
```

**B. Şifre yanlış (restic repo init değiştiyse):**
- HashTap KMS'ten doğru şifre kontrol et.
- Dual-custody yedek (kasada zarf) kontrol et.

**C. Disk dolu (pg_dump için yer yok):**
```bash
df -h /backup
docker compose exec postgres du -sh /var/lib/postgresql/data
# Dump büyüklüğü için alan aç
```

**D. pg_dump hatası:**
```bash
docker compose exec backup pg_dump -h postgres -U hashtap hashtap \
  -f /tmp/test.dump
# Hata output'una bak, genellikle DB bağlantı veya encoding
```

### 2. Düzeltme

```bash
# Manuel backup tetikle
docker compose exec backup hashtap-backup

# Başarılıysa log kontrol
docker compose logs backup --tail=50
```

### 3. 2. gece üst üste fail → P1'e yükselt

Eğer sonraki gece de fail ederse:
- Kritik durum: restore olmadan çalışılamıyor
- Saha ziyaret + el ile pg_dump al, USB'ye kopyala
- B2 credentials tam rotate + repo sağlık kontrol

## Eskalasyon kriterleri

- 2 gece üst üste fail → P1, kurucu + ops lead'e uyarı.
- Şifre kaybedildi → **dual-custody zarf açma protokolü** devreye.
- B2 hesap sorunu → B2 destek bileti + alternatif S3 geçişi planı.

## Doğrulama

- [ ] En son snapshot bugünkü tarih (`restic snapshots | tail -3`)
- [ ] Snapshot içinde pg dump + filestore + config var
- [ ] Restore testi (test ortamında) başarılı
- [ ] Heartbeat `services.backup = healthy`

## Önleyici aksiyonlar

- Periyodik restore testi: `periyodic-restore-test.md` (3 ayda bir)
- B2 quota + billing alarm (aylık faturaya yakın uyarı)
- KMS şifre rotation prosedürü yazıldı mı?
