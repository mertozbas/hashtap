# HashTap — Backup runner

Restoran kurulumunda gecelik çalışan backup servisi. `pg_dump` +
`restic` ile şifreli snapshot alır, konfigüre edilen restic repo'suna
yazar (lokal path veya B2/S3).

Detay: [docs/OPERATIONS.md §5](../../docs/OPERATIONS.md).

## Ortam değişkenleri

Zorunlu:

| Değişken | Anlamı |
|---|---|
| `RESTIC_REPOSITORY` | Restic repo URL (ör. `s3:s3.eu-central-003.backblazeb2.com/hashtap-backups/rest-42`) |
| `RESTIC_PASSWORD` | Restic şifreleme anahtarı (dual-custody) |
| `HASHTAP_INSTALLATION_ID` | Kurulum kimliği (`rest-42` gibi) |

B2/S3 için ek:

| Değişken | Anlamı |
|---|---|
| `AWS_ACCESS_KEY_ID` | B2 Application Key ID |
| `AWS_SECRET_ACCESS_KEY` | B2 Application Key |

Postgres + dosya yolları (default'lar docker-compose kurulumuna göre):

| Değişken | Default |
|---|---|
| `PGHOST` | `postgres` |
| `PGPORT` | `5432` |
| `PGUSER` | `hashtap` |
| `PGPASSWORD` | `hashtap` |
| `PGDATABASE` | `hashtap` |
| `FILESTORE_PATH` | `/backup/filestore` |
| `CONFIG_PATH` | `/backup/config` |

## Zamanlama

`crontab` dosyası:

```
0  3 * * *  hashtap-backup
30 3 * * *  hashtap-prune
```

Retention: `--keep-daily 7 --keep-weekly 4 --keep-monthly 12 --keep-yearly 3`.

## Manuel komutlar

Servis çalışırken container içinde:

```bash
# Anlık backup
docker compose exec backup hashtap-backup

# Retention uygula
docker compose exec backup hashtap-prune

# Son snapshot'ı restore et (test ortamı)
docker compose exec -e RESTORE_DIR=/tmp/restore backup hashtap-restore latest

# Snapshot listesi
docker compose exec backup restic snapshots
```

## Dual-custody şifre yönetimi

- **Birincil:** HashTap KMS (Vault veya AWS KMS) — partner portal'ı
  üzerinden tek seferde bootstrap.
- **Yedek:** Restoran kasasında kapalı zarfta (fiziksel kopya).
- **Kural:** Şifre kaybı = tüm snapshot'ların kaybı. İki kopya ayrı
  yerlerde tutulur.

## Restore testi

Her 3 ayda bir rastgele bir kurulumda `docs/runbooks/periyodic-restore-test.md`
çalıştırılır. Test ortamında restore edilir, başarı/süre/sorun kayıt
altına alınır.

## Lokal geliştirme (S3/B2 gerektirmeden)

```bash
# host üzerinde hazırlık:
mkdir -p ./.restic-local
chmod 700 ./.restic-local

# .env:
RESTIC_REPOSITORY=/restic-repo
RESTIC_PASSWORD=dev-only-password
HASHTAP_INSTALLATION_ID=dev-install

# docker-compose.override.yml ile /restic-repo olarak mount et
```
