# Periyodik restore testi

**Sıklık:** Her 3 ayda bir.
**Sorumlu:** Ops rotasyonu (kontrol listesi).

## Amaç

"Backup çalışıyor mu?" sorusunun tek geçerli cevabı **başarılı bir
restore testidir**. Bu runbook'u geçmeyen yedekleme sistemi güvende
sayılmaz.

## Önkoşullar

- Test ortamı (Hetzner'da ayrılmış bir VM veya local Docker).
- Rastgele seçilmiş bir canlı restoran kurulumu (`rest-<id>`).
- Bu restoranın restic repo credentials'a erişim (KMS).
- Canlı restoran **etkilenmemeli** — test ayrı volume'da.

## Adımlar

### 1. Test ortamını hazırla

```bash
# Ops sunucusunda (veya temiz VM'de)
mkdir -p /tmp/restore-test/rest-<id>
cd /tmp/restore-test/rest-<id>

cp /opt/hashtap/docker-compose.yml .
cp /opt/hashtap/.env.example .env
# test portları değiştir (5432 → 5433 gibi)
```

### 2. Postgres'i başlat, volume boş

```bash
docker compose up -d postgres
sleep 10
```

### 3. Backup runner'ı restore moduna al

```bash
docker run --rm \
  -e RESTIC_REPOSITORY="..." \
  -e RESTIC_PASSWORD="..." \
  -e HASHTAP_INSTALLATION_ID="rest-<id>" \
  -e PGHOST=postgres -e PGUSER=hashtap \
  -e PGDATABASE=hashtap -e PGPASSWORD=hashtap \
  --network rest-<id>_default \
  hashtap/backup hashtap-restore latest
```

### 4. Sayım doğrulama

Canlı restoranla test kopyası arasındaki sayı farkları:

```bash
# Canlı (Tailscale ile)
ssh hashtap-ops@restaurant-<slug>
docker compose exec postgres psql -U hashtap -c \
  "SELECT count(*) FROM pos_order;"

# Test
docker compose exec postgres psql -U hashtap -c \
  "SELECT count(*) FROM pos_order;"
```

Fark en fazla 1 günlük sipariş hacmi kadar olabilir (RPO 24 saat).

### 5. Smoke test

```bash
# Test ortamında Odoo + gateway başlat
docker compose up -d

# Test sorguları:
curl http://localhost:4000/v1/menu/<any-table-slug>
curl http://localhost:8069/web/health
```

### 6. Rapor

`docs/runbooks/restore-test-log.md` (tutulacak):

| Tarih | Restoran | Süre (restore) | Sayım farkı | Sorun | Aksiyonlar |
|---|---|---|---|---|---|
| 2026-07-15 | rest-07 | 52 dk | +3 sipariş eksik | — | OK |

### 7. Temizlik

```bash
docker compose down -v
rm -rf /tmp/restore-test/rest-<id>
```

## Başarı kriterleri

- [ ] Restore 4 saatten az sürdü (RTO hedefi)
- [ ] Sayım farkı RPO (24 saat) sınırında
- [ ] Smoke test'ler geçti
- [ ] Hiç veri bozulması yok
- [ ] Log kaydı `restore-test-log.md`'e işlendi

## Başarısızsa

- **P0 restore başarısız** olayı aç — snapshot sağlıksız.
- Dual-custody şifre kontrol et — yanlışsa şifre recovery.
- Sonraki gece öncesi yeni snapshot zorunlu.
- Önleyici aksiyon: restore pipeline'da bug varsa düzelt (`infra/backup/`).
